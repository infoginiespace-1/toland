import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal = 0 } = body;

    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return NextResponse.json({ error: 'Please enter a coupon code' }, { status: 400 });
    }

    const orderSubtotal = Number(subtotal || 0);
    const supabase = createAdminClient();

    // Query active coupon from database
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', cleanCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !coupon) {
      return NextResponse.json(
        { error: `Coupon "${cleanCode}" is invalid or expired` },
        { status: 404 }
      );
    }

    const now = new Date();

    // Check validity window
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return NextResponse.json(
        { error: `Coupon "${coupon.code}" will be active from ${new Date(coupon.valid_from).toLocaleDateString()}` },
        { status: 400 }
      );
    }

    if (coupon.valid_to && new Date(coupon.valid_to) < now) {
      return NextResponse.json(
        { error: `Coupon "${coupon.code}" expired on ${new Date(coupon.valid_to).toLocaleDateString()}` },
        { status: 400 }
      );
    }

    // Check usage limit
    if (
      coupon.usage_limit !== null &&
      coupon.usage_limit !== undefined &&
      Number(coupon.used_count || 0) >= Number(coupon.usage_limit)
    ) {
      return NextResponse.json(
        { error: `Coupon "${coupon.code}" has reached its maximum redemption limit` },
        { status: 400 }
      );
    }

    // Check minimum order amount
    const minAmount = Number(coupon.min_amount || 0);
    if (orderSubtotal < minAmount) {
      return NextResponse.json(
        {
          error: `Minimum order amount for coupon "${coupon.code}" is ₹${minAmount.toLocaleString()}`,
          min_amount: minAmount,
        },
        { status: 400 }
      );
    }

    // Compute exact discount
    const couponVal = Number(coupon.value || 0);
    let discountAmount = 0;

    if (coupon.type === 'percentage') {
      discountAmount = Math.round((orderSubtotal * couponVal) / 100);
    } else {
      discountAmount = Math.min(couponVal, orderSubtotal);
    }

    const successMessage =
      coupon.type === 'percentage'
        ? `Coupon ${coupon.code} applied: ${couponVal}% OFF (Save ₹${discountAmount})`
        : `Coupon ${coupon.code} applied: ₹${couponVal} FLAT OFF!`;

    return NextResponse.json({
      success: true,
      message: successMessage,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: couponVal,
        discountAmount,
        min_amount: minAmount,
      },
    });
  } catch (err: any) {
    console.error('[Apply Coupon Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
