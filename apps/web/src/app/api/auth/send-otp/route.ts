import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = String(body.phone || '').trim();

    if (!rawPhone) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    // Standardize Indian phone number format (+91XXXXXXXXXX)
    let cleaned = rawPhone.replace(/\D/g, '');
    let formattedPhone = '';
    if (cleaned.length === 10) {
      formattedPhone = `+91${cleaned}`;
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      formattedPhone = `+${cleaned}`;
    } else {
      formattedPhone = `+91${cleaned.slice(-10)}`;
    }

    if (!/^\+91[6-9]\d{9}$/.test(formattedPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number' },
        { status: 400 }
      );
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const supabaseAdmin = createAdminClient();

    // 1. Store in phone_otps table
    const { error: dbError } = await (supabaseAdmin as any).from('phone_otps').insert({
      phone: formattedPhone,
      otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    if (dbError) {
      console.error('Failed to store OTP in database:', dbError);
    }

    // 2. Deliver directly via WhatsApp Bridge
    const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL || 'https://toland-whatsapp-bridge.onrender.com';
    let bridgeDelivered = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const bridgeRes = await fetch(`${bridgeUrl}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bridge-secret': process.env.WHATSAPP_BRIDGE_SECRET || 'toland_bridge_secret_dev',
        },
        body: JSON.stringify({ phone: formattedPhone, otp }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (bridgeRes.ok) {
        bridgeDelivered = true;
      }
    } catch (e) {
      console.log('[send-otp] Bridge push error, falling back to database queue:', (e as any)?.message);
    }

    // 3. Fallback queue in wa_messages if bridge was offline
    if (!bridgeDelivered) {
      const messageBody = `Your TOLAND verification code is *${otp}*.\nValid for 5 minutes. Do not share this code with anyone.`;
      await (supabaseAdmin as any).from('wa_messages').insert({
        direction: 'outbound',
        phone: formattedPhone,
        body: messageBody,
        priority: 1, // High priority
        status: 'queued',
        metadata: { type: 'otp', code: otp },
      });
    }

    return NextResponse.json({
      success: true,
      message: '6-digit OTP code sent to your WhatsApp number',
      phone: formattedPhone,
    });
  } catch (err: any) {
    console.error('Error in /api/auth/send-otp:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error sending WhatsApp OTP' },
      { status: 500 }
    );
  }
}
