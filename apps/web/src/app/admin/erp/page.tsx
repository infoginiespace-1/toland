import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ErpOverviewClient } from '@/components/admin/erp/erp-overview-client';

export const dynamic = 'force-dynamic';

export default async function AdminErpOverviewPage() {
  const supabase = createClient();

  const [
    { data: rawMaterials },
    { data: products },
    { data: variants },
    { data: boms },
    { data: productionOrders },
    { data: purchaseOrders },
    { data: qcInspections },
    { data: jobWorkChallans },
    { data: wholesaleOrders },
  ] = await Promise.all([
    supabase.from('raw_materials').select('*').order('name', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, slug, base_price, mrp, labor_cost_per_piece, overhead_cost_per_piece')
      .order('name', { ascending: true }),
    supabase
      .from('product_variants')
      .select('id, product_id, sku, size, fit, wash, stock_qty, product:products(name)')
      .order('stock_qty', { ascending: true }),
    supabase
      .from('boms')
      .select('*, raw_material:raw_materials(id, name, unit_price, stock_qty, unit)'),
    supabase.from('production_orders').select('*, stages:production_stages(*)'),
    supabase.from('purchase_orders').select('id, status, total_amount, paid_amount'),
    supabase.from('erp_qc_inspections').select('id, status, pass_qty, rework_qty, reject_qty'),
    supabase
      .from('erp_job_work_challans')
      .select('id, status, total_wage, paid_amount, qty_issued, qty_returned'),
    supabase
      .from('erp_wholesale_orders')
      .select('id, status, total_amount, paid_amount'),
  ]);

  return (
    <ErpOverviewClient
      rawMaterials={(rawMaterials || []) as any[]}
      products={(products || []) as any[]}
      variants={(variants || []) as any[]}
      boms={(boms || []) as any[]}
      productionOrders={(productionOrders || []) as any[]}
      purchaseOrders={(purchaseOrders || []) as any[]}
      qcInspections={(qcInspections || []) as any[]}
      jobWorkChallans={(jobWorkChallans || []) as any[]}
      wholesaleOrders={(wholesaleOrders || []) as any[]}
    />
  );
}
