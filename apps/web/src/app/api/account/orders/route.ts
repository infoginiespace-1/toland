import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const adminDb = createAdminClient();
    const userEmail = user.email?.trim().toLowerCase();
    const userPhone = user.phone || user.user_metadata?.phone;
    const cleanPhone = userPhone ? userPhone.replace(/\D/g, '').slice(-10) : '';

    // Fetch orders matching customer ID or email or phone in address_snapshot
    const { data: allOrders, error } = await adminDb
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
        shipments (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Account Orders Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter matching user's identity
    const matchingOrders = (allOrders || []).filter((ord: any) => {
      if (ord.customer_id && ord.customer_id === user.id) return true;
      const addr = ord.address_snapshot || {};
      const orderEmail = (addr.email || '').trim().toLowerCase();
      const orderPhone = (addr.phone || '').replace(/\D/g, '').slice(-10);

      if (userEmail && orderEmail && userEmail === orderEmail) return true;
      if (cleanPhone && orderPhone && cleanPhone === orderPhone) return true;
      return false;
    });

    return NextResponse.json({
      success: true,
      orders: matchingOrders,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0],
        phone: user.phone || user.user_metadata?.phone,
      },
    });
  } catch (err: any) {
    console.error('[Account Orders Route Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
