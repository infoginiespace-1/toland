import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('wa_autoreplies');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const { data: rules, error } = await supabase
      .from('wa_autoreply_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, rules: rules || [] });
  } catch (err: any) {
    console.error('[Admin AutoReplies GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('wa_autoreplies');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { keyword, match_type = 'exact', reply_template_key, is_active = true } = body;

    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: 'Trigger keyword is required' }, { status: 400 });
    }

    const normalizedKeyword = match_type === 'regex' ? keyword.trim() : keyword.trim().toUpperCase();

    const { data: rule, error } = await (supabase.from('wa_autoreply_rules') as any)
      .insert({
        keyword: normalizedKeyword,
        match_type,
        reply_template_key: reply_template_key || null,
        is_active: Boolean(is_active),
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, rule });
  } catch (err: any) {
    console.error('[Admin AutoReplies POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('wa_autoreplies');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const { data: updated, error } = await (supabase.from('wa_autoreply_rules') as any)
      .update({
        is_active: Boolean(is_active),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, rule: updated });
  } catch (err: any) {
    console.error('[Admin AutoReplies PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('wa_autoreplies');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('wa_autoreply_rules').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Rule deleted successfully' });
  } catch (err: any) {
    console.error('[Admin AutoReplies DELETE Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
