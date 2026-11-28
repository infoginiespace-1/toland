import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await verifyApiPermission('erp_suppliers');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, suppliers: suppliers || [] });
  } catch (err: any) {
    console.error('[Admin Suppliers GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_suppliers');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { name, contact_person, phone, email, gst_number, address } = body;

    if (!name) {
      return NextResponse.json({ error: 'Supplier company name is required' }, { status: 400 });
    }

    const { data: supplier, error } = (await (supabase.from('suppliers') as any)
      .insert({
        name,
        contact_person: contact_person || null,
        phone: phone || null,
        email: email || null,
        gst_number: gst_number || null,
        address: address || null,
      })
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, supplier });
  } catch (err: any) {
    console.error('[Admin Suppliers POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_suppliers');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { id, name, contact_person, phone, email, gst_number, address } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Supplier ID and name are required' }, { status: 400 });
    }

    const { data: supplier, error } = (await (supabase.from('suppliers') as any)
      .update({
        name,
        contact_person: contact_person || null,
        phone: phone || null,
        email: email || null,
        gst_number: gst_number || null,
        address: address || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()) as any;

    if (error) throw error;

    return NextResponse.json({ success: true, supplier });
  } catch (err: any) {
    console.error('[Admin Suppliers PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('erp_suppliers');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Supplier deleted' });
  } catch (err: any) {
    console.error('[Admin Suppliers DELETE Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
