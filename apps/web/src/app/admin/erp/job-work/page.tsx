import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { JobWorkManager } from '@/components/admin/erp/job-work-manager';

export const dynamic = 'force-dynamic';

export default async function AdminErpJobWorkPage() {
  const supabase = createClient();

  const [{ data: karigars }, { data: challans }, { data: productionOrders }] = await Promise.all([
    supabase.from('erp_karigars').select('*').order('name', { ascending: true }),
    supabase
      .from('erp_job_work_challans')
      .select(`
        *,
        karigar:erp_karigars (id, name, phone, department, rate_per_piece),
        production_order:production_orders (id, order_no, product:products(name))
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('production_orders')
      .select('id, order_no, status, product:products(name)')
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <JobWorkManager
        karigars={(karigars || []) as any[]}
        challans={(challans || []) as any[]}
        productionOrders={(productionOrders || []) as any[]}
      />
    </div>
  );
}
