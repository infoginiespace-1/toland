import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  Package, 
  ShoppingCart, 
  Factory, 
  Users, 
  MessageSquare, 
  Settings, 
  ShieldAlert, 
  BarChart3, 
  TrendingUp,
  LogOut
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/admin');
  }

  const role = (user.app_metadata?.role as string) || 'customer';
  if (role !== 'admin' && role !== 'staff') {
    redirect('/');
  }

  // Fetch counts from database
  const [
    { count: productsCount },
    { count: ordersCount },
    { count: leadsCount },
    { count: waMessagesCount }
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('wa_messages').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Admin Navbar */}
      <header className="bg-primary text-surface h-16 border-b border-primary-hover px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-xl font-black tracking-wider text-surface">
            TOLAND <span className="text-xs px-2 py-0.5 rounded bg-accent font-semibold ml-1">ADMIN ERP</span>
          </Link>
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-surface">{user.phone || 'Admin'}</p>
            <p className="text-surface/70 text-xs uppercase">{role}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-hover hover:bg-danger text-surface transition-colors font-medium text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </form>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-surface-alt border-r border-border p-4 flex flex-col gap-1 text-sm font-medium">
          <div className="text-xs uppercase font-bold text-muted px-3 py-2">Modules</div>

          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-surface font-semibold">
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link href="/admin/products" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text hover:bg-surface transition-colors">
            <Package className="w-4 h-4 text-primary" />
            <span>Products & Catalog</span>
          </Link>

          <Link href="/admin/orders" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text hover:bg-surface transition-colors">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <span>Orders & Invoices</span>
          </Link>

          <Link href="/admin/erp" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text hover:bg-surface transition-colors">
            <Factory className="w-4 h-4 text-primary" />
            <span>ERP & Manufacturing</span>
          </Link>

          <Link href="/admin/crm" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text hover:bg-surface transition-colors">
            <Users className="w-4 h-4 text-primary" />
            <span>CRM & Leads</span>
          </Link>

          <Link href="/admin/whatsapp" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text hover:bg-surface transition-colors">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span>WhatsApp Automation</span>
          </Link>

          <div className="text-xs uppercase font-bold text-muted px-3 pt-6 pb-2">Administration</div>

          <Link href="/admin/roles" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text hover:bg-surface transition-colors">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <span>Admin Allowlist</span>
          </Link>

          <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text hover:bg-surface transition-colors">
            <Settings className="w-4 h-4 text-primary" />
            <span>Settings</span>
          </Link>
        </aside>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 sm:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-black text-text tracking-tight">Executive Dashboard</h1>
                <p className="text-sm text-muted">Realtime view of TOLAND manufacturing, sales, CRM & WhatsApp status.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                  Supabase Backend Live
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-xl bg-surface-alt border border-border shadow-sm">
                <div className="flex items-center justify-between text-muted mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Catalog Products</span>
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-black text-text">{productsCount || 0}</div>
                <p className="text-xs text-muted mt-1">Variants & inventory tracking</p>
              </div>

              <div className="p-5 rounded-xl bg-surface-alt border border-border shadow-sm">
                <div className="flex items-center justify-between text-muted mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
                  <ShoppingCart className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-black text-text">{ordersCount || 0}</div>
                <p className="text-xs text-muted mt-1">Storefront & B2B orders</p>
              </div>

              <div className="p-5 rounded-xl bg-surface-alt border border-border shadow-sm">
                <div className="flex items-center justify-between text-muted mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">CRM Inquiries</span>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-black text-text">{leadsCount || 0}</div>
                <p className="text-xs text-muted mt-1">Active leads & wholesale inquiries</p>
              </div>

              <div className="p-5 rounded-xl bg-surface-alt border border-border shadow-sm">
                <div className="flex items-center justify-between text-muted mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">WhatsApp Traffic</span>
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-black text-text">{waMessagesCount || 0}</div>
                <p className="text-xs text-muted mt-1">OTP, orders & notifications</p>
              </div>
            </div>

            {/* Factory & Warehouse Info */}
            <div className="p-6 rounded-xl bg-surface-alt border border-border">
              <h2 className="text-base font-bold text-text mb-2">Manufacturing Facility</h2>
              <p className="text-sm text-muted">
                TOLAND Private Limited — Sheikhpura, Barbigha, Khetalpura 811101 (Bihar, India).
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                <span className="px-2.5 py-1 rounded bg-surface border border-border text-text">Denim Jeans</span>
                <span className="px-2.5 py-1 rounded bg-surface border border-border text-text">Casual Pants</span>
                <span className="px-2.5 py-1 rounded bg-surface border border-border text-text">Raw Materials BOM</span>
                <span className="px-2.5 py-1 rounded bg-surface border border-border text-text">5-Stage Production Flow</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
