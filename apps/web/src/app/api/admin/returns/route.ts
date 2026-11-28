import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const role = user?.app_metadata?.role;
    const email = user?.email?.toLowerCase();
    if (
      !user ||
      (role !== 'admin' &&
        role !== 'staff' &&
        email !== 'dawoodhussain504@gmail.com' &&
        email !== 'info.giniespace@gmail.com')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
