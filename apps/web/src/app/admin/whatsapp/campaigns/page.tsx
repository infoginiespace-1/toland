import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CampaignsManager } from '@/components/admin/whatsapp/campaigns-manager';

export const dynamic = 'force-dynamic';

export default async function AdminWhatsAppCampaignsPage() {
  let supabase: any;
  try {
    supabase = createAdminClient();
  } catch {
    supabase = createClient();
  }

  const [{ data: campaigns }, { data: templates }, { data: campaignMsgs }] = await Promise.all([
    supabase
      .from('wa_campaigns')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('wa_templates')
      .select('key, name, category')
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('wa_messages')
      .select('status, metadata')
      .not('metadata->campaign_id', 'is', null),
  ]);

  const statsByCampaign: Record<string, { total: number; sent: number; queued: number; failed: number }> = {};
  (campaignMsgs || []).forEach((m: any) => {
    const cid = m.metadata?.campaign_id;
    if (!cid) return;
    if (!statsByCampaign[cid]) {
      statsByCampaign[cid] = { total: 0, sent: 0, queued: 0, failed: 0 };
    }
    statsByCampaign[cid].total += 1;
    if (m.status === 'sent' || m.status === 'delivered') statsByCampaign[cid].sent += 1;
    else if (m.status === 'queued') statsByCampaign[cid].queued += 1;
    else if (m.status === 'failed') statsByCampaign[cid].failed += 1;
  });

  return (
    <div className="space-y-6">
      <CampaignsManager
        campaigns={(campaigns || []) as any[]}
        templates={(templates || []) as any[]}
        statsByCampaign={statsByCampaign}
      />
    </div>
  );
}
