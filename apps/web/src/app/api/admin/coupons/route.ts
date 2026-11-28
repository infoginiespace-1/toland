import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await verifyApiPermission('coupons');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, coupons: coupons || [] });
  } catch (err: any) {
    console.error('[Admin Coupons GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('coupons');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const {
      code,
      type = 'percentage',
      value,
      min_amount = 0,
      usage_limit,
      valid_from = new Date().toISOString(),
      valid_to,
      is_active = true,
    } = body;

    if (!code || value === undefined || value === null) {
      return NextResponse.json({ error: 'Coupon code and value are required' }, { status: 400 });
    }

    const { data: coupon, error } = (await (supabase
      .from('coupons') as any)
      .insert({
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        min_amount: Number(min_amount),
        usage_limit: usage_limit ? Number(usage_limit) : null,
        valid_from: new Date(valid_from).toISOString(),
        valid_to: valid_to ? new Date(valid_to).toISOString() : null,
        is_active: Boolean(is_active),
      })
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    console.error('[Admin Coupons POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('coupons');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const {
      id,
      code,
      type = 'percentage',
      value,
      min_amount = 0,
      usage_limit,
      valid_from,
      valid_to,
      is_active = true,
    } = body;

    if (!id || !code) {
      return NextResponse.json({ error: 'Coupon ID and code are required' }, { status: 400 });
    }

    const { data: coupon, error } = (await (supabase
      .from('coupons') as any)
      .update({
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        min_amount: Number(min_amount),
        usage_limit: usage_limit ? Number(usage_limit) : null,
        valid_from: valid_from ? new Date(valid_from).toISOString() : new Date().toISOString(),
        valid_to: valid_to ? new Date(valid_to).toISOString() : null,
        is_active: Boolean(is_active),
      })
      .eq('id', id)
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    console.error('[Admin Coupons PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('coupons');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Coupon deleted' });
  } catch (err: any) {
    console.error('[Admin Coupons DELETE Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
