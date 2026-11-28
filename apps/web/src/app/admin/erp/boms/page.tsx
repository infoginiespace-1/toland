import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { BOMsManager } from '@/components/admin/erp/boms-manager';

export const dynamic = 'force-dynamic';

export default async function AdminBOMsPage() {
  const supabase = createClient();

  const [{ data: products }, { data: rawMaterials }, { data: boms }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, base_price, labor_cost_per_piece, overhead_cost_per_piece')
      .order('name', { ascending: true }),
    supabase
      .from('raw_materials')
      .select('id, name, type, unit, stock_qty, unit_price')
      .order('type', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('boms')
      .select(`
        *,
        product:products (id, name, slug, base_price, labor_cost_per_piece, overhead_cost_per_piece),
        raw_material:raw_materials (*)
      `)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <BOMsManager
        products={(products || []) as any[]}
        rawMaterials={(rawMaterials || []) as any[]}
        boms={(boms || []) as any[]}
      />
    </div>
  );
}
