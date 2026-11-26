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

    const { data: customers, error } = await supabase
      .from('customers_crm')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, customers: customers || [] });
  } catch (err: any) {
    console.error('[Admin Customers CRM GET Error]:', err);
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
    const { phone, name, source = 'storefront', tags = [], stage = 'lead', notes, opt_in_whatsapp = true } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

    const { data: customer, error } = await (supabase.from('customers_crm') as any)
      .insert({
        phone: formattedPhone,
        name: name || null,
        source,
        tags: Array.isArray(tags) ? tags : [tags],
        stage,
        notes: notes || null,
        opt_in_whatsapp: Boolean(opt_in_whatsapp),
      })
      .select('*')
      .single();

    if (error) throw error;

    // Log activity
    await (supabase.from('activities') as any).insert({
      customer_id: customer.id,
      activity_type: 'note',
      description: `Customer profile created manually via Admin CRM (${stage.toUpperCase()})`,
    });

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    console.error('[Admin Customers CRM POST Error]:', err);
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
    const { id, name, tags, stage, notes, opt_in_whatsapp } = body;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updatePayload.name = name;
    if (tags !== undefined) updatePayload.tags = Array.isArray(tags) ? tags : [tags];
    if (stage !== undefined) updatePayload.stage = stage;
    if (notes !== undefined) updatePayload.notes = notes;
    if (opt_in_whatsapp !== undefined) {
      updatePayload.opt_in_whatsapp = Boolean(opt_in_whatsapp);
      if (!opt_in_whatsapp) updatePayload.opted_out_at = new Date().toISOString();
    }

    const { data: customer, error } = await (supabase.from('customers_crm') as any)
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    // Log activity if stage changed
    if (stage) {
      await (supabase.from('activities') as any).insert({
        customer_id: id,
        activity_type: 'status_change',
        description: `Customer lifecycle updated to ${stage.toUpperCase()}`,
      });
    }

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    console.error('[Admin Customers CRM PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
