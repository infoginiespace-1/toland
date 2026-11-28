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

    if (!hasAdminPermission(user, 'erp')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    let query = supabase
      .from('boms')
      .select(`
        *,
        product:products (id, name, slug),
        raw_material:raw_materials (*)
      `)
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: boms, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, boms: boms || [] });
  } catch (err: any) {
    console.error('[Admin BOMs GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'erp')) {
      return NextResponse.json({ error: 'Forbidden: Missing erp permission' }, { status: 403 });
    }

    const body = await request.json();
    const { product_id, raw_material_id, qty_per_piece } = body;

    if (!product_id || !raw_material_id || !qty_per_piece || Number(qty_per_piece) <= 0) {
      return NextResponse.json({ error: 'Valid product, raw material, and consumption quantity are required' }, { status: 400 });
    }

    const { data: bom, error } = (await (supabase.from('boms') as any)
      .upsert(
        {
          product_id,
          raw_material_id,
          qty_per_piece: Number(qty_per_piece),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'product_id,raw_material_id' }
      )
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, bom });
  } catch (err: any) {
    console.error('[Admin BOMs POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasAdminPermission(user, 'erp')) {
      return NextResponse.json({ error: 'Forbidden: Missing erp permission' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'BOM ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('boms').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'BOM line deleted' });
  } catch (err: any) {
    console.error('[Admin BOMs DELETE Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
