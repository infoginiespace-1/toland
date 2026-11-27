import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = (searchParams.get('query') || '').trim();

    if (!rawQuery) {
      return NextResponse.json(
        { error: 'Please enter your Order ID or 10-digit mobile number' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const isOrderNo = rawQuery.toUpperCase().startsWith('TLND') || rawQuery.includes('-');

    if (isOrderNo) {
      // Direct Order No lookup
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_no,
          status,
          payment_method,
          payment_status,
          total,
          created_at,
          address_snapshot,
          order_items (
            qty,
            price,
            variant:product_variants (
              size,
              product:products (name, slug)
            )
          )
        `)
        .ilike('order_no', rawQuery)
        .single();

      if (error || !order) {
        return NextResponse.json({
          success: false,
          orders: [],
          message: `No order found matching "${rawQuery}". Please check your Order ID.`,
        });
      }

      return NextResponse.json({
        success: true,
        orders: [order],
      });
    } else {
      // Mobile Number lookup
      const cleanedPhone = rawQuery.replace(/\D/g, '').slice(-10);

      if (cleanedPhone.length < 10) {
        return NextResponse.json(
          { error: 'Please enter a valid 10-digit mobile number or Order ID.' },
          { status: 400 }
        );
      }

      // Fetch recent orders matching this phone inside address_snapshot
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_no,
          status,
          payment_method,
          payment_status,
          total,
          created_at,
          address_snapshot,
          order_items (
            qty,
            price,
            variant:product_variants (
              size,
              product:products (name, slug)
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Filter in memory for phone matches
      const matchingOrders = (allOrders || []).filter((ord: any) => {
        const phoneInAddress = String(ord.address_snapshot?.phone || '').replace(/\D/g, '');
        return phoneInAddress.includes(cleanedPhone);
      });

      if (matchingOrders.length === 0) {
        return NextResponse.json({
          success: false,
          orders: [],
          message: `No orders found for mobile number +91 ${cleanedPhone}.`,
        });
      }

      return NextResponse.json({
        success: true,
        orders: matchingOrders,
      });
    }
  } catch (err: any) {
    console.error('[Track Order API Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
