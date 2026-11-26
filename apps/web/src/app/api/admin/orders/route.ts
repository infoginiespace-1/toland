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
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          variant:product_variants (
            size,
            fit,
            wash,
            product:products (name, slug)
          )
        ),
        shipments (*),
        history:order_status_history (*)
      `)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`order_no.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, orders: orders || [] });
  } catch (err: any) {
    console.error('[Admin Orders GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
