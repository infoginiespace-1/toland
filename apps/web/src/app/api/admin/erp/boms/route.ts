import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_boms');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    let query = supabase
      .from('boms')
      .select(`
        *,
        product:products (id, name, slug, base_price, labor_cost_per_piece, overhead_cost_per_piece),
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
    const auth = await verifyApiPermission('erp_boms');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();
    const { product_id, raw_material_id, qty_per_piece, scrap_percent = 0 } = body;

    if (!product_id || !raw_material_id || !qty_per_piece || Number(qty_per_piece) <= 0) {
      return NextResponse.json(
        { error: 'Valid product, raw material, and consumption quantity are required' },
        { status: 400 }
      );
    }

    const safeScrap = Math.min(100, Math.max(0, Number(scrap_percent || 0)));

    const { data: bom, error } = (await (supabase.from('boms') as any)
      .upsert(
        {
          product_id,
          raw_material_id,
          qty_per_piece: Number(qty_per_piece),
          scrap_percent: safeScrap,
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

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_boms');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

    const body = await request.json();
    const { product_id, labor_cost_per_piece = 0, overhead_cost_per_piece = 0 } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    const { data: product, error } = (await (supabase.from('products') as any)
      .update({
        labor_cost_per_piece: Math.max(0, Number(labor_cost_per_piece || 0)),
        overhead_cost_per_piece: Math.max(0, Number(overhead_cost_per_piece || 0)),
        updated_at: new Date().toISOString(),
      })
      .eq('id', product_id)
      .select('id, name, base_price, labor_cost_per_piece, overhead_cost_per_piece')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    console.error('[Admin BOMs PUT Costing Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_boms');
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' },
        { status: auth.status }
      );
    }
    const supabase = createClient();

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
