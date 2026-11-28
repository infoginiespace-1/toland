import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, productId, variantId, productName, size } = body;

    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Please provide a valid 10-digit WhatsApp number' },
        { status: 400 }
      );
    }

    const adminDb = createAdminClient();
    const formattedPhone = `91${cleanPhone}`;
    const leadName = `Stock Alert: ${productName || 'Denim'}${size ? ` (Sz ${size})` : ''}`;

    // Record in leads table
    const { error: leadErr } = await (adminDb.from('leads') as any).insert({
      name: leadName,
      phone: formattedPhone,
      source: 'out_of_stock_alert',
      stage: 'new',
      value: 0,
      notes: `Customer requested WhatsApp back-in-stock notification for ${productName || 'Item'} | Size: ${size || 'N/A'} | Product ID: ${productId || 'N/A'}`,
    });

    if (leadErr) {
      console.warn('[Notify Stock Lead Warning]:', leadErr);
    }

    // Queue instantaneous WhatsApp acknowledgement
    const waBody =
      `Namaste!\n\n` +
      `We have registered your stock alert for *${productName || 'TOLAND Denim'}* (Waist Size: ${size || 'Standard'}).\n\n` +
      `Our Sheikhpura cutting and stitching unit is processing new batches. As soon as this size finishes final AQL QC and packing, we will send you a priority alert to grab your pair!\n\n` +
      `Thank you for choosing genuine factory direct denim!`;

    await adminDb.from('wa_messages').insert({
      direction: 'outbound',
      phone: formattedPhone,
      body: waBody,
      priority: 2,
      template_key: 'stock_alert_registered',
      status: 'queued',
      metadata: { product_id: productId, variant_id: variantId, size },
    } as any);

    return NextResponse.json({
      success: true,
      message: `Priority restock alert registered for size ${size || ''}! We will message you on WhatsApp.`,
    });
  } catch (err: any) {
    console.error('[Notify Stock API Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
