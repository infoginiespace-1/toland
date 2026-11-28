import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasAdminPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!hasAdminPermission(user, 'whatsapp_inbox')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL || 'https://toland-whatsapp-bridge.onrender.com';
  const secret = process.env.WHATSAPP_BRIDGE_SECRET || 'toland_bridge_secret_dev';

  // 1. Try querying the bridge directly (live status)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${bridgeUrl}/status`, {
      headers: {
        'x-bridge-secret': secret,
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        source: 'bridge_live',
        status: data.status,
        connected_phone: data.connected_phone,
        last_seen: data.last_seen,
        queue: data.queue,
        uptime: data.uptime,
      });
    }
  } catch (bridgeErr) {
    // Bridge offline or sleeping, fall back to DB
  }

  // 2. Fallback: Query wa_sessions from Supabase with admin privileges
  try {
    const supabaseAdmin = createAdminClient();
    const { data: session } = await supabaseAdmin
      .from('wa_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      source: 'database_fallback',
      status: session?.status || 'disconnected',
      connected_phone: session?.connected_phone || null,
      qr: session?.qr || null,
      updated_at: session?.updated_at || null,
    });
  } catch (dbErr: any) {
    return NextResponse.json({
      success: false,
      status: 'disconnected',
      error: dbErr?.message || 'Failed to determine bridge status',
    });
  }
}
