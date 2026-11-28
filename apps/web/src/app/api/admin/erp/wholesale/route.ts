import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_wholesale');
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
      .from('erp_wholesale_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, orders: orders || [] });
  } catch (err: any) {
    console.error('[Admin ERP Wholesale GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_wholesale');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();
    const {
      buyer_name,
      buyer_company,
      buyer_phone,
      buyer_gst,
      buyer_address,
      items,
      gst_percent = 12,
      credit_limit = 0,
      payment_terms = 'Net 15 Days',
      status = 'quote',
      notes,
    } = body;

    if (!buyer_name || !buyer_phone || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Buyer name, phone, and at least one wholesale line item are required' },
        { status: 400 }
      );
    }

    const normalizedItems = items.map((it: any) => {
      const qty = Math.max(1, Math.round(Number(it.qty || 1)));
      const unitPrice = Math.max(0, Number(it.unit_price || 0));
      return {
        product_id: it.product_id,
        product_name: String(it.product_name || 'Denim Style'),
        variant_id: it.variant_id || null,
        size: String(it.size || 'Assorted'),
        sku: String(it.sku || ''),
        qty,
        unit_price: unitPrice,
        tier_applied: it.tier_applied || null,
        line_total: Math.round(qty * unitPrice * 100) / 100,
      };
    });

    const subtotal = normalizedItems.reduce((s: number, it: any) => s + it.line_total, 0);
    const gstPct = Math.max(0, Number(gst_percent || 0));
    const gstAmount = Math.round(((subtotal * gstPct) / 100) * 100) / 100;
    const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;

    // Link existing CRM customer if phone matches
    const digits = String(buyer_phone).replace(/\D/g, '').slice(-10);
    let crmId: string | null = null;
    if (digits.length === 10) {
      const { data: crm } = (await supabase
        .from('customers_crm')
        .select('id')
        .or(`phone.eq.+91${digits},phone.eq.${digits}`)
        .limit(1)
        .maybeSingle()) as any;
      if (crm?.id) crmId = crm.id;
    }

    let quoteNo = '';
    const { data: seqNo } = await (supabase.rpc as any)('next_erp_doc_no', { doc_type: 'B2B' });
    if (seqNo) {
      quoteNo = String(seqNo);
    } else {
      quoteNo = `TLD-B2B-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const { data: order, error } = (await (supabase.from('erp_wholesale_orders') as any)
      .insert({
        quote_no: quoteNo,
        buyer_name: String(buyer_name).trim(),
        buyer_company: buyer_company ? String(buyer_company).trim() : null,
        buyer_phone: String(buyer_phone).trim(),
        buyer_gst: buyer_gst ? String(buyer_gst).trim().toUpperCase() : null,
        buyer_address: buyer_address ? String(buyer_address).trim() : null,
        customer_crm_id: crmId,
        items: normalizedItems,
        subtotal,
        gst_percent: gstPct,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        paid_amount: 0,
        credit_limit: Math.max(0, Number(credit_limit || 0)),
        payment_terms: String(payment_terms || 'Net 15 Days'),
        payment_status: 'unpaid',
        status,
        stock_deducted: false,
        notes: notes ? String(notes).trim() : null,
      })
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error('[Admin ERP Wholesale POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_wholesale');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();
    const { id, action, status, paid_amount, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Wholesale order ID is required' }, { status: 400 });
    }

    const { data: existing, error: fetchErr } = (await supabase
      .from('erp_wholesale_orders')
      .select('*')
      .eq('id', id)
      .single()) as any;

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Wholesale order not found' }, { status: 404 });
    }

    // 1. Update Khata Payment
    if (action === 'update_payment') {
      const nextPaid = Math.max(0, Number(paid_amount ?? existing.paid_amount ?? 0));
      const total = Number(existing.total_amount || 0);
      const nextPaymentStatus =
        total > 0 && nextPaid >= total ? 'paid' : nextPaid > 0 ? 'partial' : 'unpaid';

      const { data: updated, error } = (await (supabase.from('erp_wholesale_orders') as any)
        .update({
          paid_amount: nextPaid,
          payment_status: nextPaymentStatus,
          notes: notes !== undefined ? notes : existing.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()) as any;

      if (error) throw error;
      return NextResponse.json({ success: true, order: updated });
    }

    // 2. Status transition (including stock deduction on Dispatch)
    const nextStatus = status || existing.status;
    let nextStockDeducted = Boolean(existing.stock_deducted);
    const itemsList: any[] = Array.isArray(existing.items) ? existing.items : [];

    if (nextStatus === 'dispatched' && !nextStockDeducted) {
      for (const item of itemsList) {
        if (!item.variant_id || Number(item.qty || 0) <= 0) continue;
        const { data: variant } = (await supabase
          .from('product_variants')
          .select('stock_qty')
          .eq('id', item.variant_id)
          .single()) as any;

        if (variant) {
          const nextStock = Math.max(0, Number(variant.stock_qty || 0) - Number(item.qty));
          await (supabase.from('product_variants') as any)
            .update({ stock_qty: nextStock, updated_at: new Date().toISOString() })
            .eq('id', item.variant_id);

          await (supabase.from('stock_ledger') as any).insert({
            item_type: 'finished_variant',
            item_id: item.variant_id,
            change: -Number(item.qty),
            reason: 'b2b_wholesale_dispatch',
            ref_id: id,
          });
        }
      }
      nextStockDeducted = true;
    } else if (nextStatus === 'cancelled' && nextStockDeducted) {
      for (const item of itemsList) {
        if (!item.variant_id || Number(item.qty || 0) <= 0) continue;
        const { data: variant } = (await supabase
          .from('product_variants')
          .select('stock_qty')
          .eq('id', item.variant_id)
          .single()) as any;

        if (variant) {
          await (supabase.from('product_variants') as any)
            .update({
              stock_qty: Number(variant.stock_qty || 0) + Number(item.qty),
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.variant_id);

          await (supabase.from('stock_ledger') as any).insert({
            item_type: 'finished_variant',
            item_id: item.variant_id,
            change: Number(item.qty),
            reason: 'b2b_dispatch_reversal',
            ref_id: id,
          });
        }
      }
      nextStockDeducted = false;
    }

    const { data: updated, error } = (await (supabase.from('erp_wholesale_orders') as any)
      .update({
        status: nextStatus,
        stock_deducted: nextStockDeducted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()) as any;

    if (error) throw error;
    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error('[Admin ERP Wholesale PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_wholesale');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { error } = await supabase.from('erp_wholesale_orders').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
