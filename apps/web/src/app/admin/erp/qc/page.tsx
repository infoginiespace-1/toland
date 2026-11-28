import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { QcManager } from '@/components/admin/erp/qc-manager';

export const dynamic = 'force-dynamic';

export default async function AdminErpQcPage() {
  const supabase = createClient();

  const [{ data: inspections }, { data: productionOrders }, { data: rawMaterials }] =
    await Promise.all([
      supabase
        .from('erp_qc_inspections')
        .select(`
          *,
          production_order:production_orders (id, order_no, product:products(name)),
          raw_material:raw_materials (id, name, batch_lot_no, shade)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('production_orders')
        .select('id, order_no, status, product:products(name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('raw_materials')
        .select('id, name, type, batch_lot_no, shade')
        .order('name', { ascending: true }),
    ]);

  return (
    <div className="space-y-6">
      <QcManager
        inspections={(inspections || []) as any[]}
        productionOrders={(productionOrders || []) as any[]}
        rawMaterials={(rawMaterials || []) as any[]}
      />
    </div>
  );
}
