import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { CouponsManager } from '@/components/admin/coupons-manager';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  const supabase = createClient();

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <CouponsManager coupons={(coupons || []) as any[]} />
    </div>
  );
}
