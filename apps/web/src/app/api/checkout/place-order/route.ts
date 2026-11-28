import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const placeOrderSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid 10-digit WhatsApp number required'),
  email: z.string().email().optional().or(z.literal('')),
  addressLine1: z.string().min(5, 'Street address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Valid 6-digit Indian PIN code required'),
  paymentMethod: z.enum(['cod', 'razorpay', 'upi']),
  upiTransactionId: z.string().optional(),
  items: z.array(
    z.object({
      variantId: z.string().uuid(),
      productId: z.string().uuid(),
      name: z.string(),
      size: z.string(),
      price: z.number().positive(),
      qty: z.number().int().positive(),
    })
  ).min(1, 'Cart cannot be empty'),
  couponCode: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = placeOrderSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid order input data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      customerName,
      phone,
      email,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      paymentMethod,
      upiTransactionId,
      items,
      couponCode,
    } = parsed.data;

    const supabase = createAdminClient();

    // 1. Calculate Financials
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = subtotal >= 999 ? 0 : 99;

    let discount = 0;
    if (couponCode === 'TOLAND10' && subtotal >= 999) {
      discount = Math.round((subtotal * 10) / 100);
    } else if (couponCode === 'FLAT200' && subtotal >= 1499) {
      discount = 200;
    }

    const total = Math.max(0, subtotal - discount + shipping);
    const tax = Math.round((total * 12) / 112); // Included 12% GST

    // 2. Generate Sequential Order Number
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNo = `TLD-${year}-${randomSuffix}`;

    // Clean phone number (e.g. 919876543210)
    const rawDigits = phone.replace(/[^0-9]/g, '');
    const formattedPhone = rawDigits.length === 10
      ? `91${rawDigits}`
      : rawDigits.length === 11 && rawDigits.startsWith('0')
      ? `91${rawDigits.slice(1)}`
      : rawDigits.length >= 12
      ? rawDigits.slice(-12)
      : `91${rawDigits.slice(-10)}`;

    const addressSnapshot = {
      name: customerName,
      phone: formattedPhone,
      email: email || null,
      line1: addressLine1,
      line2: addressLine2 || null,
      city,
      state,
      pincode,
      country: 'India',
    };

    // 3. Insert into public.orders
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        status: 'confirmed',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' || paymentMethod === 'upi' ? 'pending' : 'paid',
        subtotal,
        discount,
        shipping,
        tax,
        total,
        address_snapshot: addressSnapshot,
      } as any)
      .select('id, order_no')
      .single();

    if (orderError || !order) {
      console.error('[Checkout API Error]: Failed to create order', orderError);
      return NextResponse.json({ error: 'Failed to place order in database' }, { status: 500 });
    }

    // 4. Insert into public.order_items
    const createdOrderId = (order as any).id;
    const createdOrderNo = (order as any).order_no;

    const orderItemsRows = items.map((item) => ({
      order_id: createdOrderId,
      variant_id: item.variantId,
      qty: item.qty,
      price: item.price,
      tax: Math.round((item.price * item.qty * 12) / 112),
    }));

    await supabase.from('order_items').insert(orderItemsRows as any);

    // 4b. Auto-deduct Variant Stock & Record Stock Ledger Sale Entries
    for (const item of items) {
      const { data: variant } = (await supabase
        .from('product_variants')
        .select('stock_qty')
        .eq('id', item.variantId)
        .single()) as any;

      if (variant) {
        const nextStock = Math.max(0, Number(variant.stock_qty || 0) - item.qty);
        await (supabase.from('product_variants') as any)
          .update({ stock_qty: nextStock, updated_at: new Date().toISOString() })
          .eq('id', item.variantId);
      }

      await (supabase.from('stock_ledger') as any).insert({
        item_type: 'finished_variant',
        item_id: item.variantId,
        change: -item.qty,
        reason: 'sale',
        ref_id: createdOrderId,
      });
    }

    // 5. Insert Status History
    await supabase.from('order_status_history').insert({
      order_id: createdOrderId,
      status: 'confirmed',
      note: paymentMethod === 'upi'
        ? `Order placed via Storefront (Direct UPI QR - UTR: ${upiTransactionId || 'Awaiting'})`
        : `Order placed via Storefront (${paymentMethod.toUpperCase()})`,
    } as any);

    // 6. Queue WhatsApp Order Confirmation Message (Priority 2)
    const paymentLabel = paymentMethod === 'cod'
      ? 'Cash on Delivery'
      : paymentMethod === 'upi'
      ? `Instant UPI (UTR: ${upiTransactionId || 'Submitted'})`
      : 'Prepaid';

    const waBody = `Namaste ${customerName}!\n\nYour TOLAND order *${createdOrderNo}* has been confirmed.\n\n` +
      `Items: ${items.map((i) => `${i.name} (Size: ${i.size}) x${i.qty}`).join(', ')}\n` +
      `Total: ₹${total} (${paymentLabel})\n\n` +
      `Delivery Address: ${addressLine1}, ${city}, ${state} - ${pincode}\n\n` +
      `Your jeans will be packed and dispatched directly from our Sheikhpura factory. Track updates anytime here:\nhttps://toland-web.vercel.app/track-order?q=${createdOrderNo}`;

    await supabase.from('wa_messages').insert({
      direction: 'outbound',
      phone: formattedPhone,
      body: waBody,
      priority: 2,
      template_key: 'order_confirmed',
      status: 'queued',
      metadata: { order_no: createdOrderNo, order_id: createdOrderId },
    } as any);

    console.log(`[Checkout API] Successfully created order ${createdOrderNo} and queued WhatsApp notification`);

    return NextResponse.json({
      success: true,
      order_no: createdOrderNo,
      order_id: createdOrderId,
      total,
      paymentMethod,
    });
  } catch (err: any) {
    console.error('[Checkout API Unhandled Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
