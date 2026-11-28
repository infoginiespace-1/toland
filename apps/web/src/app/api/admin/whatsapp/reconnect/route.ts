import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isStrictAdmin } from '@/lib/admin-auth';

export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!isStrictAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden: Super Admin required' }, { status: 403 });
    }

    const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL || 'https://toland-whatsapp-bridge.onrender.com';
    const secret = process.env.WHATSAPP_BRIDGE_SECRET || 'toland_bridge_secret_dev';

    const res = await fetch(`${bridgeUrl}/reconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bridge-secret': secret,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to reconnect bridge' },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bridge reconnected. Generating fresh QR code...',
    });
  } catch (err: any) {
    console.error('Error in /api/admin/whatsapp/reconnect:', err);
    return NextResponse.json(
      { error: 'Failed to contact WhatsApp bridge. Please check Render service status.' },
      { status: 503 }
    );
  }
}
