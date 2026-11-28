import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasAdminPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'erp')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orders, error } = await supabase
      .from('production_orders')
      .select(`
        *,
        product:products (id, name, slug),
        variant:product_variants (id, size, fit, wash, sku),
        stages:production_stages (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, productionOrders: orders || [] });
  } catch (err: any) {
    console.error('[Admin Production GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'erp')) {
      return NextResponse.json({ error: 'Forbidden: Missing erp permission' }, { status: 403 });
    }

    const body = await request.json();
    const { product_id, variant_id, planned_qty, notes } = body;

    if (!product_id || !planned_qty || Number(planned_qty) <= 0) {
      return NextResponse.json({ error: 'Product and valid planned quantity are required' }, { status: 400 });
    }

    // 1. Generate Order Number: TLD-PRD-YYYY-NNN
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const orderNo = `TLD-PRD-${year}-${randomSeq}`;

    // 2. Insert production order
    const { data: order, error: orderErr } = (await (supabase.from('production_orders') as any)
      .insert({
        order_no: orderNo,
        product_id,
        variant_id: variant_id || null,
        planned_qty: Number(planned_qty),
        completed_qty: 0,
        status: 'in_progress',
        notes: notes || null,
      })
      .select('*')
      .single()) as any;

    if (orderErr) throw orderErr;

    // 3. Initialize all 5 physical manufacturing stages
    const stages = [
      { stage: 'cutting', qty_in: Number(planned_qty), qty_out: 0, wastage: 0, assigned_to: 'Masterji Cutting Dept' },
      { stage: 'stitching', qty_in: 0, qty_out: 0, wastage: 0, assigned_to: 'Stitching Line A' },
      { stage: 'washing', qty_in: 0, qty_out: 0, wastage: 0, assigned_to: 'Enzyme Stone Wash Station' },
      { stage: 'finishing', qty_in: 0, qty_out: 0, wastage: 0, assigned_to: 'Rivet & Trim Press Dept' },
      { stage: 'packing', qty_in: 0, qty_out: 0, wastage: 0, assigned_to: 'Poly-Mailer & Carton Packing' },
    ];

    const stageRows = stages.map((st) => ({
      production_order_id: order.id,
      stage: st.stage,
      qty_in: st.qty_in,
      qty_out: st.qty_out,
      wastage: st.wastage,
      assigned_to: st.assigned_to,
      started_at: st.stage === 'cutting' ? new Date().toISOString() : null,
    }));

    await (supabase.from('production_stages') as any).insert(stageRows);

    // 4. Auto-deduct Raw Materials based on Bill of Materials (BOM)
    const { data: bomRows } = (await supabase
      .from('boms')
      .select('raw_material_id, qty_per_piece')
      .eq('product_id', product_id)) as any;

    let bomDeductedCount = 0;
    if (bomRows && bomRows.length > 0) {
      for (const bom of bomRows) {
        const consumeQty = Number(bom.qty_per_piece || 0) * Number(planned_qty);
        if (consumeQty <= 0) continue;

        const { data: rm } = (await supabase
          .from('raw_materials')
          .select('stock_qty')
          .eq('id', bom.raw_material_id)
          .single()) as any;

        if (rm) {
          const nextStock = Math.max(0, Number(rm.stock_qty || 0) - consumeQty);
          await (supabase.from('raw_materials') as any)
            .update({ stock_qty: nextStock, updated_at: new Date().toISOString() })
            .eq('id', bom.raw_material_id);

          await (supabase.from('stock_ledger') as any).insert({
            item_type: 'raw_material',
            item_id: bom.raw_material_id,
            change: -consumeQty,
            reason: 'production_out',
            ref_id: order.id,
          });
          bomDeductedCount += 1;
        }
      }
    }

    return NextResponse.json({
      success: true,
      productionOrder: order,
      bomDeductedCount,
    });
  } catch (err: any) {
    console.error('[Admin Production POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'erp')) {
      return NextResponse.json({ error: 'Forbidden: Missing erp permission' }, { status: 403 });
    }

    const body = await request.json();
    const { stage_id, production_order_id, qty_out, wastage = 0, assigned_to, mark_stage_complete } = body;

    if (!stage_id || !production_order_id) {
      return NextResponse.json({ error: 'Stage ID and Production Order ID are required' }, { status: 400 });
    }

    // 1. Fetch stage record
    const { data: stage, error: stageErr } = (await supabase
      .from('production_stages')
      .select('*')
      .eq('id', stage_id)
      .single()) as any;

    if (stageErr || !stage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    const outNum = Number(qty_out || 0);
    const wasteNum = Number(wastage || 0);

    const stageUpdate: any = {
      qty_out: outNum,
      wastage: wasteNum,
      updated_at: new Date().toISOString(),
    };

    if (assigned_to) stageUpdate.assigned_to = assigned_to;
    if (mark_stage_complete) stageUpdate.ended_at = new Date().toISOString();

    await (supabase.from('production_stages') as any)
      .update(stageUpdate)
      .eq('id', stage_id);

    // 2. If stage is complete, advance next stage or finalize order
    const stageSequence = ['cutting', 'stitching', 'washing', 'finishing', 'packing'];
    const currentIdx = stageSequence.indexOf(stage.stage);

    if (currentIdx < stageSequence.length - 1) {
      const nextStageName = stageSequence[currentIdx + 1];
      await (supabase.from('production_stages') as any)
        .update({
          qty_in: outNum,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('production_order_id', production_order_id)
        .eq('stage', nextStageName);
    } else if (stage.stage === 'packing') {
      // Check current production order status before incrementing finished stock (idempotent guard)
      const { data: prodOrder } = (await supabase
        .from('production_orders')
        .select('id, status, variant_id, order_no')
        .eq('id', production_order_id)
        .single()) as any;

      const wasCompleted = prodOrder?.status === 'completed';

      // Completed final stage: update production order completed_qty and mark completed
      await (supabase.from('production_orders') as any)
        .update({
          completed_qty: outNum,
          status: mark_stage_complete ? 'completed' : 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', production_order_id);

      // Auto-add finished units to variant stock & stock_ledger when first completed
      if (mark_stage_complete && !wasCompleted && prodOrder?.variant_id && outNum > 0) {
        const { data: variant } = (await supabase
          .from('product_variants')
          .select('stock_qty')
          .eq('id', prodOrder.variant_id)
          .single()) as any;

        if (variant) {
          const nextVariantQty = Number(variant.stock_qty || 0) + outNum;
          await (supabase.from('product_variants') as any)
            .update({ stock_qty: nextVariantQty, updated_at: new Date().toISOString() })
            .eq('id', prodOrder.variant_id);

          await (supabase.from('stock_ledger') as any).insert({
            item_type: 'finished_variant',
            item_id: prodOrder.variant_id,
            change: outNum,
            reason: 'production_in',
            ref_id: production_order_id,
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Stage updated successfully' });
  } catch (err: any) {
    console.error('[Admin Production PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
