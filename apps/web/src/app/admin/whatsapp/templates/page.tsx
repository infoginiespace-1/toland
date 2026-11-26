import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { TemplatesManager } from '@/components/admin/whatsapp/templates-manager';

export const dynamic = 'force-dynamic';

export default async function AdminWhatsAppTemplatesPage() {
  const supabase = createClient();

  const { data: templates } = await supabase
    .from('wa_templates')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      <TemplatesManager templates={(templates || []) as any[]} />
    </div>
  );
}
