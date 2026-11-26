'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Plus,
  Phone,
  MessageSquare,
  ShoppingBag,
  FileText,
  TrendingUp,
  Search,
  User,
  Building,
  Clock,
  Filter,
  AlertTriangle,
  Loader2,
  X,
  Package,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  customer_id?: string | null;
  lead_id?: string | null;
  activity_type: string;
  description: string;
  metadata?: any;
  created_at: string;
  customer?: { id: string; name: string; phone: string; stage: string } | null;
  lead?: { id: string; name: string; phone: string; stage: string } | null;
}

interface OptionItem {
  id: string;
  name: string;
  phone: string;
}

interface ActivitiesManagerProps {
  activities: ActivityItem[];
  leads: OptionItem[];
  customers: OptionItem[];
}

export function ActivitiesManager({
  activities,
  leads,
  customers,
}: ActivitiesManagerProps) {
  const router = useRouter();

  // Search & Type Filter
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Log Activity Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'lead' | 'customer'>('lead');
  const [targetId, setTargetId] = useState('');
  const [activityType, setActivityType] = useState('call');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getActivityConfig = (type: string) => {
    switch (type) {
      case 'call':
        return { icon: Phone, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Phone Call' };
      case 'message':
        return { icon: MessageSquare, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'WhatsApp Message' };
      case 'order':
        return { icon: ShoppingBag, color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Wholesale Order' };
      case 'status_change':
        return { icon: TrendingUp, color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Pipeline Shift' };
      default:
        return { icon: FileText, color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Internal Note' };
    }
  };

  const handleOpenAddModal = () => {
    setTargetType('lead');
    setTargetId(leads[0]?.id || '');
    setActivityType('call');
    setDescription('');
    setError(null);
    setModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Activity description is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: targetType === 'lead' ? targetId || null : null,
          customer_id: targetType === 'customer' ? targetId || null : null,
          activity_type: activityType,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record activity');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error recording activity');
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((a) => {
    if (typeFilter !== 'all' && a.activity_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchDesc = a.description.toLowerCase().includes(q);
      const matchLead = a.lead?.name.toLowerCase().includes(q) || a.lead?.phone.includes(q);
      const matchCust = a.customer?.name.toLowerCase().includes(q) || a.customer?.phone.includes(q);
      return matchDesc || matchLead || matchCust;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14532D]">CRM Activity Audit Feed</h1>
          <p className="text-sm text-gray-600 mt-1">
            Chronological audit log of customer calls, WhatsApp dispatches, order updates, and status shifts.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-sm font-medium transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          Log Activity Note
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#CFE0D5] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'call', 'message', 'order', 'status_change', 'note'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                typeFilter === t
                  ? 'bg-[#14532D] text-white shadow-sm'
                  : 'bg-[#F0F7F2] text-gray-700 hover:bg-[#E3EFE7]'
              }`}
            >
              {t === 'all' ? 'All Activities' : t.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity description or buyer..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-[#CFE0D5] bg-[#F0F7F2]/40 focus:outline-none focus:ring-1 focus:ring-[#14532D]"
          />
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl border border-[#CFE0D5] shadow-sm p-6">
        {filteredActivities.length === 0 ? (
          <div className="py-12 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No activity logs recorded</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              CRM movements, sample dispatches, and WhatsApp actions will stream here in real time.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
            {filteredActivities.map((act) => {
              const conf = getActivityConfig(act.activity_type);
              const Icon = conf.icon;
              const contactName = act.lead?.name || act.customer?.name;
              const contactPhone = act.lead?.phone || act.customer?.phone;
              const isLead = Boolean(act.lead);

              return (
                <div key={act.id} className="relative flex items-start gap-4 group">
                  {/* Timeline Node Icon */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border -ml-6.5 bg-white z-10 ${conf.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Activity Details Card */}
                  <div className="flex-1 bg-gray-50/70 p-4 rounded-xl border border-gray-200 hover:border-[#CFE0D5] transition space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${conf.color}`}>
                          {conf.label}
                        </span>
                        {contactName && (
                          <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                            {isLead ? <Building className="w-3.5 h-3.5 text-gray-500" /> : <User className="w-3.5 h-3.5 text-gray-500" />}
                            {contactName}
                          </span>
                        )}
                        {contactPhone && (
                          <span className="text-[11px] font-mono text-gray-500">({contactPhone})</span>
                        )}
                      </div>

                      <span className="text-[11px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(act.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed pt-0.5">{act.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LOG ACTIVITY MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CFE0D5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Log CRM Activity</h3>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Contact</label>
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
                  <option value="">General Factory Activity (No Contact)</option>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Activity Type</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                >
                  <option value="call">Phone Call with Buyer</option>
                  <option value="message">WhatsApp Message / Conversation</option>
                  <option value="note">Internal Factory Note</option>
                  <option value="order">Wholesale Booking Discussion</option>
                  <option value="status_change">Stage / Milestone Change</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Details & Outcomes *</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Conducted 15-minute phone call with Rajiv Singhania regarding 500 pcs denim delivery timelines..."
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
                  Log Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
