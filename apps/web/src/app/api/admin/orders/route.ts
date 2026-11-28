import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('orders');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

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
