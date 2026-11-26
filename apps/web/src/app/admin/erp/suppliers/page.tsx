import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { SuppliersManager } from '@/components/admin/erp/suppliers-manager';

export const dynamic = 'force-dynamic';

export default async function AdminSuppliersPage() {
  const supabase = createClient();

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });

  return (
    <div className="space-y-6">
      <SuppliersManager suppliers={(suppliers || []) as any[]} />
    </div>
  );
}
