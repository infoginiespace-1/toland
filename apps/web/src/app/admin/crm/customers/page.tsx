import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { CustomersManager } from '@/components/admin/crm/customers-manager';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const supabase = createClient();

  const { data: customers } = await supabase
    .from('customers_crm')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <CustomersManager customers={(customers || []) as any[]} />
    </div>
  );
}
