'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Image as ImageIcon,
  Tag,
  ShoppingBag,
  MessageSquare,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Shield,
  Truck,
  Users,
  Boxes,
  Factory,
  FileSpreadsheet,
  ClipboardList,
  Activity,
  Percent,
  Contact,
  CalendarClock,
  Radio,
  Bot,
  Sliders,
} from 'lucide-react';

interface AdminSidebarProps {
  userPhone?: string;
  userRole?: string;
}

export function AdminSidebar({ userPhone = 'Admin', userRole = 'admin' }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      group: 'Core Storefront',
      links: [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Products', href: '/admin/products', icon: Package },
        { label: 'Categories', href: '/admin/categories', icon: Layers },
        { label: 'Banners', href: '/admin/banners', icon: ImageIcon },
        { label: 'Coupons', href: '/admin/coupons', icon: Tag },
        { label: 'Orders & Shipments', href: '/admin/orders', icon: ShoppingBag },
      ],
    },
    {
      group: 'ERP & Manufacturing',
      links: [
        { label: 'Raw Materials', href: '/admin/erp/raw-materials', icon: Boxes },
        { label: 'Suppliers', href: '/admin/erp/suppliers', icon: Factory },
        { label: 'Bill of Materials', href: '/admin/erp/boms', icon: FileSpreadsheet },
        { label: 'Purchase Orders', href: '/admin/erp/purchase-orders', icon: ClipboardList },
        { label: 'Production Runs', href: '/admin/erp/production', icon: Layers },
        { label: 'Stock Ledger', href: '/admin/erp/stock-ledger', icon: Activity },
        { label: 'B2B Price Tiers', href: '/admin/erp/b2b-tiers', icon: Percent },
      ],
    },
    {
      group: 'CRM & B2B Pipeline',
      links: [
        { label: 'Customer Directory', href: '/admin/crm/customers', icon: Users },
        { label: 'B2B Leads Pipeline', href: '/admin/crm/leads', icon: Contact },
        { label: 'Scheduled Follow-ups', href: '/admin/crm/followups', icon: CalendarClock },
        { label: 'Activity Audit Feed', href: '/admin/crm/activities', icon: Activity },
      ],
    },
    {
      group: 'WhatsApp & Engagement',
      links: [
        { label: 'Live Inbox & Bridge', href: '/admin/whatsapp', icon: MessageSquare },
        { label: 'Message Templates', href: '/admin/whatsapp/templates', icon: FileSpreadsheet },
        { label: 'Broadcast Campaigns', href: '/admin/whatsapp/campaigns', icon: Radio },
        { label: 'Auto-Reply Bot', href: '/admin/whatsapp/auto-replies', icon: Bot },
        { label: 'Anti-Ban Engine', href: '/admin/whatsapp/settings', icon: Sliders },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0B1120] text-white select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-emerald-400 text-sm tracking-wider">
            T
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
              <span>TOLAND</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-medium">
                ERP
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-normal">Denim Manufacturing Hub</div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {navItems.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
              {sec.group}
            </span>
            <div className="space-y-0.5 mt-1">
              {sec.links.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                      isActive
                        ? 'bg-primary text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* External Quick Link */}
        <div className="pt-2 border-t border-white/10">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Storefront</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">Web</span>
          </Link>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-3.5 border-t border-white/10 bg-[#070B14] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
            {userPhone.slice(-2)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{userPhone}</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-mono">
              <Shield className="w-2.5 h-2.5 text-emerald-400" />
              <span>{userRole}</span>
            </div>
          </div>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            title="Sign out of Admin ERP"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top toggle bar */}
      <div className="lg:hidden bg-[#0B1120] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-emerald-400 text-xs">
            T
          </div>
          <span className="font-bold text-sm tracking-wide">TOLAND ADMIN</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 border-r border-white/10">
        {sidebarContent}
      </aside>
    </>
  );
}
