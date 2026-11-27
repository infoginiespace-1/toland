import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const returnSchema = z.object({
  orderNo: z.string().min(3),
  phone: z.string().min(10),
  actionType: z.enum(['exchange', 'return']),
  reason: z.string().min(2),
  replacementSize: z.string().optional(),
  itemDetails: z.string().min(2),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = returnSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid return data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { orderNo, phone, actionType, reason, replacementSize, itemDetails, notes } = parsed.data;
    const adminDb = createAdminClient();

    // 1. Locate Order
    const { data: order, error: orderError } = await adminDb
      .from('orders')
      .select('id, order_no, status, address_snapshot')
      .eq('order_no', orderNo.trim())
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: `Order #${orderNo} not found.` }, { status: 404 });
    }

    const customerName = (order.address_snapshot as any)?.name || 'Valued Customer';
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const formattedPhone = `91${cleanPhone}`;

    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const actionLabel = actionType === 'exchange' ? 'Doorstep Size Exchange' : 'Return & Refund';

    // 2. Append to Order Status History
    const statusNote = `[${actionLabel} Requested - ${ticketId}] Item: ${itemDetails} | Reason: ${reason} | Target Size: ${replacementSize || 'N/A'}${notes ? ` | Note: ${notes}` : ''}`;

    await adminDb.from('order_status_history').insert({
      order_id: order.id,
      status: actionType === 'exchange' ? 'exchange_requested' : 'return_requested',
      note: statusNote,
    } as any);

    // 3. Queue WhatsApp Confirmation to Customer (Priority 2)
    const waBody = `Namaste ${customerName}!\n\nYour ${actionLabel} request for TOLAND order *${order.order_no}* has been registered successfully.\n\n` +
      `Ticket ID: *${ticketId}*\n` +
      `Item: ${itemDetails}\n` +
      `Reason: ${reason}\n` +
      `${replacementSize ? `Requested Replacement: Waist Size ${replacementSize}\n` : ''}\n` +
      `Our Sheikhpura logistics desk has scheduled doorstep courier pickup. Keep the original tags and washcare packaging ready.\n\n` +
      `For any urgent queries, reply here directly. Thank you for choosing TOLAND Denim!`;

    await adminDb.from('wa_messages').insert({
      direction: 'outbound',
      phone: formattedPhone,
      body: waBody,
      priority: 2,
      template_key: `order_${actionType}`,
      status: 'queued',
      metadata: { order_no: order.order_no, ticket_id: ticketId, action_type: actionType },
    } as any);

    console.log(`[Returns API] Created return ticket ${ticketId} for order ${order.order_no}`);

    return NextResponse.json({
      success: true,
      ticketId,
      orderNo: order.order_no,
      actionLabel,
      message: `Your ${actionLabel.toLowerCase()} request has been scheduled. A WhatsApp confirmation has been dispatched.`,
    });
  } catch (err: any) {
    console.error('[Returns API Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
