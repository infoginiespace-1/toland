import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { PurchaseOrdersManager } from '@/components/admin/erp/purchase-orders-manager';

export const dynamic = 'force-dynamic';

export default async function AdminPurchaseOrdersPage() {
  const supabase = createClient();

  const [{ data: purchaseOrders }, { data: suppliers }, { data: rawMaterials }] =
    await Promise.all([
      supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers (*),
          items:purchase_order_items (
            *,
            raw_material:raw_materials (*)
          )
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('suppliers')
        .select('id, name')
        .order('name', { ascending: true }),
      supabase
        .from('raw_materials')
        .select('id, name, unit, unit_price')
        .order('name', { ascending: true }),
    ]);

  return (
    <div className="space-y-6">
      <PurchaseOrdersManager
        purchaseOrders={(purchaseOrders || []) as any[]}
        suppliers={(suppliers || []) as any[]}
        rawMaterials={(rawMaterials || []) as any[]}
      />
    </div>
  );
}
