import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { LeadsManager } from '@/components/admin/crm/leads-manager';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const supabase = createClient();

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <LeadsManager leads={(leads || []) as any[]} />
    </div>
  );
}
