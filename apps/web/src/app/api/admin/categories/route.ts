import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasAdminPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'catalog')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, categories: categories || [] });
  } catch (err: any) {
    console.error('[Admin Categories GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'catalog')) {
      return NextResponse.json({ error: 'Forbidden: Missing catalog permission' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, parent_id, image_path, sort = 0, is_active = true } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const { data: category, error } = (await (supabase
      .from('categories') as any)
      .insert({
        name,
        slug,
        parent_id: parent_id || null,
        image_path: image_path || null,
        sort: Number(sort),
        is_active: Boolean(is_active),
      })
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    console.error('[Admin Categories POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'catalog')) {
      return NextResponse.json({ error: 'Forbidden: Missing catalog permission' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, slug, parent_id, image_path, sort = 0, is_active = true } = body;

    if (!id || !name || !slug) {
      return NextResponse.json({ error: 'Category ID, name, and slug are required' }, { status: 400 });
    }

    const { data: category, error } = (await (supabase
      .from('categories') as any)
      .update({
        name,
        slug,
        parent_id: parent_id || null,
        image_path: image_path || null,
        sort: Number(sort),
        is_active: Boolean(is_active),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    console.error('[Admin Categories PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'catalog')) {
      return NextResponse.json({ error: 'Forbidden: Missing catalog permission' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (err: any) {
    console.error('[Admin Categories DELETE Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
