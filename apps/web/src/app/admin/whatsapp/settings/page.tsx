import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { SettingsManager } from '@/components/admin/whatsapp/settings-manager';

export const dynamic = 'force-dynamic';

export default async function AdminWhatsAppSettingsPage() {
  const supabase = createClient();

  const { data: settings } = await supabase
    .from('wa_settings')
    .select('*')
    .limit(1)
    .single();

  return (
    <div className="space-y-6">
      <SettingsManager settings={(settings || null) as any} />
    </div>
  );
}
