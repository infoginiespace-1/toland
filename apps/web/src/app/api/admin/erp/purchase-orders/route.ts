import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || (user.app_metadata?.role !== 'admin' && user.app_metadata?.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: pos, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers (*),
        items:purchase_order_items (
          *,
          raw_material:raw_materials (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, purchaseOrders: pos || [] });
  } catch (err: any) {
    console.error('[Admin POs GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const body = await request.json();
    const { supplier_id, status = 'ordered', items = [] } = body;

    if (!supplier_id || items.length === 0) {
      return NextResponse.json({ error: 'Supplier and at least one line item are required' }, { status: 400 });
    }

    // 1. Generate unique PO Number: TLD-PO-YYYY-NNNNN
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const poNo = `TLD-PO-${year}-${randomSeq}`;

    // 2. Compute total amount
    const totalAmount = items.reduce((acc: number, it: any) => {
      return acc + Number(it.qty || 0) * Number(it.unit_price || 0);
    }, 0);

    // 3. Insert purchase order
    const { data: po, error: poErr } = (await (supabase.from('purchase_orders') as any)
      .insert({
        po_no: poNo,
        supplier_id,
        status,
        total_amount: totalAmount,
      })
      .select('*')
      .single()) as any;

    if (poErr) throw poErr;

    // 4. Insert line items
    const itemRows = items.map((it: any) => ({
      purchase_order_id: po.id,
      raw_material_id: it.raw_material_id,
      qty: Number(it.qty),
      unit_price: Number(it.unit_price),
      total: Number(it.qty) * Number(it.unit_price),
    }));

    await (supabase.from('purchase_order_items') as any).insert(itemRows);

    return NextResponse.json({ success: true, purchaseOrder: po });
  } catch (err: any) {
    console.error('[Admin POs POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'PO ID and status are required' }, { status: 400 });
    }

    // Fetch existing PO with items
    const { data: po, error: fetchErr } = (await supabase
      .from('purchase_orders')
      .select(`
        *,
        items:purchase_order_items (*)
      `)
      .eq('id', id)
      .single()) as any;

    if (fetchErr || !po) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
    }

    const prevStatus = po.status;

    // Update status
    const { data: updated, error: updateErr } = (await (supabase.from('purchase_orders') as any)
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()) as any;

    if (updateErr) throw updateErr;

    // If transitioning to 'received', automatically add inventory stock to raw_materials & log stock_ledger!
    if (status === 'received' && prevStatus !== 'received') {
      const items = po.items || [];
      for (const item of items) {
        const matId = item.raw_material_id;
        const addQty = Number(item.qty || 0);

        // Fetch current material stock
        const { data: mat } = (await supabase
          .from('raw_materials')
          .select('stock_qty')
          .eq('id', matId)
          .single()) as any;

        if (mat) {
          const nextStock = Number(mat.stock_qty || 0) + addQty;
          await (supabase.from('raw_materials') as any)
            .update({ stock_qty: nextStock, updated_at: new Date().toISOString() })
            .eq('id', matId);

          // Log in immutable stock_ledger
          await (supabase.from('stock_ledger') as any).insert({
            item_type: 'raw_material',
            item_id: matId,
            change: addQty,
            reason: `po_receipt (${po.po_no})`,
            ref_id: po.id,
          });
        }
      }
    }

    return NextResponse.json({ success: true, purchaseOrder: updated });
  } catch (err: any) {
    console.error('[Admin POs PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
