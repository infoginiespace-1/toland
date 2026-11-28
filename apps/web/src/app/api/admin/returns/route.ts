import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('returns');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { order_id, ticket_id, next_status, admin_note } = body;

    if (!order_id || !next_status) {
      return NextResponse.json({ error: 'Order ID and next status are required' }, { status: 400 });
    }

    const adminDb = createAdminClient();

    const { data: order, error: fetchErr } = (await adminDb
      .from('orders')
      .select('id, order_no, address_snapshot')
      .eq('id', order_id)
      .single()) as any;

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const labelMap: Record<string, string> = {
      exchange_approved: 'Exchange Approved · Courier Pickup Scheduled',
      exchange_dispatched: 'Replacement Pair Dispatched from Sheikhpura',
      return_refunded: 'Return Completed & Refund Processed',
      return_rejected: 'Return / Exchange Request Closed',
    };

    const statusLabel = labelMap[next_status] || next_status;
    const noteText = `[${ticket_id || 'RETURN-UPDATE'}] ${statusLabel}${admin_note ? ` — ${admin_note}` : ''}`;

    await adminDb.from('order_status_history').insert({
      order_id,
      status: next_status,
      note: noteText,
    } as any);

    if (next_status === 'return_refunded') {
      await (adminDb.from('orders') as any)
        .update({ status: 'returned', payment_status: 'refunded', updated_at: new Date().toISOString() })
        .eq('id', order_id);

      // Restore finished garment stock to warehouse inventory
      const { data: orderItems } = await adminDb
        .from('order_items')
        .select('variant_id, qty')
        .eq('order_id', order_id);

      if (Array.isArray(orderItems)) {
        for (const item of orderItems) {
          if (!item.variant_id || !item.qty) continue;
          const { data: vData } = await adminDb
            .from('product_variants')
            .select('stock_qty')
            .eq('id', item.variant_id)
            .single();

          if (vData) {
            const restoredStock = Number(vData.stock_qty || 0) + Number(item.qty);
            await (adminDb.from('product_variants') as any)
              .update({ stock_qty: restoredStock, updated_at: new Date().toISOString() })
              .eq('id', item.variant_id);

            await (adminDb.from('stock_ledger') as any).insert({
              item_type: 'finished_variant',
              item_id: item.variant_id,
              change: Number(item.qty),
              reason: 'return_restock',
              ref_id: order_id,
            });
          }
        }
      }

      try {
        revalidatePath('/products');
        revalidatePath('/');
      } catch (cacheErr) {
        console.warn('[Returns Revalidate Warning]:', cacheErr);
      }
    }

    const address = order.address_snapshot || {};
    const customerPhone = address.phone;

    if (customerPhone) {
      const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
      const waBody =
        `Namaste ${address.name || 'Valued Customer'}!\n\n` +
        `Update on your TOLAND ${ticket_id ? `Ticket *${ticket_id}*` : 'Return/Exchange'} for order *${order.order_no}*:\n\n` +
        `Status: *${statusLabel}*\n` +
        `${admin_note ? `Factory Note: ${admin_note}\n` : ''}\n` +
        `Track details anytime at: https://toland-web.vercel.app/track-order?q=${order.order_no}`;

      await adminDb.from('wa_messages').insert({
        direction: 'outbound',
        phone: `91${cleanPhone}`,
        body: waBody,
        priority: 2,
        template_key: next_status,
        status: 'queued',
        metadata: { order_no: order.order_no, ticket_id },
      } as any);
    }

    return NextResponse.json({ success: true, status: next_status });
  } catch (err: any) {
    console.error('[Admin Returns PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
