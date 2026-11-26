import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ShoppingBag, Truck, CheckCircle2, Clock, Package } from 'lucide-react';
import { OrdersTableClient } from '@/components/admin/orders-table-client';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const supabase = createClient();

  const { data: ordersData } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        variant:product_variants (
          size,
          fit,
          wash,
          product:products (name, slug)
        )
      ),
      shipments (*),
      history:order_status_history (*)
    `)
    .order('created_at', { ascending: false });

  const orders = (ordersData || []) as any[];

  // Counts
  const totalOrders = orders.length;
  const pendingPacking = orders.filter((o) => o.status === 'confirmed').length;
  const inTransit = orders.filter((o) => o.status === 'shipped').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + Number(o.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <ShoppingBag className="w-4 h-4" />
            <span>Fulfillment & Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">
            Customer Orders & Shipments
          </h1>
          <p className="text-xs text-muted">
            Track incoming retail orders, update factory fulfillment stages, and trigger automated WhatsApp alerts.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs">
          <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">
            Total Orders
          </span>
          <div className="text-2xl font-black text-text mt-1">{totalOrders}</div>
          <span className="text-3xs text-primary font-bold">Lifetime Bookings</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs">
          <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">
            Pending Factory Pack
          </span>
          <div className="text-2xl font-black text-warning mt-1">{pendingPacking}</div>
          <span className="text-3xs text-muted">Ready for inspection</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs">
          <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">
            In Transit (Courier)
          </span>
          <div className="text-2xl font-black text-accent mt-1">{inTransit}</div>
          <span className="text-3xs text-muted">Out for delivery</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs">
          <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">
            Total Gross Revenue
          </span>
          <div className="text-2xl font-black text-primary font-mono mt-1">₹{totalRevenue}</div>
          <span className="text-3xs text-muted">Prepaid + COD completed</span>
        </div>
      </div>

      {/* Orders Table */}
      <OrdersTableClient orders={orders} />
    </div>
  );
}
