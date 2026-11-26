import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ActivitiesManager } from '@/components/admin/crm/activities-manager';

export const dynamic = 'force-dynamic';

export default async function AdminActivitiesPage() {
  const supabase = createClient();

  const [{ data: activities }, { data: leads }, { data: customers }] =
    await Promise.all([
      supabase
        .from('activities')
        .select(`
          *,
          customer:customers_crm (id, name, phone, stage),
          lead:leads (id, name, phone, stage)
        `)
        .order('created_at', { ascending: false })
        .limit(100),
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
      <ActivitiesManager
        activities={(activities || []) as any[]}
        leads={(leads || []) as any[]}
        customers={(customers || []) as any[]}
      />
    </div>
  );
}
