import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiPermission } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('crm_leads');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, leads: leads || [] });
  } catch (err: any) {
    console.error('[Admin Leads GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('crm_leads');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { name, phone, source = 'website_b2b', stage = 'new', value = 0, next_followup_at } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Lead name and phone are required' }, { status: 400 });
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

    const { data: lead, error } = await (supabase.from('leads') as any)
      .insert({
        name,
        phone: formattedPhone,
        source,
        stage,
        value: Number(value || 0),
        next_followup_at: next_followup_at || null,
      })
      .select('*')
      .single();

    if (error) throw error;

    // Log CRM activity
    await (supabase.from('activities') as any).insert({
      lead_id: lead.id,
      activity_type: 'note',
      description: `B2B lead captured: ${name} (Est. value: ₹${Number(value || 0).toLocaleString('en-IN')})`,
    });

    return NextResponse.json({ success: true, lead });
  } catch (err: any) {
    console.error('[Admin Leads POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('crm_leads');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { id, stage, value, next_followup_at, convert_to_customer } = body;

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    // 1. Convert to customer if requested
    if (convert_to_customer) {
      const { data: lead } = (await supabase.from('leads').select('*').eq('id', id).single()) as any;
      if (lead) {
        // Insert into customers_crm
        const { data: customer } = (await (supabase.from('customers_crm') as any)
          .insert({
            name: lead.name,
            phone: lead.phone,
            source: 'b2b_portal',
            stage: 'vip',
            tags: ['converted_lead', 'wholesale'],
            notes: `Converted from B2B Pipeline Lead #${id.slice(0, 8)} with deal value ₹${Number(lead.value).toLocaleString('en-IN')}`,
          })
          .select('*')
          .single()) as any;

        // Update lead to converted
        await (supabase.from('leads') as any)
          .update({ stage: 'converted', updated_at: new Date().toISOString() })
          .eq('id', id);

        // Log conversion activity
        await (supabase.from('activities') as any).insert({
          lead_id: id,
          customer_id: customer?.id || null,
          activity_type: 'status_change',
          description: `Lead converted into official VIP Wholesale Customer profile`,
        });

        return NextResponse.json({ success: true, message: 'Lead converted to customer successfully' });
      }
    }

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (stage) updatePayload.stage = stage;
    if (value !== undefined) updatePayload.value = Number(value);
    if (next_followup_at !== undefined) updatePayload.next_followup_at = next_followup_at || null;

    const { data: updatedLead, error } = await (supabase.from('leads') as any)
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    if (stage) {
      await (supabase.from('activities') as any).insert({
        lead_id: id,
        activity_type: 'status_change',
        description: `Lead pipeline stage shifted to "${stage.toUpperCase().replace('_', ' ')}"`,
      });
    }

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (err: any) {
    console.error('[Admin Leads PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('crm_leads');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err: any) {
    console.error('[Admin Leads DELETE Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
