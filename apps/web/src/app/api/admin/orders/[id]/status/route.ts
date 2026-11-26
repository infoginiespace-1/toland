import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || (user.app_metadata?.role !== 'admin' && user.app_metadata?.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, note, payment_status, notify_whatsapp = true, courier, awb, tracking_url } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // 1. Fetch current order
    const { data: orderData, error: fetchError } = (await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()) as any;

    if (fetchError || !orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderData;
    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (payment_status) {
      updatePayload.payment_status = payment_status;
    }

    // 2. Update order record
    const { error: updateError } = await (supabase
      .from('orders') as any)
      .update(updatePayload)
      .eq('id', id);

    if (updateError) throw updateError;

    // 3. Record status history
    await supabase.from('order_status_history').insert({
      order_id: id,
      status,
      note: note || `Order updated to ${status.toUpperCase()} by factory staff`,
    } as any);

    // 4. Update or insert shipment if provided
    if (courier || awb) {
      await supabase.from('shipments').insert({
        order_id: id,
        courier: courier || 'Delhivery Express',
        awb: awb || 'PENDING',
        tracking_url: tracking_url || `https://www.delhivery.com/track/package/${awb}`,
        status: status === 'delivered' ? 'delivered' : 'in_transit',
      } as any);
    }

    // 5. Queue WhatsApp update if requested
    const address = order.address_snapshot || {};
    const customerPhone = address.phone;

    if (notify_whatsapp && customerPhone) {
      let waBody = '';
      const orderNo = order.order_no;

      if (status === 'packed') {
        waBody = `Namaste ${address.name || 'Valued Customer'}!\n\nYour TOLAND order *${orderNo}* has completed stitching inspection and is now *Factory Packed* in tamper-proof packing at our Sheikhpura, Bihar facility.\n\nIt is queued for express courier pickup. Track progress:\nhttps://toland-web.vercel.app/orders/${orderNo}`;
      } else if (status === 'shipped') {
        waBody = `Namaste ${address.name || 'Valued Customer'}!\n\nGreat news! Your TOLAND order *${orderNo}* has been *Dispatched* from our factory floor.\n\nCourier: ${courier || 'Express Logistics'}\nAWB: ${awb || 'Standard Surface'}\n\nTrack your package live:\nhttps://toland-web.vercel.app/orders/${orderNo}`;
      } else if (status === 'delivered') {
        waBody = `Namaste ${address.name || 'Valued Customer'}!\n\nYour TOLAND order *${orderNo}* has been marked *Delivered*.\n\nWe hope you love the fit and feel of your genuine denim! If you need any size adjustments, our 7-day doorstep exchange is available anytime.\n\nThank you for supporting direct Indian manufacturing!`;
      } else if (status === 'cancelled') {
        waBody = `Namaste ${address.name || 'Valued Customer'}!\n\nYour TOLAND order *${orderNo}* has been *Cancelled*. Any prepaid amount will be refunded directly within 3–5 business days.`;
      } else {
        waBody = `Namaste ${address.name || 'Valued Customer'}!\n\nUpdate on your TOLAND order *${orderNo}*: Status has been updated to *${status.toUpperCase()}*.\n\nTrack details: https://toland-web.vercel.app/orders/${orderNo}`;
      }

      await supabase.from('wa_messages').insert({
        direction: 'outbound',
        phone: customerPhone.startsWith('+') ? customerPhone : `+91${customerPhone.replace(/\D/g, '').slice(-10)}`,
        body: waBody,
        priority: 2,
        template_key: `order_${status}`,
        status: 'queued',
        metadata: { order_no: orderNo, order_id: id, status },
      } as any);
    }

    return NextResponse.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err: any) {
    console.error('[Admin Order Status Update Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
