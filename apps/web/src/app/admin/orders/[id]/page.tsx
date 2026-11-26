import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OrderDetailManager } from '@/components/admin/order-detail-manager';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const supabase = createClient();

  const { data: orderData } = (await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        variant:product_variants (
          size,
          fit,
          wash,
          sku,
          product:products (name, slug)
        )
      ),
      shipments (*),
      history:order_status_history (*)
    `)
    .eq('id', params.id)
    .single()) as any;

  if (!orderData) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <OrderDetailManager order={orderData} />
    </div>
  );
}
