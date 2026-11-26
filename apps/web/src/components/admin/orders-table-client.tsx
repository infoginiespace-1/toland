'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Phone,
  MapPin,
} from 'lucide-react';

interface OrdersTableClientProps {
  orders: any[];
}

export function OrdersTableClient({ orders }: OrdersTableClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = orders.filter((o) => {
    const address = o.address_snapshot || {};
    const matchesSearch =
      !search ||
      o.order_no.toLowerCase().includes(search.toLowerCase()) ||
      (address.name && address.name.toLowerCase().includes(search.toLowerCase())) ||
      (address.phone && address.phone.includes(search)) ||
      (address.city && address.city.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'placed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-[#E3EFE7] text-primary border border-[#CFE0D5]">
            <Clock className="w-3 h-3" />
            Placed
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-accent/15 text-accent border border-accent/25">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'packed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-warning/15 text-warning border border-warning/25">
            <Package className="w-3 h-3" />
            Factory Packed
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-primary/15 text-primary border border-primary/25">
            <Truck className="w-3 h-3" />
            Dispatched
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-success/15 text-success border border-success/25">
            <CheckCircle2 className="w-3 h-3" />
            Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-danger/15 text-danger border border-danger/25">
            <AlertCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-muted/15 text-muted border border-border">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden space-y-4 p-5">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#CFE0D5]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order No (TLD-...), customer name, phone, or city..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs text-text focus:outline-none focus:border-primary font-medium"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'placed', label: 'Placed' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'packed', label: 'Packed' },
            { key: 'shipped', label: 'Dispatched' },
            { key: 'delivered', label: 'Delivered' },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-[#F0F7F2] text-muted hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase tracking-wider">
              <th className="py-3 px-4">Order No</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Delivery Destination</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CFE0D5]">
            {filtered.length > 0 ? (
              filtered.map((order) => {
                const address = order.address_snapshot || {};
                const itemsCount = (order.order_items || []).reduce(
                  (acc: number, i: any) => acc + (i.qty || 1),
                  0
                );

                return (
                  <tr key={order.id} className="hover:bg-[#F0F7F2]/40 transition-colors">
                    {/* Order No */}
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono font-black text-primary hover:underline block"
                      >
                        {order.order_no}
                      </Link>
                      <span className="text-3xs text-muted block mt-0.5">
                        {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3 text-muted">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <span className="text-3xs block font-mono">
                        {new Date(order.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-text">{address.name || 'Anonymous Customer'}</div>
                      <div className="flex items-center gap-1 text-3xs text-muted font-mono mt-0.5">
                        <Phone className="w-2.5 h-2.5" />
                        <span>{address.phone || 'No phone'}</span>
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="py-3.5 px-3 text-muted">
                      <div className="font-medium text-text">{address.city}, {address.state}</div>
                      <span className="text-3xs font-mono text-muted">{address.pincode}</span>
                    </td>

                    {/* Financials & Payment */}
                    <td className="py-3.5 px-3">
                      <div className="font-black text-text font-mono">₹{order.total}</div>
                      <div className="flex items-center gap-1 text-3xs mt-0.5 font-bold">
                        <span
                          className={`px-1.5 py-0.2 rounded text-3xs uppercase ${
                            order.payment_method === 'cod'
                              ? 'bg-warning/15 text-warning'
                              : 'bg-success/15 text-success'
                          }`}
                        >
                          {order.payment_method?.toUpperCase()}
                        </span>
                        <span className="text-muted">({order.payment_status})</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      {getStatusBadge(order.status)}
                    </td>

                    {/* Details Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-3xs font-bold hover:bg-primary-hover shadow-2xs transition-colors"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted text-xs">
                  No orders found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
