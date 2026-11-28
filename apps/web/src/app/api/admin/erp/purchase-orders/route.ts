import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_purchase_orders');
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

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: purchaseOrders, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, purchaseOrders: purchaseOrders || [] });
  } catch (err: any) {
    console.error('[Admin Purchase Orders GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_purchase_orders');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();
    const {
      supplier_id,
      items,
      status = 'ordered',
      gst_amount = 0,
      supplier_invoice_no,
      expected_date,
      notes,
    } = body;

    if (!supplier_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier ID and at least one material line item are required' },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.qty || 0) * Number(item.unit_price || 0),
      0
    );
    const safeGst = Math.max(0, Number(gst_amount || 0));
    const totalAmount = Math.round((subtotal + safeGst) * 100) / 100;

    let poNo = '';
    const { data: seqNo } = await (supabase.rpc as any)('next_erp_doc_no', { doc_type: 'PO' });
    if (seqNo) {
      poNo = String(seqNo);
    } else {
      const year = new Date().getFullYear();
      poNo = `TLD-PO-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const { data: po, error: poErr } = (await (supabase.from('purchase_orders') as any)
      .insert({
        po_no: poNo,
        supplier_id,
        status,
        total_amount: totalAmount,
        gst_amount: safeGst,
        supplier_invoice_no: supplier_invoice_no ? String(supplier_invoice_no).trim() : null,
        expected_date: expected_date || null,
        notes: notes ? String(notes).trim() : null,
        payment_status: 'unpaid',
        paid_amount: 0,
      })
      .select('*')
      .single()) as any;

    if (poErr) throw poErr;

    const poItemsPayload = items.map((item: any) => ({
      purchase_order_id: po.id,
      raw_material_id: item.raw_material_id,
      qty: Number(item.qty),
      received_qty: 0,
      unit_price: Number(item.unit_price),
      total: Number(item.qty) * Number(item.unit_price),
    }));

    const { error: itemsErr } = await (supabase.from('purchase_order_items') as any).insert(
      poItemsPayload
    );

    if (itemsErr) throw itemsErr;

    return NextResponse.json({ success: true, purchaseOrder: po });
  } catch (err: any) {
    console.error('[Admin Purchase Orders POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_purchase_orders');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();
    const {
      id,
      action,
      status,
      receive_items,
      supplier_invoice_no,
      paid_amount,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Purchase Order ID is required' }, { status: 400 });
    }

    const { data: existingPo, error: fetchErr } = (await supabase
      .from('purchase_orders')
      .select('*, items:purchase_order_items(*)')
      .eq('id', id)
      .single()) as any;

    if (fetchErr || !existingPo) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
    }

    // 1. Update supplier payment & invoice tracking
    if (action === 'update_payment') {
      const nextPaid = Math.max(0, Number(paid_amount ?? existingPo.paid_amount ?? 0));
      const total = Number(existingPo.total_amount || 0);
      const nextPaymentStatus =
        total > 0 && nextPaid >= total ? 'paid' : nextPaid > 0 ? 'partial' : 'unpaid';

      const { data: updated, error: payErr } = (await (supabase.from('purchase_orders') as any)
        .update({
          paid_amount: nextPaid,
          payment_status: nextPaymentStatus,
          supplier_invoice_no:
            supplier_invoice_no !== undefined
              ? supplier_invoice_no
                ? String(supplier_invoice_no).trim()
                : null
              : existingPo.supplier_invoice_no,
          notes: notes !== undefined ? notes : existingPo.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()) as any;

      if (payErr) throw payErr;
      return NextResponse.json({ success: true, purchaseOrder: updated });
    }

    // 2. Cancel PO (only if nothing received yet)
    if (action === 'cancel' || status === 'cancelled') {
      const anyReceived = (existingPo.items || []).some(
        (it: any) => Number(it.received_qty || 0) > 0
      );
      if (anyReceived || existingPo.status === 'received' || existingPo.status === 'partial') {
        return NextResponse.json(
          { error: 'Cannot cancel PO after goods have been partially or fully received' },
          { status: 400 }
        );
      }

      const { data: cancelledPo, error: cancelErr } = (await (
        supabase.from('purchase_orders') as any
      )
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()) as any;

      if (cancelErr) throw cancelErr;
      return NextResponse.json({ success: true, purchaseOrder: cancelledPo });
    }

    // 3. Partial or Full GRN Receiving
    if (action === 'receive_grn' || status === 'received') {
      if (existingPo.status === 'received' || existingPo.status === 'cancelled') {
        return NextResponse.json(
          { error: `Purchase Order is already ${existingPo.status}` },
          { status: 400 }
        );
      }

      const poItems: any[] = existingPo.items || [];
      const receiveMap = new Map<string, number>();
      if (Array.isArray(receive_items)) {
        for (const r of receive_items) {
          if (r?.id) receiveMap.set(r.id, Math.max(0, Number(r.receive_qty || 0)));
        }
      }

      let totalUnitsReceivedThisGrn = 0;

      for (const item of poItems) {
        const orderedQty = Number(item.qty || 0);
        const alreadyReceived = Number(item.received_qty || 0);
        const remaining = Math.max(0, orderedQty - alreadyReceived);

        const delta = Array.isArray(receive_items)
          ? Math.min(remaining, receiveMap.get(item.id) || 0)
          : remaining;

        if (delta <= 0) continue;

        totalUnitsReceivedThisGrn += delta;
        const nextItemReceived = Math.round((alreadyReceived + delta) * 1000) / 1000;

        await (supabase.from('purchase_order_items') as any)
          .update({ received_qty: nextItemReceived })
          .eq('id', item.id);

        const { data: mat } = (await supabase
          .from('raw_materials')
          .select('stock_qty')
          .eq('id', item.raw_material_id)
          .single()) as any;

        const currentStock = Number(mat?.stock_qty || 0);
        const newStock = Math.round((currentStock + delta) * 1000) / 1000;

        await (supabase.from('raw_materials') as any)
          .update({
            stock_qty: newStock,
            unit_price: Number(item.unit_price),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.raw_material_id);

        await (supabase.from('stock_ledger') as any).insert({
          item_type: 'raw_material',
          item_id: item.raw_material_id,
          change: delta,
          reason: 'purchase',
          ref_id: id,
        });

        item.received_qty = nextItemReceived;
      }

      if (totalUnitsReceivedThisGrn <= 0) {
        return NextResponse.json(
          { error: 'Specify at least one item quantity greater than 0 to receive' },
          { status: 400 }
        );
      }

      const allComplete = poItems.every(
        (it: any) => Number(it.received_qty || 0) >= Number(it.qty || 0) - 0.0001
      );
      const nextStatus = allComplete ? 'received' : 'partial';

      const { data: updatedPo, error: upErr } = (await (supabase.from('purchase_orders') as any)
        .update({
          status: nextStatus,
          supplier_invoice_no:
            supplier_invoice_no !== undefined
              ? supplier_invoice_no
                ? String(supplier_invoice_no).trim()
                : null
              : existingPo.supplier_invoice_no,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()) as any;

      if (upErr) throw upErr;

      return NextResponse.json({
        success: true,
        purchaseOrder: updatedPo,
        message:
          nextStatus === 'received'
            ? 'All goods received and credited to raw material inventory.'
            : 'Partial GRN recorded and credited to raw material inventory.',
      });
    }

    // 4. Generic status update (e.g. draft -> ordered)
    const { data: updated, error: updateErr } = (await (supabase.from('purchase_orders') as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()) as any;

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, purchaseOrder: updated });
  } catch (err: any) {
    console.error('[Admin Purchase Orders PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
