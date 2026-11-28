import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_stock_ledger');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const { data: entries, error } = await supabase
      .from('stock_ledger')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    return NextResponse.json({ success: true, ledger: entries || [] });
  } catch (err: any) {
    console.error('[Admin Stock Ledger GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_stock_ledger');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { item_type, item_id, change, reason = 'adjustment', ref_id } = body;

    if (!item_type || !item_id || change === undefined || Number(change) === 0) {
      return NextResponse.json({ error: 'Valid item_type, item_id, and non-zero change quantity are required' }, { status: 400 });
    }

    const changeVal = Number(change);

    // 1. Record ledger entry
    const { error: ledgerErr } = await (supabase.from('stock_ledger') as any).insert({
      item_type,
      item_id,
      change: changeVal,
      reason,
      ref_id: ref_id || null,
    });

    if (ledgerErr) throw ledgerErr;

    // 2. Adjust physical inventory
    if (item_type === 'raw_material') {
      const { data: rm } = (await supabase.from('raw_materials').select('stock_qty').eq('id', item_id).single()) as any;
      const currentQty = Number(rm?.stock_qty || 0);
      const newQty = Math.max(0, currentQty + changeVal);
      await (supabase.from('raw_materials') as any).update({ stock_qty: newQty, updated_at: new Date().toISOString() }).eq('id', item_id);
    } else if (item_type === 'finished_variant') {
      const { data: variant } = (await supabase.from('product_variants').select('stock_qty').eq('id', item_id).single()) as any;
      const currentQty = Number(variant?.stock_qty || 0);
      const newQty = Math.max(0, currentQty + changeVal);
      await (supabase.from('product_variants') as any).update({ stock_qty: newQty, updated_at: new Date().toISOString() }).eq('id', item_id);
    }

    return NextResponse.json({ success: true, message: 'Stock adjusted and ledger recorded successfully' });
  } catch (err: any) {
    console.error('[Admin Stock Ledger POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
