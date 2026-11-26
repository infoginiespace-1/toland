import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { FollowupsManager } from '@/components/admin/crm/followups-manager';

export const dynamic = 'force-dynamic';

export default async function AdminFollowupsPage() {
  const supabase = createClient();

  const [{ data: followups }, { data: leads }, { data: customers }] =
    await Promise.all([
      supabase
        .from('followups')
        .select(`
          *,
          lead:leads (id, name, phone, stage),
          customer:customers_crm (id, name, phone, stage)
        `)
        .order('due_at', { ascending: true }),
      supabase
        .from('leads')
        .select('id, name, phone')
        .order('name', { ascending: true }),
      supabase
        .from('customers_crm')
        .select('id, name, phone')
        .order('name', { ascending: true }),
    ]);

  return (
    <div className="space-y-6">
      <FollowupsManager
        followups={(followups || []) as any[]}
        leads={(leads || []) as any[]}
        customers={(customers || []) as any[]}
      />
    </div>
  );
}
