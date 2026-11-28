import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ProductionManager } from '@/components/admin/erp/production-manager';

export const dynamic = 'force-dynamic';

export default async function AdminProductionPage({
  searchParams,
}: {
  searchParams?: { product?: string; variant?: string };
}) {
  const supabase = createClient();

  const [
    { data: productionOrders },
    { data: products },
    { data: variants },
    { data: boms },
    { data: qcInspections },
  ] = await Promise.all([
    supabase
      .from('production_orders')
      .select(`
        *,
        product:products (id, name, slug, is_active, base_price, mrp, images:product_images(id, path)),
        variant:product_variants (id, product_id, size, fit, wash, sku, stock_qty),
        stages:production_stages (*)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, name, slug, is_active, base_price, mrp, images:product_images(id, path)')
      .order('name', { ascending: true }),
    supabase
      .from('product_variants')
      .select('id, product_id, size, fit, wash, sku, stock_qty')
      .order('size', { ascending: true }),
    supabase
      .from('boms')
      .select(
        'id, product_id, raw_material_id, qty_per_piece, scrap_percent, raw_material:raw_materials(id, name, unit, stock_qty, unit_price)'
      ),
    supabase
      .from('erp_qc_inspections')
      .select('id, qc_no, status, pass_qty, rework_qty, reject_qty, production_order_id, inspection_type'),
  ]);

  return (
    <div className="space-y-6">
      <ProductionManager
        productionOrders={(productionOrders || []) as any[]}
        products={(products || []) as any[]}
        variants={(variants || []) as any[]}
        boms={(boms || []) as any[]}
        qcInspections={(qcInspections || []) as any[]}
        initialProductId={searchParams?.product}
        initialVariantId={searchParams?.variant}
      />
    </div>
  );
}
