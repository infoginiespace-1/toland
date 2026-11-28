'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Truck,
  Search,
  Loader2,
  Phone,
  ExternalLink,
  Package,
} from 'lucide-react';

interface ReturnHistoryRow {
  id: string;
  order_id: string;
  status: string;
  note: string;
  created_at: string;
  order?: {
    id: string;
    order_no: string;
    total: number;
    payment_method: string;
    address_snapshot: any;
  } | null;
}

interface ReturnsManagerProps {
  rows: ReturnHistoryRow[];
}

export function ReturnsManager({ rows }: ReturnsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'closed'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Group history entries by order_id keeping the original request + latest resolution status
  const ticketMap = new Map<
    string,
    {
      orderId: string;
      orderNo: string;
      customerName: string;
      customerPhone: string;
      cityState: string;
      total: number;
      ticketId: string;
      requestType: 'exchange' | 'return';
      requestNote: string;
      currentStatus: string;
      createdAt: string;
      latestNote: string;
    }
  >();

  // Sort chronologically so latest status overwrites currentStatus while preserving initial request metadata
  const sortedAsc = [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  sortedAsc.forEach((row) => {
    if (!row.order) return;
    const orderId = row.order.id;
    const addr = row.order.address_snapshot || {};
    const ticketMatch = row.note?.match(/TKT-\d+/);
    const ticketId = ticketMatch ? ticketMatch[0] : `RET-${row.order.order_no.slice(-4)}`;

    const existing = ticketMap.get(orderId);
    if (!existing) {
      ticketMap.set(orderId, {
        orderId,
        orderNo: row.order.order_no,
        customerName: addr.name || 'Customer',
        customerPhone: addr.phone || '',
        cityState: `${addr.city || ''}${addr.state ? `, ${addr.state}` : ''}`,
        total: Number(row.order.total || 0),
        ticketId,
        requestType: row.status.includes('exchange') ? 'exchange' : 'return',
        requestNote: row.note || '',
        currentStatus: row.status,
        createdAt: row.created_at,
        latestNote: row.note || '',
      });
    } else {
      existing.currentStatus = row.status;
      existing.latestNote = row.note || existing.latestNote;
      if (row.status === 'exchange_requested' || row.status === 'return_requested') {
        existing.requestNote = row.note || existing.requestNote;
        existing.ticketId = ticketId;
      }
    }
  });

  const tickets = Array.from(ticketMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'pending' && !t.currentStatus.endsWith('_requested')) return false;
    if (filter === 'approved' && t.currentStatus !== 'exchange_approved' && t.currentStatus !== 'exchange_dispatched') return false;
    if (filter === 'closed' && t.currentStatus !== 'return_refunded' && t.currentStatus !== 'return_rejected') return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.orderNo.toLowerCase().includes(q) ||
        t.ticketId.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.customerPhone.includes(q)
      );
    }
    return true;
  });

  const handleAction = async (orderId: string, ticketId: string, nextStatus: string) => {
    const note = prompt(`Optional note for ${ticketId} (${nextStatus.replace(/_/g, ' ')}):`) ?? '';
    try {
      setProcessingId(orderId);
      const res = await fetch('/api/admin/returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          ticket_id: ticketId,
          next_status: nextStatus,
          admin_note: note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update ticket');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Error updating ticket');
    } finally {
      setProcessingId(null);
    }
  };

  const getBadge = (st: string) => {
    if (st.endsWith('_requested')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (st === 'exchange_approved') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (st === 'exchange_dispatched' || st === 'return_refunded') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#14532D] uppercase tracking-wider">
            <RotateCcw className="w-4 h-4" />
            <span>Reverse Logistics &amp; Size Replacements</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Returns &amp; Exchanges Desk ({tickets.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Approve customer 7-day doorstep exchanges, schedule courier pickups, and dispatch WhatsApp updates.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Ticket ID, Order No, Customer or Phone..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/40 focus:outline-none focus:border-[#14532D]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { key: 'all', label: 'All Requests' },
            { key: 'pending', label: 'Pending Approval' },
            { key: 'approved', label: 'Approved / Dispatched' },
            { key: 'closed', label: 'Refunded / Closed' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filter === tab.key
                  ? 'bg-[#14532D] text-white'
                  : 'bg-[#F0F7F2] text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[#CFE0D5] text-center space-y-2 text-xs text-slate-500">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-800">No Return or Exchange Tickets Found</p>
          <p>Customer requests submitted via the /returns portal appear here immediately.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((t) => {
            const busy = processingId === t.orderId;
            return (
              <div
                key={t.orderId}
                className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-[#14532D]">{t.ticketId}</span>
                      <Link
                        href={`/admin/orders/${t.orderId}`}
                        className="font-mono text-xs font-bold text-slate-700 hover:text-[#14532D] hover:underline flex items-center gap-1"
                      >
                        <span>Order #{t.orderNo}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getBadge(t.currentStatus)}`}>
                        {t.currentStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Customer: <strong className="text-slate-800">{t.customerName}</strong> ({t.cityState}) · Phone:{' '}
                      <span className="font-mono">{t.customerPhone}</span> · Value: ₹{t.total}
                    </p>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Date(t.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                  {t.requestNote}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {t.currentStatus.endsWith('_requested') && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleAction(t.orderId, t.ticketId, 'exchange_approved')}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Approve &amp; Schedule Pickup</span>
                    </button>
                  )}

                  {(t.currentStatus.endsWith('_requested') || t.currentStatus === 'exchange_approved') && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleAction(t.orderId, t.ticketId, 'exchange_dispatched')}
                      className="px-3.5 py-2 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#14532D]/90 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch Replacement</span>
                    </button>
                  )}

                  {t.currentStatus !== 'return_refunded' && t.currentStatus !== 'return_rejected' && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleAction(t.orderId, t.ticketId, 'return_refunded')}
                        className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50"
                      >
                        Mark Refunded / Closed
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleAction(t.orderId, t.ticketId, 'return_rejected')}
                        className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {t.customerPhone && (
                    <a
                      href={`https://wa.me/91${t.customerPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                        `Namaste ${t.customerName}, regarding your TOLAND return/exchange ticket ${t.ticketId} for order ${t.orderNo}...`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto px-3 py-1.5 rounded-xl border border-[#CFE0D5] text-xs font-semibold text-[#14532D] hover:bg-[#F0F7F2] flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp Buyer</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
