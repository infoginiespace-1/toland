import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ProductionManager } from '@/components/admin/erp/production-manager';

export const dynamic = 'force-dynamic';

export default async function AdminProductionPage() {
  const supabase = createClient();

  const [{ data: productionOrders }, { data: products }, { data: variants }] =
    await Promise.all([
      supabase
        .from('production_orders')
        .select(`
          *,
          product:products (id, name, slug),
          variant:product_variants (id, product_id, size, fit, wash, sku),
          stages:production_stages (*)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('products')
        .select('id, name, slug')
        .order('name', { ascending: true }),
      supabase
        .from('product_variants')
        .select('id, product_id, size, fit, wash, sku')
        .order('size', { ascending: true }),
    ]);

  return (
    <div className="space-y-6">
      <ProductionManager
        productionOrders={(productionOrders || []) as any[]}
        products={(products || []) as any[]}
        variants={(variants || []) as any[]}
      />
    </div>
  );
}
