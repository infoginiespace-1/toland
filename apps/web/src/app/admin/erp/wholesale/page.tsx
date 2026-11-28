import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { WholesaleManager } from '@/components/admin/erp/wholesale-manager';

export const dynamic = 'force-dynamic';

export default async function AdminErpWholesalePage() {
  const supabase = createClient();

  const [{ data: orders }, { data: products }, { data: variants }, { data: tiers }] =
    await Promise.all([
      supabase
        .from('erp_wholesale_orders')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('products')
        .select('id, name, base_price')
        .order('name', { ascending: true }),
      supabase
        .from('product_variants')
        .select('id, product_id, size, sku, price, stock_qty')
        .order('size', { ascending: true }),
      supabase
        .from('b2b_price_tiers')
        .select('*')
        .order('min_qty', { ascending: true }),
    ]);

  return (
    <div className="space-y-6">
      <WholesaleManager
        orders={(orders || []) as any[]}
        products={(products || []) as any[]}
        variants={(variants || []) as any[]}
        b2bTiers={(tiers || []) as any[]}
      />
    </div>
  );
}
