import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ErpOverviewClient } from '@/components/admin/erp/erp-overview-client';

export const dynamic = 'force-dynamic';

export default async function AdminErpOverviewPage() {
  const supabase = createClient();

  const [
    { data: rawMaterials },
    { data: products },
    { data: boms },
    { data: productionOrders },
    { data: purchaseOrders },
  ] = await Promise.all([
    supabase.from('raw_materials').select('*').order('name', { ascending: true }),
    supabase.from('products').select('id, name, slug, base_price, mrp').order('name', { ascending: true }),
    supabase.from('boms').select('*, raw_material:raw_materials(id, name, unit_price, stock_qty, unit)'),
    supabase.from('production_orders').select('*, stages:production_stages(*)'),
    supabase.from('purchase_orders').select('id, status, total_amount'),
  ]);

  return (
    <ErpOverviewClient
      rawMaterials={(rawMaterials || []) as any[]}
      products={(products || []) as any[]}
      boms={(boms || []) as any[]}
      productionOrders={(productionOrders || []) as any[]}
      purchaseOrders={(purchaseOrders || []) as any[]}
    />
  );
}
