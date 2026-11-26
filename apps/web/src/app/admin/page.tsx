import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  MessageSquare,
  Users,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Tag,
  Layers,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createClient();

  // Fetch counts and recent rows in parallel
  const [
    { count: productsCount },
    { count: ordersCount },
    { count: leadsCount },
    { count: waMessagesCount },
    { data: recentOrdersData },
    { data: recentMessagesData },
    { data: waSessionData },
    { data: allOrdersData },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('wa_messages').select('*', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('id, order_no, total, status, payment_method, address_snapshot, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('wa_messages')
      .select('id, phone, body, status, created_at, template_key')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('wa_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
    supabase.from('orders').select('total, status'),
  ]);

  const recentOrders = (recentOrdersData || []) as any[];
  const recentMessages = (recentMessagesData || []) as any[];
  const waSession = waSessionData as any;
  const allOrders = (allOrdersData || []) as any[];

  const totalGrossRevenue = allOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + Number(o.total || 0), 0);

  const isWaConnected = waSession?.status === 'connected';

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-3xs font-bold bg-primary/10 text-primary border border-primary/20 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>TOLAND Manufacturing Facility (Sheikhpura, Bihar)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">
            Production & Retail Operations
          </h1>
          <p className="text-xs text-muted">
            Live overview of ecommerce storefront bookings, factory catalog inventory, and WhatsApp queue.
          </p>
        </div>

        {/* Quick Add Product Button */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </Link>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">
              Gross Bookings
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E3EFE7] text-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-primary font-mono">
            ₹{totalGrossRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-3xs text-muted block">Storefront orders total</span>
        </div>

        {/* Orders Count */}
        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E3EFE7] text-primary flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-text">
            {ordersCount || 0}
          </div>
          <Link href="/admin/orders" className="text-3xs text-primary font-bold hover:underline flex items-center gap-1">
            <span>Manage Shipments</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Catalog Models */}
        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">
              Catalog Models
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E3EFE7] text-primary flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-text">
            {productsCount || 0}
          </div>
          <Link href="/admin/products" className="text-3xs text-primary font-bold hover:underline flex items-center gap-1">
            <span>View All Styles</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* WhatsApp Status */}
        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">
              WhatsApp Bridge
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E3EFE7] text-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black flex items-center gap-2">
            {isWaConnected ? (
              <span className="text-success flex items-center gap-1.5 text-base font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                Live +{waSession?.connected_phone?.slice(-4)}
              </span>
            ) : (
              <span className="text-warning text-sm font-bold flex items-center gap-1">
                <QrCode className="w-4 h-4" />
                QR Scan Needed
              </span>
            )}
          </div>
          <Link href="/admin/whatsapp" className="text-3xs text-primary font-bold hover:underline flex items-center gap-1">
            <span>Bridge Panel ({waMessagesCount || 0} msgs)</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Quick Launchpad Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/admin/products/new"
          className="p-4 rounded-2xl bg-white border border-[#CFE0D5] hover:border-primary hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F0F7F2] text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-text block">Add Product</span>
            <span className="text-3xs text-muted">Upload denim model</span>
          </div>
        </Link>

        <Link
          href="/admin/categories"
          className="p-4 rounded-2xl bg-white border border-[#CFE0D5] hover:border-primary hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F0F7F2] text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-text block">Categories</span>
            <span className="text-3xs text-muted">Manage denim fits</span>
          </div>
        </Link>

        <Link
          href="/admin/coupons"
          className="p-4 rounded-2xl bg-white border border-[#CFE0D5] hover:border-primary hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F0F7F2] text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-text block">Promo Codes</span>
            <span className="text-3xs text-muted">Launch campaigns</span>
          </div>
        </Link>

        <Link
          href="/admin/banners"
          className="p-4 rounded-2xl bg-white border border-[#CFE0D5] hover:border-primary hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F0F7F2] text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-text block">Hero Banners</span>
            <span className="text-3xs text-muted">Update home slider</span>
          </div>
        </Link>
      </div>

      {/* Split Section: Recent Orders & WhatsApp Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#CFE0D5] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                Recent Storefront Bookings
              </h2>
              <p className="text-3xs text-muted">Latest consumer orders from across India</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All ({ordersCount || 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase">
                  <th className="py-2.5 px-3">Order No</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CFE0D5]">
                {recentOrders.length > 0 ? (
                  recentOrders.map((o) => {
                    const address = o.address_snapshot || {};
                    return (
                      <tr key={o.id} className="hover:bg-[#F0F7F2]/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-primary">
                          {o.order_no}
                        </td>
                        <td className="py-3 px-3 font-medium text-text">
                          {address.name || 'Anonymous Customer'}
                          <span className="text-3xs text-muted block font-mono">
                            {address.city}, {address.state}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-text">
                          ₹{o.total}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-3xs font-bold uppercase bg-[#E3EFE7] text-primary">
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="px-2.5 py-1 rounded-lg bg-primary text-white text-3xs font-bold hover:bg-primary-hover transition-colors"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted text-xs">
                      No customer orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 Col): WhatsApp Automation Feed */}
        <div className="bg-white rounded-2xl border border-[#CFE0D5] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                WhatsApp Dispatch Feed
              </h2>
              <p className="text-3xs text-muted">Outbound notifications</p>
            </div>
            <Link
              href="/admin/whatsapp"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Bridge Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {recentMessages.length > 0 ? (
              recentMessages.map((msg: any) => (
                <div
                  key={msg.id}
                  className="p-3 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-text text-3xs">
                      {msg.phone}
                    </span>
                    <span
                      className={`text-3xs font-bold px-1.5 py-0.2 rounded uppercase ${
                        msg.status === 'sent'
                          ? 'bg-success/15 text-success'
                          : msg.status === 'queued'
                          ? 'bg-warning/15 text-warning'
                          : 'bg-muted/15 text-muted'
                      }`}
                    >
                      {msg.status}
                    </span>
                  </div>
                  <p className="text-3xs text-muted line-clamp-2 leading-relaxed">
                    {msg.body}
                  </p>
                  <span className="text-3xs text-muted/70 font-mono block">
                    {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted py-6 text-center">
                No recent WhatsApp messages queued.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
