import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { RawMaterialsManager } from '@/components/admin/erp/raw-materials-manager';

export const dynamic = 'force-dynamic';

export default async function AdminRawMaterialsPage() {
  const supabase = createClient();

  const { data: materials } = await supabase
    .from('raw_materials')
    .select('*')
    .order('type', { ascending: true })
    .order('name', { ascending: true });

  return (
    <div className="space-y-6">
      <RawMaterialsManager materials={(materials || []) as any[]} />
    </div>
  );
}
