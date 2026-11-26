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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query = supabase.from('raw_materials').select('*').order('type', { ascending: true }).order('name', { ascending: true });

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const { data: materials, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, materials: materials || [] });
  } catch (err: any) {
    console.error('[Admin Raw Materials GET Error]:', err);
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
    const { name, type, unit, stock_qty = 0, reorder_level = 10, unit_price = 0 } = body;

    if (!name || !type || !unit) {
      return NextResponse.json({ error: 'Name, type, and unit are required' }, { status: 400 });
    }

    // 1. Insert raw material
    const { data: material, error } = (await (supabase.from('raw_materials') as any)
      .insert({
        name,
        type,
        unit,
        stock_qty: Number(stock_qty),
        reorder_level: Number(reorder_level),
        unit_price: Number(unit_price),
      })
      .select('*')
      .single()) as any;

    if (error) throw error;

    // 2. If initial stock > 0, log in stock_ledger
    if (Number(stock_qty) > 0) {
      await (supabase.from('stock_ledger') as any).insert({
        item_type: 'raw_material',
        item_id: material.id,
        change: Number(stock_qty),
        reason: 'initial_stock_onboarding',
      });
    }

    return NextResponse.json({ success: true, material });
  } catch (err: any) {
    console.error('[Admin Raw Materials POST Error]:', err);
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
    const { id, name, type, unit, stock_qty, reorder_level, unit_price, adjust_change, adjust_reason } = body;

    if (!id) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }

    // Fetch existing material
    const { data: existing, error: fetchErr } = (await supabase
      .from('raw_materials')
      .select('*')
      .eq('id', id)
      .single()) as any;

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    let nextStock = existing.stock_qty;

    // Handle manual stock adjustment with immutable ledger entry
    if (adjust_change !== undefined && adjust_change !== null) {
      const changeNum = Number(adjust_change);
      nextStock = Number(existing.stock_qty) + changeNum;

      await (supabase.from('stock_ledger') as any).insert({
        item_type: 'raw_material',
        item_id: id,
        change: changeNum,
        reason: adjust_reason || 'manual_stock_adjustment',
      });
    } else if (stock_qty !== undefined) {
      nextStock = Number(stock_qty);
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
      stock_qty: nextStock,
    };

    if (name) updatePayload.name = name;
    if (type) updatePayload.type = type;
    if (unit) updatePayload.unit = unit;
    if (reorder_level !== undefined) updatePayload.reorder_level = Number(reorder_level);
    if (unit_price !== undefined) updatePayload.unit_price = Number(unit_price);

    const { data: updated, error: updateErr } = (await (supabase.from('raw_materials') as any)
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()) as any;

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, material: updated });
  } catch (err: any) {
    console.error('[Admin Raw Materials PUT Error]:', err);
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
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('raw_materials').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Material deleted' });
  } catch (err: any) {
    console.error('[Admin Raw Materials DELETE Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
