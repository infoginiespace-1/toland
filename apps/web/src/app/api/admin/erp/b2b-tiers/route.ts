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

    const { data: tiers, error } = await supabase
      .from('b2b_price_tiers')
      .select(`
        *,
        product:products (id, name, slug, price)
      `)
      .order('min_qty', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, tiers: tiers || [] });
  } catch (err: any) {
    console.error('[Admin B2B Tiers GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const body = await request.json();
    const { product_id, min_qty, price } = body;

    if (!product_id || !min_qty || price === undefined) {
      return NextResponse.json({ error: 'Product, minimum quantity, and wholesale price are required' }, { status: 400 });
    }

    const minQtyNum = parseInt(min_qty, 10);
    const priceNum = parseFloat(price);

    if (minQtyNum <= 1 || priceNum < 0) {
      return NextResponse.json({ error: 'Minimum quantity must be > 1 and price must be positive' }, { status: 400 });
    }

    const { data, error } = await (supabase.from('b2b_price_tiers') as any)
      .upsert(
        {
          product_id,
          min_qty: minQtyNum,
          price: priceNum,
        },
        { onConflict: 'product_id, min_qty' }
      )
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, tier: data });
  } catch (err: any) {
    console.error('[Admin B2B Tiers POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tier ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('b2b_price_tiers').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Tier deleted successfully' });
  } catch (err: any) {
    console.error('[Admin B2B Tiers DELETE Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
