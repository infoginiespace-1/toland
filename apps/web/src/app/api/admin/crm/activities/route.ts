import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasAdminPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'crm')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: activities, error } = await supabase
      .from('activities')
      .select(`
        *,
        customer:customers_crm (id, name, phone, stage),
        lead:leads (id, name, phone, stage)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ success: true, activities: activities || [] });
  } catch (err: any) {
    console.error('[Admin Activities GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'crm')) {
      return NextResponse.json({ error: 'Forbidden: Missing crm permission' }, { status: 403 });
    }

    const body = await request.json();
    const { customer_id, lead_id, activity_type = 'note', description, metadata = {} } = body;

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Activity description is required' }, { status: 400 });
    }

    const { data: activity, error } = await (supabase.from('activities') as any)
      .insert({
        customer_id: customer_id || null,
        lead_id: lead_id || null,
        activity_type,
        description,
        metadata,
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, activity });
  } catch (err: any) {
    console.error('[Admin Activities POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
