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

    if (!hasAdminPermission(user, 'whatsapp_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: templates, error } = await supabase
      .from('wa_templates')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, templates: templates || [] });
  } catch (err: any) {
    console.error('[Admin WhatsApp Templates GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'whatsapp_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, name, body: bodyText, variables = [], category = 'transactional', is_active = true } = body;

    if (!key || !name || !bodyText) {
      return NextResponse.json({ error: 'Template key, name, and body text are required' }, { status: 400 });
    }

    const cleanKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const { data: template, error } = await (supabase.from('wa_templates') as any)
      .insert({
        key: cleanKey,
        name,
        body: bodyText,
        variables: Array.isArray(variables) ? variables : [variables],
        category,
        is_active: Boolean(is_active),
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, template });
  } catch (err: any) {
    console.error('[Admin WhatsApp Templates POST Error]:', err);
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
    const { id, name, body: bodyText, variables, category, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (name) updatePayload.name = name;
    if (bodyText) updatePayload.body = bodyText;
    if (variables !== undefined) updatePayload.variables = Array.isArray(variables) ? variables : [variables];
    if (category) updatePayload.category = category;
    if (is_active !== undefined) updatePayload.is_active = Boolean(is_active);

    const { data: updated, error } = await (supabase.from('wa_templates') as any)
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, template: updated });
  } catch (err: any) {
    console.error('[Admin WhatsApp Templates PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'whatsapp_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('wa_templates').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Template deleted successfully' });
  } catch (err: any) {
    console.error('[Admin WhatsApp Templates DELETE Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
