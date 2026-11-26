import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { AutoReplyManager } from '@/components/admin/whatsapp/autoreply-manager';

export const dynamic = 'force-dynamic';

export default async function AdminWhatsAppAutoRepliesPage() {
  const supabase = createClient();

  const [{ data: rules }, { data: templates }] = await Promise.all([
    supabase
      .from('wa_autoreply_rules')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('wa_templates')
      .select('key, name')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <AutoReplyManager
        rules={(rules || []) as any[]}
        templates={(templates || []) as any[]}
      />
    </div>
  );
}
