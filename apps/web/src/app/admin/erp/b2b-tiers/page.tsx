import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { B2BTiersManager } from '@/components/admin/erp/b2b-tiers-manager';

export const dynamic = 'force-dynamic';

export default async function AdminB2BTiersPage() {
  const supabase = createClient();

  const [{ data: tiers }, { data: products }] = await Promise.all([
    supabase
      .from('b2b_price_tiers')
      .select(`
        *,
        product:products (id, name, slug, base_price)
      `)
      .order('min_qty', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, slug, base_price')
      .order('name', { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <B2BTiersManager
        tiers={(tiers || []) as any[]}
        products={(products || []) as any[]}
      />
    </div>
  );
}
