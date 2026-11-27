import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const featuredOnly = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const supabase = createClient();
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (featuredOnly) {
      query = query.eq('is_featured', true);
    }

    const { data: reviews, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, reviews: reviews || [] });
  } catch (err: any) {
    console.error('[Reviews GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_id,
      customer_name,
      customer_email,
      customer_phone,
      rating,
      title,
      comment,
    } = body;

    if (!customer_name || !comment) {
      return NextResponse.json(
        { error: 'Customer name and review feedback are required' },
        { status: 400 }
      );
    }

    const numericRating = Math.min(5, Math.max(1, parseInt(rating || '5', 10)));

    const supabaseAdmin = createAdminClient();

    const { data: newReview, error } = (await (supabaseAdmin
      .from('reviews') as any)
      .insert({
        product_id: product_id || null,
        customer_name: customer_name.trim(),
        customer_email: customer_email?.trim() || null,
        customer_phone: customer_phone?.trim() || null,
        rating: numericRating,
        title: title?.trim() || null,
        comment: comment.trim(),
        is_verified_buyer: true,
        is_featured: false,
        status: 'approved', // Auto-approves for instant reflection, admin can moderate/delete anytime
      })
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your verified review has been submitted.',
      review: newReview,
    });
  } catch (err: any) {
    console.error('[Reviews POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
