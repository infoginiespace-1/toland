import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasAdminPermission, triggerBridgeEndpoint } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'whatsapp_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminDb = createAdminClient();
    const { data: settings, error } = await adminDb
      .from('wa_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({ success: true, settings: settings || null });
  } catch (err: any) {
    console.error('[Admin WhatsApp Settings GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'whatsapp_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      daily_cap,
      hourly_cap,
      min_delay_s,
      max_delay_s,
      quiet_hours_start,
      quiet_hours_end,
      warmup_enabled,
      warmup_day,
      autoreply_enabled,
      queue_paused,
      failure_streak,
      fallback_to_cloud_api,
    } = body;

    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (daily_cap !== undefined) payload.daily_cap = Number(daily_cap);
    if (hourly_cap !== undefined) payload.hourly_cap = Number(hourly_cap);
    if (min_delay_s !== undefined) payload.min_delay_s = Number(min_delay_s);
    if (max_delay_s !== undefined) payload.max_delay_s = Number(max_delay_s);
    if (quiet_hours_start !== undefined) payload.quiet_hours_start = quiet_hours_start;
    if (quiet_hours_end !== undefined) payload.quiet_hours_end = quiet_hours_end;
    if (warmup_enabled !== undefined) payload.warmup_enabled = Boolean(warmup_enabled);
    if (warmup_day !== undefined) payload.warmup_day = Number(warmup_day);
    if (autoreply_enabled !== undefined) payload.autoreply_enabled = Boolean(autoreply_enabled);
    if (queue_paused !== undefined) payload.queue_paused = Boolean(queue_paused);
    if (failure_streak !== undefined) payload.failure_streak = Number(failure_streak);
    if (fallback_to_cloud_api !== undefined) payload.fallback_to_cloud_api = Boolean(fallback_to_cloud_api);

    const adminDb = createAdminClient();
    let result;
    if (id) {
      const { data, error } = await (adminDb.from('wa_settings') as any)
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await (adminDb.from('wa_settings') as any)
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      result = data;
    }

    if (queue_paused === false) {
      await triggerBridgeEndpoint('/resume');
    } else if (queue_paused === true) {
      await triggerBridgeEndpoint('/pause');
    }

    return NextResponse.json({ success: true, settings: result });
  } catch (err: any) {
    console.error('[Admin WhatsApp Settings PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
