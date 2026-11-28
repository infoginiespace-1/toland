import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await verifyApiPermission('banners');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const { data: banners, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, banners: banners || [] });
  } catch (err: any) {
    console.error('[Admin Banners GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('banners');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { title, subtitle, image_path, media_type = 'image', link = '/products', sort = 0, is_active = true } = body;

    if (!title || !image_path) {
      return NextResponse.json({ error: 'Title and image are required' }, { status: 400 });
    }

    const { data: banner, error } = (await (supabase
      .from('banners') as any)
      .insert({
        title,
        subtitle: subtitle || null,
        image_path,
        media_type: media_type || 'image',
        link: link || '/products',
        sort: Number(sort),
        is_active: Boolean(is_active),
      })
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, banner });
  } catch (err: any) {
    console.error('[Admin Banners POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('banners');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { id, title, subtitle, image_path, media_type = 'image', link = '/products', sort = 0, is_active = true } = body;

    if (!id || !title || !image_path) {
      return NextResponse.json({ error: 'Banner ID, title, and image are required' }, { status: 400 });
    }

    const { data: banner, error } = (await (supabase
      .from('banners') as any)
      .update({
        title,
        subtitle: subtitle || null,
        image_path,
        media_type: media_type || 'image',
        link: link || '/products',
        sort: Number(sort),
        is_active: Boolean(is_active),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, banner });
  } catch (err: any) {
    console.error('[Admin Banners PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('banners');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Banner deleted' });
  } catch (err: any) {
    console.error('[Admin Banners DELETE Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
