import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyApiPermission, triggerBridgeEndpoint } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

async function enqueueCampaignRecipients(
  adminDb: ReturnType<typeof createAdminClient>,
  campaign: { id: string; name: string; template_key?: string | null; segment_filter?: any }
): Promise<number> {
  if (!campaign.template_key) return 0;

  // Idempotency guard: avoid duplicate queueing for the same campaign
  const { data: existingMsgs } = await adminDb
    .from('wa_messages')
    .select('id')
    .contains('metadata', { campaign_id: campaign.id })
    .limit(1);

  if (existingMsgs && existingMsgs.length > 0) {
    return 0;
  }

  const { data: template } = (await adminDb
    .from('wa_templates')
    .select('body')
    .eq('key', campaign.template_key)
    .single()) as any;

  if (!template?.body) return 0;

  const audience = campaign.segment_filter?.audience || 'all';
  const recipients: Array<{ phone: string; name?: string | null }> = [];

  if (audience === 'wholesale') {
    const [{ data: leads }, { data: crmWholesale }] = await Promise.all([
      adminDb.from('leads').select('phone, name'),
      adminDb
        .from('customers_crm')
        .select('phone, name')
        .eq('opt_in_whatsapp', true)
        .or('stage.eq.vip,tags.cs.{wholesale}'),
    ]);
    if (leads) recipients.push(...(leads as any[]));
    if (crmWholesale) recipients.push(...(crmWholesale as any[]));
  } else if (audience === 'vip') {
    const { data: vipCustomers } = await adminDb
      .from('customers_crm')
      .select('phone, name')
      .eq('opt_in_whatsapp', true)
      .eq('stage', 'vip');
    if (vipCustomers) recipients.push(...(vipCustomers as any[]));
  } else {
    const { data: allCustomers } = await adminDb
      .from('customers_crm')
      .select('phone, name')
      .eq('opt_in_whatsapp', true);
    if (allCustomers) recipients.push(...(allCustomers as any[]));
  }

  const { data: optouts } = await adminDb.from('wa_optouts').select('phone');
  const optoutSet = new Set(
    (optouts || []).map((o: any) => String(o.phone || '').replace(/\D/g, '').slice(-10))
  );
  const seen = new Set<string>();
  const rowsToInsert: any[] = [];

  for (const r of recipients) {
    const digits10 = String(r.phone || '').replace(/\D/g, '').slice(-10);
    if (digits10.length < 10 || optoutSet.has(digits10) || seen.has(digits10)) continue;
    seen.add(digits10);

    const personalizedBody = String(template.body).replace(
      /\{\{\s*name\s*\}\}/gi,
      r.name || 'Valued Customer'
    );

    rowsToInsert.push({
      direction: 'outbound',
      phone: `91${digits10}`,
      body: personalizedBody,
      priority: 3,
      template_key: campaign.template_key,
      status: 'queued',
      metadata: { campaign_id: campaign.id },
    });
  }

  if (rowsToInsert.length > 0) {
    await (adminDb.from('wa_messages') as any).insert(rowsToInsert);
    await triggerBridgeEndpoint('/trigger-queue');
  }

  return rowsToInsert.length;
}

export async function GET() {
  try {
    const auth = await verifyApiPermission('wa_campaigns');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const adminDb = createAdminClient();
    const { data: campaigns, error } = await adminDb
      .from('wa_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, campaigns: campaigns || [] });
  } catch (err: any) {
    console.error('[Admin WhatsApp Campaigns GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('wa_campaigns');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { name, template_key, segment_filter = {}, scheduled_at } = body;

    if (!name || !template_key) {
      return NextResponse.json({ error: 'Campaign name and message template are required' }, { status: 400 });
    }

    const isScheduledFuture = Boolean(scheduled_at && new Date(scheduled_at).getTime() > Date.now() + 60000);
    const initialStatus = isScheduledFuture ? 'scheduled' : 'running';

    const adminDb = createAdminClient();
    const { data: campaign, error } = (await (adminDb.from('wa_campaigns') as any)
      .insert({
        name,
        template_key,
        segment_filter,
        status: initialStatus,
        scheduled_at: scheduled_at || new Date().toISOString(),
      })
      .select('*')
      .single()) as any;

    if (error) throw error;

    let queuedCount = 0;
    if (initialStatus === 'running') {
      queuedCount = await enqueueCampaignRecipients(adminDb, campaign);
    }

    return NextResponse.json({ success: true, campaign, queuedCount });
  } catch (err: any) {
    console.error('[Admin WhatsApp Campaigns POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiPermission('wa_campaigns');
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: Missing permission' }, { status: auth.status });
    }
    const supabase = createClient();

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Campaign ID and status are required' }, { status: 400 });
    }

    const adminDb = createAdminClient();
    const { data: updated, error } = (await (adminDb.from('wa_campaigns') as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()) as any;

    if (error) throw error;

    let queuedCount = 0;
    if (status === 'running') {
      queuedCount = await enqueueCampaignRecipients(adminDb, updated);
    }

    return NextResponse.json({ success: true, campaign: updated, queuedCount });
  } catch (err: any) {
    console.error('[Admin WhatsApp Campaigns PUT Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
