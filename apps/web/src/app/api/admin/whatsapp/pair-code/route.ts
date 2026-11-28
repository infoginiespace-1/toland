import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    const auth = await verifyApiPermission('wa_settings');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const phone = String(body.phone || '').trim().replace(/[^0-9]/g, '');

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit mobile number is required' },
        { status: 400 }
      );
    }

    const formattedPhone = phone.startsWith('91') && phone.length === 12
      ? phone
      : `91${phone.slice(-10)}`;

    const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL || 'https://toland-whatsapp-bridge.onrender.com';
    const secret = process.env.WHATSAPP_BRIDGE_SECRET || 'toland_bridge_secret_dev';

    const res = await fetch(`${bridgeUrl}/pair-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bridge-secret': secret,
      },
      body: JSON.stringify({ phone: formattedPhone }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to request pairing code from WhatsApp bridge' },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      code: data.code,
      phone: formattedPhone,
      message: 'Pairing code generated. Enter this 8-digit code in WhatsApp > Linked Devices > Link with Phone Number',
    });
  } catch (err: any) {
    console.error('Error in /api/admin/whatsapp/pair-code:', err);
    return NextResponse.json(
      { error: 'WhatsApp bridge is currently offline or deploying. Please verify service status.' },
      { status: 503 }
    );
  }
}
