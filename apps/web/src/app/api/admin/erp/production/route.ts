import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const STAGES_SEQUENCE = ['cutting', 'stitching', 'washing', 'finishing', 'packing'] as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_production');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('production_orders')
      .select(`
        *,
        product:products (id, name, slug, is_active, base_price, mrp, images:product_images(id, path)),
        variant:product_variants (id, size, fit, wash, sku, stock_qty),
        stages:production_stages (*)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: productionOrders, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, productionOrders: productionOrders || [] });
  } catch (err: any) {
    console.error('[Admin Production GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_production');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();
    const {
      product_id,
      variant_id,
      planned_qty,
      size_allocations,
      allow_shortfall = false,
      notes,
    } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Build normalized size allocations
    let resolvedAllocations: Array<{
      variant_id: string;
      size: string;
      sku: string;
      planned_qty: number;
      completed_qty: number;
    }> = [];

    if (Array.isArray(size_allocations) && size_allocations.length > 0) {
      const validAllocs = size_allocations.filter(
        (a: any) => a?.variant_id && Number(a?.planned_qty || 0) > 0
      );
      if (validAllocs.length > 0) {
        const variantIds = validAllocs.map((a: any) => a.variant_id);
        const { data: varRows } = (await supabase
          .from('product_variants')
          .select('id, size, sku')
          .in('id', variantIds)) as any;

        const varMap = new Map<string, any>();
        for (const v of varRows || []) varMap.set(v.id, v);

        resolvedAllocations = validAllocs.map((a: any) => {
          const v = varMap.get(a.variant_id);
          return {
            variant_id: a.variant_id,
            size: String(v?.size || a.size || 'Std'),
            sku: String(v?.sku || a.sku || ''),
            planned_qty: Math.round(Number(a.planned_qty)),
            completed_qty: 0,
          };
        });
      }
    } else if (variant_id && Number(planned_qty || 0) > 0) {
      const { data: singleVar } = (await supabase
        .from('product_variants')
        .select('id, size, sku')
        .eq('id', variant_id)
        .single()) as any;
      if (singleVar) {
        resolvedAllocations = [
          {
            variant_id: singleVar.id,
            size: singleVar.size,
            sku: singleVar.sku,
            planned_qty: Math.round(Number(planned_qty)),
            completed_qty: 0,
          },
        ];
      }
    }

    const totalPlannedQty =
      resolvedAllocations.length > 0
        ? resolvedAllocations.reduce((s, a) => s + a.planned_qty, 0)
        : Math.round(Number(planned_qty || 0));

    if (!totalPlannedQty || totalPlannedQty <= 0) {
      return NextResponse.json(
        { error: 'Valid planned quantity (> 0) or size ratio quantities are required' },
        { status: 400 }
      );
    }

    // 1. Pre-flight BOM consumption & stock validation (including scrap_percent)
    const { data: bomLines } = (await supabase
      .from('boms')
      .select('*, raw_material:raw_materials(*)')
      .eq('product_id', product_id)) as any;

    const plannedConsumptions: Array<{
      raw_material_id: string;
      name: string;
      unit: string;
      required: number;
      available: number;
    }> = [];

    const shortfalls: Array<{
      raw_material_id: string;
      name: string;
      unit: string;
      required: number;
      available: number;
      shortfall: number;
    }> = [];

    if (bomLines && bomLines.length > 0) {
      for (const bom of bomLines) {
        if (!bom.raw_material) continue;
        const scrapMult = 1 + Number(bom.scrap_percent || 0) / 100;
        const rawRequired = Number(bom.qty_per_piece) * scrapMult * totalPlannedQty;
        const required = Math.round(rawRequired * 1000) / 1000;
        const available = Number(bom.raw_material.stock_qty || 0);

        plannedConsumptions.push({
          raw_material_id: bom.raw_material_id,
          name: bom.raw_material.name,
          unit: bom.raw_material.unit,
          required,
          available,
        });

        if (available < required - 0.0001) {
          shortfalls.push({
            raw_material_id: bom.raw_material_id,
            name: bom.raw_material.name,
            unit: bom.raw_material.unit,
            required,
            available,
            shortfall: Math.round((required - available) * 1000) / 1000,
          });
        }
      }
    }

    if (shortfalls.length > 0 && !allow_shortfall) {
      return NextResponse.json(
        {
          error: `Insufficient raw material stock for ${shortfalls[0].name} (Need ${shortfalls[0].required} ${shortfalls[0].unit}, Available ${shortfalls[0].available}).`,
          shortfalls,
        },
        { status: 400 }
      );
    }

    // 2. Sequential production batch number
    let orderNo = '';
    const { data: seqNo } = await (supabase.rpc as any)('next_erp_doc_no', { doc_type: 'PRD' });
    if (seqNo) {
      orderNo = String(seqNo);
    } else {
      const year = new Date().getFullYear();
      orderNo = `TLD-PRD-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const primaryVariantId =
      variant_id || (resolvedAllocations.length === 1 ? resolvedAllocations[0].variant_id : null);

    // 3. Insert production order
    const { data: batch, error: batchErr } = (await (supabase.from('production_orders') as any)
      .insert({
        order_no: orderNo,
        product_id,
        variant_id: primaryVariantId,
        planned_qty: totalPlannedQty,
        completed_qty: 0,
        status: 'in_progress',
        size_allocations: resolvedAllocations,
        allow_shortfall: Boolean(allow_shortfall),
        notes: notes ? String(notes).trim() : null,
      })
      .select('*')
      .single()) as any;

    if (batchErr) throw batchErr;

    // 4. Initialize 5 sequential stages
    const stagesPayload = STAGES_SEQUENCE.map((stage, idx) => ({
      production_order_id: batch.id,
      stage,
      qty_in: idx === 0 ? totalPlannedQty : 0,
      qty_out: 0,
      wastage: 0,
      started_at: idx === 0 ? new Date().toISOString() : null,
    }));

    const { error: stagesErr } = await (supabase.from('production_stages') as any).insert(
      stagesPayload
    );
    if (stagesErr) throw stagesErr;

    // 5. Deduct BOM materials & record exact consumed_materials snapshot for rollback
    const consumedSnapshot: Array<{ raw_material_id: string; qty: number }> = [];

    for (const item of plannedConsumptions) {
      const nextStock = Math.max(0, Math.round((item.available - item.required) * 1000) / 1000);
      const actualDeducted = Math.round((item.available - nextStock) * 1000) / 1000;

      if (actualDeducted > 0) {
        consumedSnapshot.push({
          raw_material_id: item.raw_material_id,
          qty: actualDeducted,
        });

        await (supabase.from('raw_materials') as any)
          .update({
            stock_qty: nextStock,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.raw_material_id);

        await (supabase.from('stock_ledger') as any).insert({
          item_type: 'raw_material',
          item_id: item.raw_material_id,
          change: -actualDeducted,
          reason: 'production_out',
          ref_id: batch.id,
        });
      }
    }

    if (consumedSnapshot.length > 0) {
      await (supabase.from('production_orders') as any)
        .update({ consumed_materials: consumedSnapshot })
        .eq('id', batch.id);
    }

    return NextResponse.json({
      success: true,
      productionOrder: { ...batch, consumed_materials: consumedSnapshot },
    });
  } catch (err: any) {
    console.error('[Admin Production POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_production');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();
    const {
      action,
      stage_id,
      production_order_id,
      qty_out,
      wastage = 0,
      assigned_to,
      mark_stage_complete = false,
      completed_size_allocations,
      cancel_reason,
    } = body;

    if (!production_order_id) {
      return NextResponse.json({ error: 'production_order_id is required' }, { status: 400 });
    }

    // Handle Batch Cancellation + Raw Material BOM Rollback
    if (action === 'cancel') {
      const { data: order, error: ordErr } = (await supabase
        .from('production_orders')
        .select('*')
        .eq('id', production_order_id)
        .single()) as any;

      if (ordErr || !order) {
        return NextResponse.json({ error: 'Production order not found' }, { status: 404 });
      }
      if (order.status === 'completed' || order.status === 'cancelled') {
        return NextResponse.json(
          { error: `Cannot cancel a ${order.status} batch` },
          { status: 400 }
        );
      }

      const consumed: Array<{ raw_material_id: string; qty: number }> = Array.isArray(
        order.consumed_materials
      )
        ? order.consumed_materials
        : [];

      let reversedCount = 0;
      for (const item of consumed) {
        const qtyToReturn = Number(item.qty || 0);
        if (!item.raw_material_id || qtyToReturn <= 0) continue;

        const { data: mat } = (await supabase
          .from('raw_materials')
          .select('stock_qty')
          .eq('id', item.raw_material_id)
          .single()) as any;

        const currentStock = Number(mat?.stock_qty || 0);
        const restoredStock = Math.round((currentStock + qtyToReturn) * 1000) / 1000;

        await (supabase.from('raw_materials') as any)
          .update({ stock_qty: restoredStock, updated_at: new Date().toISOString() })
          .eq('id', item.raw_material_id);

        await (supabase.from('stock_ledger') as any).insert({
          item_type: 'raw_material',
          item_id: item.raw_material_id,
          change: qtyToReturn,
          reason: 'production_cancel_reversal',
          ref_id: production_order_id,
        });
        reversedCount++;
      }

      const nextNotes = cancel_reason
        ? `${order.notes ? order.notes + '\n' : ''}[Cancelled]: ${String(cancel_reason).trim()}`
        : order.notes;

      const { error: cancelUpdateErr } = await (supabase.from('production_orders') as any)
        .update({
          status: 'cancelled',
          notes: nextNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', production_order_id);

      if (cancelUpdateErr) throw cancelUpdateErr;

      return NextResponse.json({
        success: true,
        cancelled: true,
        reversed_materials: reversedCount,
      });
    }

    // Stage progress update
    if (!stage_id) {
      return NextResponse.json(
        { error: 'stage_id and production_order_id are required' },
        { status: 400 }
      );
    }

    const { data: currentStage, error: stageFetchErr } = (await supabase
      .from('production_stages')
      .select('*')
      .eq('id', stage_id)
      .single()) as any;

    if (stageFetchErr || !currentStage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    // MANDATORY / WARNING QC GATE BEFORE PACKING COMPLETION
    if (mark_stage_complete && currentStage.stage === 'packing') {
      const { data: qcs } = (await supabase
        .from('erp_qc_inspections')
        .select('id, status, pass_qty')
        .eq('production_order_id', production_order_id)) as any;

      const hasPassedQc =
        Array.isArray(qcs) &&
        qcs.some((q) => q.status === 'passed' && Number(q.pass_qty || 0) > 0);
      const overrideQcGate = Boolean(body.override_qc_gate);

      if (!hasPassedQc && !overrideQcGate) {
        return NextResponse.json(
          {
            error:
              'QC Gate Warning: No passed AQL final garment inspection found for this batch in QC Lab. Please log QC inspection or check "Override QC Gate" to proceed with carton packing.',
            requires_qc_override: true,
          },
          { status: 400 }
        );
      }
    }

    const stageIndex = STAGES_SEQUENCE.indexOf(currentStage.stage as any);
    const outQty = Number(qty_out || 0);
    const scrapQty = Number(wastage || 0);

    await (supabase.from('production_stages') as any)
      .update({
        qty_out: outQty,
        wastage: scrapQty,
        assigned_to: assigned_to || currentStage.assigned_to,
        ended_at: mark_stage_complete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stage_id);

    if (mark_stage_complete && stageIndex < STAGES_SEQUENCE.length - 1) {
      const nextStageName = STAGES_SEQUENCE[stageIndex + 1];
      await (supabase.from('production_stages') as any)
        .update({
          qty_in: outQty,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('production_order_id', production_order_id)
        .eq('stage', nextStageName);
    }

    // Final stage (Packing) completes batch and adds finished garments to SKU inventory
    if (mark_stage_complete && currentStage.stage === 'packing') {
      const { data: batch } = (await supabase
        .from('production_orders')
        .select('*')
        .eq('id', production_order_id)
        .single()) as any;

      const existingAllocs: any[] = Array.isArray(batch?.size_allocations)
        ? batch.size_allocations
        : [];

      let finalAllocs = existingAllocs;

      if (existingAllocs.length > 0 && outQty > 0) {
        if (Array.isArray(completed_size_allocations) && completed_size_allocations.length > 0) {
          const compMap = new Map<string, number>();
          for (const c of completed_size_allocations) {
            compMap.set(c.variant_id, Math.max(0, Math.round(Number(c.completed_qty || 0))));
          }
          finalAllocs = existingAllocs.map((a) => ({
            ...a,
            completed_qty: compMap.has(a.variant_id)
              ? compMap.get(a.variant_id)!
              : a.planned_qty,
          }));
        } else {
          // Proportional split summing to exact outQty
          const totalPlanned = existingAllocs.reduce((s, a) => s + Number(a.planned_qty || 0), 0);
          let assignedSoFar = 0;
          finalAllocs = existingAllocs.map((a, idx) => {
            if (idx === existingAllocs.length - 1) {
              return { ...a, completed_qty: Math.max(0, outQty - assignedSoFar) };
            }
            const share =
              totalPlanned > 0 ? Math.round((Number(a.planned_qty || 0) / totalPlanned) * outQty) : 0;
            assignedSoFar += share;
            return { ...a, completed_qty: share };
          });
        }

        for (const alloc of finalAllocs) {
          const creditQty = Number(alloc.completed_qty || 0);
          if (!alloc.variant_id || creditQty <= 0) continue;

          const { data: variant } = (await supabase
            .from('product_variants')
            .select('stock_qty')
            .eq('id', alloc.variant_id)
            .single()) as any;

          if (variant) {
            await (supabase.from('product_variants') as any)
              .update({
                stock_qty: Number(variant.stock_qty || 0) + creditQty,
                updated_at: new Date().toISOString(),
              })
              .eq('id', alloc.variant_id);

            await (supabase.from('stock_ledger') as any).insert({
              item_type: 'finished_variant',
              item_id: alloc.variant_id,
              change: creditQty,
              reason: 'production_in',
              ref_id: production_order_id,
            });
          }
        }
      } else if (batch?.variant_id && outQty > 0) {
        const { data: variant } = (await supabase
          .from('product_variants')
          .select('stock_qty')
          .eq('id', batch.variant_id)
          .single()) as any;

        if (variant) {
          await (supabase.from('product_variants') as any)
            .update({
              stock_qty: Number(variant.stock_qty || 0) + outQty,
              updated_at: new Date().toISOString(),
            })
            .eq('id', batch.variant_id);

          await (supabase.from('stock_ledger') as any).insert({
            item_type: 'finished_variant',
            item_id: batch.variant_id,
            change: outQty,
            reason: 'production_in',
            ref_id: production_order_id,
          });
        }
      }

      const totalCompleted =
        finalAllocs.length > 0 && Array.isArray(completed_size_allocations)
          ? finalAllocs.reduce((s, a) => s + Number(a.completed_qty || 0), 0)
          : outQty;

      await (supabase.from('production_orders') as any)
        .update({
          status: 'completed',
          completed_qty: totalCompleted,
          size_allocations: finalAllocs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', production_order_id);

      // Revalidate storefront cache so finished stock is immediately accessible
      try {
        revalidatePath('/products');
        revalidatePath('/');
        if (batch?.product_id) {
          const { data: prod } = (await supabase
            .from('products')
            .select('slug')
            .eq('id', batch.product_id)
            .single()) as any;
          if (prod?.slug) {
            revalidatePath(`/products/${prod.slug}`);
          }
        }
      } catch (cacheErr) {
        console.warn('[Production Completion Revalidation Warning]:', cacheErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Stage progress updated' });
  } catch (err: any) {
    console.error('[Admin Production PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
