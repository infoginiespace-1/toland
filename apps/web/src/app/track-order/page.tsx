'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  ArrowRight,
  Phone,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface FoundOrder {
  id: string;
  order_no: string;
  status: string;
  payment_method: string;
  total: number;
  created_at: string;
  address_snapshot: any;
  order_items: any[];
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('order') || '';

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<FoundOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSearched(true);

      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(searchTerm.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to search for order');
      }

      if (!data.success || !data.orders || data.orders.length === 0) {
        setOrders([]);
        setError(data.message || 'No orders found matching your search.');
      } else {
        setOrders(data.orders);
        setError(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'packed':
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'confirmed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const stages = [
    { key: 'confirmed', label: 'Order Confirmed' },
    { key: 'packed', label: 'Factory Packed' },
    { key: 'shipped', label: 'In-Transit' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getStageIndex = (currentStatus: string) => {
    switch (currentStatus.toLowerCase()) {
      case 'confirmed':
        return 0;
      case 'packed':
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <Truck className="w-3.5 h-3.5 text-accent" />
          <span>Realtime Factory Dispatch Tracking</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
          Track Your Denim Order
        </h1>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Enter your 10-digit registered mobile number or your Order ID to check live stitching, packing, and courier updates.
        </p>
      </div>

      {/* Search Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border shadow-card space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 9876543210 or TLND-43892"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-surface-alt text-sm focus:outline-none focus:border-primary text-text font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Truck className="w-4 h-4" />
            )}
            <span>Track My Parcel</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-2xs text-muted pt-2 border-t border-slate-100">
          <span>Tip: You can search with just your 10-digit WhatsApp number</span>
          <span className="font-mono">Direct Mill Dispatch</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <div className="font-bold">No Records Found</div>
            <p className="text-amber-800/80 mt-0.5">{error}</p>
          </div>
          <a
            href="https://wa.me/918797186001?text=Hello%20TOLAND,%20I%20need%20help%20tracking%20my%20order"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-2xs hover:bg-emerald-700 transition-colors shrink-0"
          >
            Ask on WhatsApp
          </a>
        </div>
      )}

      {/* Orders Result List */}
      {orders.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h2 className="text-base font-bold text-text">
            Found {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} for your search:
          </h2>

          {orders.map((ord) => {
            const currentStageIdx = getStageIndex(ord.status);
            const address = ord.address_snapshot || {};

            return (
              <div
                key={ord.id}
                className="p-6 sm:p-8 rounded-3xl bg-white border border-border shadow-card space-y-6"
              >
                {/* Order Top Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-text">
                        {ord.order_no}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(
                          ord.status
                        )}`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Placed on{' '}
                      {new Date(ord.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      · {ord.payment_method.toUpperCase()}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xl font-bold text-slate-900 font-mono">
                      ₹{ord.total}
                    </div>
                    <Link
                      href={`/orders/${ord.order_no}`}
                      className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      <span>View Full Order Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* 4-Stage Graphical Progress Bar */}
                <div className="pt-2">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {stages.map((stage, idx) => {
                      const isCompleted = idx <= currentStageIdx;
                      const isCurrent = idx === currentStageIdx;

                      return (
                        <div key={stage.key} className="space-y-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isCompleted
                                ? 'bg-primary'
                                : 'bg-slate-200'
                            }`}
                          />
                          <div className="text-[11px] font-bold text-text">
                            {stage.label}
                          </div>
                          {isCurrent && (
                            <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Current Status
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Item Summary */}
                <div className="p-4 rounded-xl bg-surface-alt border border-border text-xs space-y-2">
                  <div className="font-bold text-text uppercase tracking-wider text-3xs text-muted">
                    Package Contents
                  </div>
                  <div className="divide-y divide-slate-100">
                    {(ord.order_items || []).map((item: any, i: number) => (
                      <div key={i} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-text">
                            {item.variant?.product?.name || 'TOLAND Premium Denim'}
                          </span>
                          <span className="text-muted text-2xs block">
                            Size: {item.variant?.size || 'Standard'} · Qty: {item.qty}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-text">
                          ₹{item.price * item.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Destination Address */}
                <div className="text-xs text-muted flex items-start gap-2">
                  <Truck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Delivering to:{' '}
                    <strong className="text-text">{address.name}</strong>,{' '}
                    {address.line1 || address.addressLine1 || ''}
                    {(address.line2 || address.addressLine2) ? `, ${address.line2 || address.addressLine2}` : ''},{' '}
                    {address.city}, {address.state} - {address.pincode}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Support Card */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Phone className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-bold">Have Questions About Your Delivery?</div>
            <div className="text-xs text-white/70">
              Our Sheikhpura factory dispatch desk is available Monday to Saturday, 9am - 7pm IST.
            </div>
          </div>
        </div>

        <a
          href="https://wa.me/918797186001?text=Hello%20TOLAND,%20I%20have%20an%20inquiry%20regarding%20my%20shipment"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Phone className="w-4 h-4" />
          <span>WhatsApp Factory Helpdesk</span>
        </a>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
