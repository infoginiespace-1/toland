import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('crm_followups');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const { data: followups, error } = await supabase
      .from('followups')
      .select(`
        *,
        lead:leads (id, name, phone, stage),
        customer:customers_crm (id, name, phone, stage)
      `)
      .order('due_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, followups: followups || [] });
  } catch (err: any) {
    console.error('[Admin Followups GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('crm_followups');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { lead_id, customer_id, due_at, note } = body;

    if (!note || !due_at) {
      return NextResponse.json({ error: 'Follow-up note and due date are required' }, { status: 400 });
    }

    const { data: followup, error } = await (supabase.from('followups') as any)
      .insert({
        lead_id: lead_id || null,
        customer_id: customer_id || null,
        due_at,
        note,
        done: false,
      })
      .select('*')
      .single();

    if (error) throw error;

    // Log CRM activity
    await (supabase.from('activities') as any).insert({
      lead_id: lead_id || null,
      customer_id: customer_id || null,
      activity_type: 'note',
      description: `Follow-up scheduled for ${new Date(due_at).toLocaleDateString('en-IN')}: "${note}"`,
    });

    return NextResponse.json({ success: true, followup });
  } catch (err: any) {
    console.error('[Admin Followups POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('crm_followups');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { id, done, note, due_at } = body;

    if (!id) {
      return NextResponse.json({ error: 'Follow-up ID is required' }, { status: 400 });
    }

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (done !== undefined) updatePayload.done = Boolean(done);
    if (note !== undefined) updatePayload.note = note;
    if (due_at !== undefined) updatePayload.due_at = due_at;

    const { data: updated, error } = await (supabase.from('followups') as any)
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, followup: updated });
  } catch (err: any) {
    console.error('[Admin Followups PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('crm_followups');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Follow-up ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('followups').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Follow-up deleted successfully' });
  } catch (err: any) {
    console.error('[Admin Followups DELETE Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
