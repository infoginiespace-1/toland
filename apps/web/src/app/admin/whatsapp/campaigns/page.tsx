import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { CampaignsManager } from '@/components/admin/whatsapp/campaigns-manager';

export const dynamic = 'force-dynamic';

export default async function AdminWhatsAppCampaignsPage() {
  const supabase = createClient();

  const [{ data: campaigns }, { data: templates }] = await Promise.all([
    supabase
      .from('wa_campaigns')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('wa_templates')
      .select('key, name, category')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <CampaignsManager
        campaigns={(campaigns || []) as any[]}
        templates={(templates || []) as any[]}
      />
    </div>
  );
}
