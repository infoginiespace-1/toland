import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_no, phone, reason = 'Customer requested cancellation' } = body;

    if (!order_no || !phone) {
      return NextResponse.json(
        { error: 'Order number and registered WhatsApp phone number are required' },
        { status: 400 }
      );
    }

    const adminDb = createAdminClient();
    const cleanOrderNo = order_no.trim();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // 1. Fetch order
    const { data: order, error: orderErr } = (await adminDb
      .from('orders')
      .select('id, order_no, status, address_snapshot')
      .eq('order_no', cleanOrderNo)
      .single()) as any;

    if (orderErr || !order) {
      return NextResponse.json({ error: `Order #${cleanOrderNo} not found` }, { status: 404 });
    }

    // 2. Verify identity via phone number
    const addressPhone = (order.address_snapshot?.phone || '').replace(/\D/g, '').slice(-10);
    if (addressPhone !== cleanPhone) {
      return NextResponse.json(
        { error: 'Phone number does not match the delivery phone on this order' },
        { status: 403 }
      );
    }

    // 3. Verify status allows cancellation
    if (['packed', 'shipped', 'delivered', 'returned'].includes(order.status)) {
      return NextResponse.json(
        {
          error: `Order #${cleanOrderNo} is already ${order.status.toUpperCase()} and cannot be cancelled directly. Please use our 7-Day Return/Exchange desk or message support.`,
        },
        { status: 400 }
      );
    }

    if (order.status === 'cancelled') {
      return NextResponse.json(
        { error: `Order #${cleanOrderNo} is already cancelled.` },
        { status: 400 }
      );
    }

    // 4. Update order status to cancelled
    await (adminDb.from('orders') as any)
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    // 5. Restore stock to product_variants & insert stock_ledger reversals
    const { data: orderItems } = await adminDb
      .from('order_items')
      .select('variant_id, qty')
      .eq('order_id', order.id);

    if (Array.isArray(orderItems)) {
      for (const item of orderItems) {
        if (!item.variant_id || !item.qty) continue;
        const { data: vRow } = await adminDb
          .from('product_variants')
          .select('stock_qty')
          .eq('id', item.variant_id)
          .single();

        if (vRow) {
          const restoredStock = Number(vRow.stock_qty || 0) + Number(item.qty);
          await (adminDb.from('product_variants') as any)
            .update({ stock_qty: restoredStock, updated_at: new Date().toISOString() })
            .eq('id', item.variant_id);

          await (adminDb.from('stock_ledger') as any).insert({
            item_type: 'finished_variant',
            item_id: item.variant_id,
            change: Number(item.qty),
            reason: 'customer_cancellation_reversal',
            ref_id: order.id,
          });
        }
      }
    }

    // 6. Record status history note
    const noteText = `[Customer Cancelled via Storefront] Reason: ${reason}`;
    await adminDb.from('order_status_history').insert({
      order_id: order.id,
      status: 'cancelled',
      note: noteText,
    } as any);

    // 7. Queue WhatsApp Confirmation
    const customerName = order.address_snapshot?.name || 'Valued Customer';
    const waBody =
      `Namaste ${customerName}!\n\n` +
      `Your cancellation request for TOLAND order *${order.order_no}* has been confirmed.\n\n` +
      `Reason: ${reason}\n\n` +
      `The reserved stock has been released. If prepaid via UPI, any refund will be processed back to your source account within 3–5 business days.\n\n` +
      `We hope to craft your next pair of denim soon!`;

    await adminDb.from('wa_messages').insert({
      direction: 'outbound',
      phone: `91${cleanPhone}`,
      body: waBody,
      priority: 2,
      template_key: 'order_cancelled_customer',
      status: 'queued',
      metadata: { order_no: order.order_no, reason },
    } as any);

    try {
      revalidatePath('/products');
      revalidatePath('/');
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `Order #${order.order_no} has been cancelled successfully.`,
    });
  } catch (err: any) {
    console.error('[Customer Cancel API Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
