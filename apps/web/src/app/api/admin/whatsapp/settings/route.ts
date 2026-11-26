import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || (user.app_metadata?.role !== 'admin' && user.app_metadata?.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: settings, error } = await supabase
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

    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
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

    let result;
    if (id) {
      const { data, error } = await (supabase.from('wa_settings') as any)
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await (supabase.from('wa_settings') as any)
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, settings: result });
  } catch (err: any) {
    console.error('[Admin WhatsApp Settings PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
