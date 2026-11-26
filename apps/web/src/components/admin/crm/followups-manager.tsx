'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Search,
  Phone,
  User,
  Building,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';

interface FollowupItem {
  id: string;
  lead_id?: string | null;
  customer_id?: string | null;
  due_at: string;
  note: string;
  done: boolean;
  created_at: string;
  lead?: { id: string; name: string; phone: string; stage: string } | null;
  customer?: { id: string; name: string; phone: string; stage: string } | null;
}

interface LeadOption {
  id: string;
  name: string;
  phone: string;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

interface FollowupsManagerProps {
  followups: FollowupItem[];
  leads: LeadOption[];
  customers: CustomerOption[];
}

export function FollowupsManager({
  followups,
  leads,
  customers,
}: FollowupsManagerProps) {
  const router = useRouter();

  // Tabs & Search
  const [tab, setTab] = useState<'pending' | 'due_soon' | 'completed'>('pending');
  const [search, setSearch] = useState('');

  // Add Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'lead' | 'customer'>('lead');
  const [targetId, setTargetId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Action States
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Time calculations
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const pendingList = followups.filter((f) => !f.done);
  const dueSoonList = pendingList.filter((f) => new Date(f.due_at) <= todayEnd);
  const completedList = followups.filter((f) => f.done);

  const handleOpenAddModal = () => {
    setTargetType('lead');
    setTargetId(leads[0]?.id || '');
    // Default to tomorrow 11:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);
    setDueAt(tomorrow.toISOString().slice(0, 16));
    setNote('');
    setError(null);
    setModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || !dueAt) {
      setError('Due date and reminder note are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/crm/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: targetType === 'lead' ? targetId || null : null,
          customer_id: targetType === 'customer' ? targetId || null : null,
          due_at: new Date(dueAt).toISOString(),
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to schedule follow-up');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error scheduling follow-up');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDone = async (f: FollowupItem) => {
    try {
      setTogglingId(f.id);
      const res = await fetch('/api/admin/crm/followups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: f.id,
          done: !f.done,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update follow-up');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Error updating status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this follow-up?')) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/crm/followups?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete follow-up');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Error deleting follow-up');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered by active tab
  let displayList = tab === 'pending' ? pendingList : tab === 'due_soon' ? dueSoonList : completedList;

  if (search) {
    const q = search.toLowerCase();
    displayList = displayList.filter((f) => {
      const matchNote = f.note.toLowerCase().includes(q);
      const matchLead = f.lead?.name.toLowerCase().includes(q) || f.lead?.phone.includes(q);
      const matchCustomer = f.customer?.name.toLowerCase().includes(q) || f.customer?.phone.includes(q);
      return matchNote || matchLead || matchCustomer;
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14532D]">Scheduled Follow-ups</h1>
          <p className="text-sm text-gray-600 mt-1">
            Stay on top of fabric swatch dispatches, price negotiations, and wholesale client check-ins.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-sm font-medium transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          Schedule Follow-up
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Actions</span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#14532D] mt-2">{pendingList.length}</p>
          <span className="text-xs text-gray-500 mt-1 block">Awaiting completion</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Due Today / Overdue</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{dueSoonList.length}</p>
          <span className="text-xs text-rose-600 mt-1 block">Requires immediate outreach</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Completed Follow-ups</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{completedList.length}</p>
          <span className="text-xs text-emerald-600 mt-1 block">Successfully resolved</span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-[#CFE0D5] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              tab === 'pending'
                ? 'bg-[#14532D] text-white shadow-sm'
                : 'bg-[#F0F7F2] text-gray-700 hover:bg-[#E3EFE7]'
            }`}
          >
            Pending ({pendingList.length})
          </button>
          <button
            onClick={() => setTab('due_soon')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              tab === 'due_soon'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Due Soon ({dueSoonList.length})
          </button>
          <button
            onClick={() => setTab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              tab === 'completed'
                ? 'bg-[#14532D] text-white shadow-sm'
                : 'bg-[#F0F7F2] text-gray-700 hover:bg-[#E3EFE7]'
            }`}
          >
            Completed ({completedList.length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, leads, buyers..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-[#CFE0D5] bg-[#F0F7F2]/40 focus:outline-none focus:ring-1 focus:ring-[#14532D]"
          />
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="bg-white rounded-xl border border-[#CFE0D5] shadow-sm overflow-hidden divide-y divide-gray-100">
        {displayList.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No follow-ups in this list</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Schedule your next task or client callback to keep deals moving smoothly.
            </p>
          </div>
        ) : (
          displayList.map((item) => {
            const dueDate = new Date(item.due_at);
            const isOverdue = !item.done && dueDate < now;
            const targetName = item.lead?.name || item.customer?.name;
            const targetPhone = item.lead?.phone || item.customer?.phone;
            const isLead = Boolean(item.lead);

            return (
              <div
                key={item.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                  item.done ? 'bg-gray-50/50 opacity-70' : isOverdue ? 'bg-rose-50/30' : 'hover:bg-gray-50/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleDone(item)}
                    disabled={togglingId === item.id}
                    className="mt-0.5 text-gray-400 hover:text-[#14532D] transition shrink-0"
                    title={item.done ? 'Mark pending' : 'Mark completed'}
                  >
                    {togglingId === item.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#14532D]" />
                    ) : item.done ? (
                      <CheckSquare className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <p
                      className={`text-sm font-semibold text-gray-900 ${
                        item.done ? 'line-through text-gray-400' : ''
                      }`}
                    >
                      {item.note}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      {targetName && (
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          {isLead ? <Building className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                          {targetName} ({targetPhone})
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold ${
                          item.done
                            ? 'text-gray-400'
                            : isOverdue
                            ? 'text-rose-600'
                            : 'text-gray-600'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {dueDate.toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {isOverdue && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                          OVERDUE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-1.5 text-gray-400 hover:text-rose-600 transition rounded-lg hover:bg-gray-100"
                    title="Delete Reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SCHEDULE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CFE0D5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Schedule Follow-up</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Link Target</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('lead');
                      setTargetId(leads[0]?.id || '');
                    }}
                    className={`py-1.5 text-xs rounded-lg font-medium border transition ${
                      targetType === 'lead'
                        ? 'bg-[#14532D] text-white border-[#14532D]'
                        : 'bg-white border-[#CFE0D5] text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    B2B Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('customer');
                      setTargetId(customers[0]?.id || '');
                    }}
                    className={`py-1.5 text-xs rounded-lg font-medium border transition ${
                      targetType === 'customer'
                        ? 'bg-[#14532D] text-white border-[#14532D]'
                        : 'bg-white border-[#CFE0D5] text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    VIP / Customer
                  </button>
                </div>

                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                >
                  <option value="">No specific contact linked</option>
                  {targetType === 'lead'
                    ? leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.phone})
                        </option>
                      ))
                    : customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || 'Unnamed'} ({c.phone})
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date & Time *</label>
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Action Note / Task *</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Call Sunil to review swatch kit feedback and discuss 500 pcs wholesale MoQ..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#CFE0D5]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-xs font-medium transition disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
