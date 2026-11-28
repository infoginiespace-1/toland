import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ReturnsManager } from '@/components/admin/returns-manager';

export const dynamic = 'force-dynamic';

export default async function AdminReturnsPage() {
  const supabase = createClient();

  const { data: rows } = await supabase
    .from('order_status_history')
    .select(`
      id,
      order_id,
      status,
      note,
      created_at,
      order:orders (
        id,
        order_no,
        total,
        payment_method,
        address_snapshot
      )
    `)
    .in('status', [
      'exchange_requested',
      'return_requested',
      'exchange_approved',
      'exchange_dispatched',
      'return_refunded',
      'return_rejected',
    ])
    .order('created_at', { ascending: false });

  return <ReturnsManager rows={(rows || []) as any[]} />;
}
