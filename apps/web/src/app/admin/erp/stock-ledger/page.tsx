import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { StockLedgerManager } from '@/components/admin/erp/stock-ledger-manager';

export const dynamic = 'force-dynamic';

export default async function AdminStockLedgerPage() {
  const supabase = createClient();

  const [{ data: ledger }, { data: rawMaterials }, { data: variants }] =
    await Promise.all([
      supabase
        .from('stock_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('raw_materials')
        .select('id, name, unit, stock_qty')
        .order('name', { ascending: true }),
      supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
          size,
          fit,
          wash,
          sku,
          stock_qty,
          product:products (name)
        `)
        .order('created_at', { ascending: true }),
    ]);

  return (
    <div className="space-y-6">
      <StockLedgerManager
        ledger={(ledger || []) as any[]}
        rawMaterials={(rawMaterials || []) as any[]}
        variants={(variants || []) as any[]}
      />
    </div>
  );
}
