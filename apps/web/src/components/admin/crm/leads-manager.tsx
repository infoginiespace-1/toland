'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Contact,
  Plus,
  Search,
  Kanban,
  Table as TableIcon,
  IndianRupee,
  Calendar,
  Phone,
  MessageSquare,
  ArrowRight,
  Crown,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Loader2,
  X,
  Send,
  Download,
} from 'lucide-react';
import { downloadCsv } from '@/lib/csv-export';

interface LeadItem {
  id: string;
  name: string;
  phone: string;
  source: string;
  stage: 'new' | 'contacted' | 'sample_sent' | 'negotiation' | 'converted' | 'lost';
  value: number;
  next_followup_at?: string | null;
  created_at: string;
}

interface LeadsManagerProps {
  leads: LeadItem[];
}

const STAGES = [
  { key: 'new', label: '1. New Inquiry', color: 'border-blue-300 bg-blue-50/50 text-blue-800' },
  { key: 'contacted', label: '2. Contacted', color: 'border-purple-300 bg-purple-50/50 text-purple-800' },
  { key: 'sample_sent', label: '3. Samples Sent', color: 'border-amber-300 bg-amber-50/50 text-amber-800' },
  { key: 'negotiation', label: '4. Negotiation', color: 'border-orange-300 bg-orange-50/50 text-orange-800' },
  { key: 'converted', label: '5. Converted (Won)', color: 'border-emerald-300 bg-emerald-50/50 text-emerald-800' },
  { key: 'lost', label: '6. Lost', color: 'border-rose-300 bg-rose-50/50 text-rose-800' },
];

export function LeadsManager({ leads }: LeadsManagerProps) {
  const router = useRouter();

  // View state
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');

  // Add Lead Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('website_b2b');
  const [stage, setStage] = useState<'new' | 'contacted' | 'sample_sent' | 'negotiation'>('new');
  const [value, setValue] = useState('150000');
  const [nextFollowup, setNextFollowup] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Action States
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Quick WhatsApp Modal
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waRecipient, setWaRecipient] = useState<LeadItem | null>(null);
  const [waMessage, setWaMessage] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waSuccess, setWaSuccess] = useState(false);

  // KPI Calculations
  const activeLeads = leads.filter((l) => ['new', 'contacted', 'sample_sent', 'negotiation'].includes(l.stage));
  const activePipelineValue = activeLeads.reduce((sum, l) => sum + Number(l.value || 0), 0);
  const convertedLeads = leads.filter((l) => l.stage === 'converted');
  const convertedValue = convertedLeads.reduce((sum, l) => sum + Number(l.value || 0), 0);
  const closedCount = convertedLeads.length + leads.filter((l) => l.stage === 'lost').length;
  const winRate = closedCount > 0 ? Math.round((convertedLeads.length / closedCount) * 100) : 100;

  const handleOpenAddModal = () => {
    setName('');
    setPhone('');
    setSource('website_b2b');
    setStage('new');
    setValue('150000');
    setNextFollowup('');
    setError(null);
    setModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Lead name and phone number are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          source,
          stage,
          value: parseFloat(value) || 0,
          next_followup_at: nextFollowup ? new Date(nextFollowup).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create lead');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error creating lead');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStage = async (lead: LeadItem) => {
    const stageSeq: ('new' | 'contacted' | 'sample_sent' | 'negotiation' | 'converted')[] = [
      'new',
      'contacted',
      'sample_sent',
      'negotiation',
      'converted',
    ];
    const currIdx = stageSeq.indexOf(lead.stage as any);
    if (currIdx < 0 || currIdx >= stageSeq.length - 1) return;

    const nextStage = stageSeq[currIdx + 1];

    try {
      setUpdatingId(lead.id);
      const res = await fetch('/api/admin/crm/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          stage: nextStage,
          convert_to_customer: nextStage === 'converted',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to advance stage');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Error updating stage');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConvertToCustomer = async (lead: LeadItem) => {
    if (!confirm(`Convert ${lead.name} to official VIP Customer in CRM Directory?`)) return;

    try {
      setUpdatingId(lead.id);
      const res = await fetch('/api/admin/crm/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          stage: 'converted',
          convert_to_customer: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert lead');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Error converting lead');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to remove this lead?')) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/crm/leads?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete lead');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Error deleting lead');
    } finally {
      setDeletingId(null);
    }
  };

  const openWhatsAppModal = (lead: LeadItem) => {
    setWaRecipient(lead);
    setWaMessage(
      `Namaste ${lead.name}, greetings from TOLAND Denim Pvt. Ltd. (Barbigha, Bihar)! We received your wholesale inquiry and would love to share our factory price tiers and fabric swatch kit. When would be a good time to connect?`
    );
    setWaSuccess(false);
    setWaModalOpen(true);
  };

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waRecipient || !waMessage.trim()) return;

    try {
      setWaSending(true);
      const res = await fetch('/api/admin/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: waRecipient.phone,
          message: waMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch message');

      setWaSuccess(true);
      setTimeout(() => setWaModalOpen(false), 1500);
    } catch (err: any) {
      alert(err?.message || 'Error sending message');
    } finally {
      setWaSending(false);
    }
  };

  // Filter leads
  const filteredLeads = leads.filter((l) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = l.name.toLowerCase().includes(q);
      const matchPhone = l.phone.includes(q);
      if (!matchName && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14532D]">B2B Leads Pipeline</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track wholesale denim inquiries: New &rarr; Contacted &rarr; Samples &rarr; Negotiation &rarr; Converted.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white border border-[#CFE0D5] rounded-lg p-0.5 flex items-center shadow-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'kanban'
                  ? 'bg-[#14532D] text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'table'
                  ? 'bg-[#14532D] text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              downloadCsv(
                `toland-b2b-leads-${new Date().toISOString().slice(0, 10)}.csv`,
                ['Name', 'Phone', 'Source', 'Stage', 'Deal Value', 'Next Follow-up', 'Created Date'],
                filteredLeads.map((l) => [
                  l.name,
                  l.phone,
                  l.source,
                  l.stage,
                  l.value,
                  l.next_followup_at ? new Date(l.next_followup_at).toLocaleDateString('en-IN') : '',
                  new Date(l.created_at).toLocaleDateString('en-IN'),
                ])
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#CFE0D5] text-gray-700 rounded-lg hover:border-[#14532D] hover:text-[#14532D] text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-sm font-medium transition shadow-sm w-fit"
          >
            <Plus className="w-4 h-4" />
            Add B2B Lead
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Pipeline</span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#14532D] mt-2">
            ₹{activePipelineValue.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-gray-500 mt-1 block">{activeLeads.length} active negotiations</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Won Revenue</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            ₹{convertedValue.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-emerald-600 mt-1 block">{convertedLeads.length} accounts closed</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Win Rate</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{winRate}%</p>
          <span className="text-xs text-amber-600 mt-1 block">Lead conversion ratio</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Factory Hub</span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <Contact className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-2">Sheikhpura Unit</p>
          <span className="text-xs text-gray-500 mt-1 block">Direct wholesale dispatch</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-[#CFE0D5] shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by company, buyer or phone..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-[#CFE0D5] bg-[#F0F7F2]/40 focus:outline-none focus:ring-1 focus:ring-[#14532D]"
          />
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {STAGES.map((col) => {
            const colLeads = filteredLeads.filter((l) => l.stage === col.key);
            const colValue = colLeads.reduce((sum, l) => sum + Number(l.value || 0), 0);

            return (
              <div
                key={col.key}
                className="bg-gray-50/70 rounded-xl border border-[#CFE0D5] p-3 flex flex-col min-w-[220px]"
              >
                {/* Column Header */}
                <div className="pb-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{col.label}</span>
                    <span className="text-[11px] font-bold bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-700">
                      {colLeads.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    ₹{colValue.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="mt-3 space-y-2.5 flex-1">
                  {colLeads.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-[11px] text-gray-400 italic">
                      No leads in stage
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white p-3 rounded-lg border border-[#CFE0D5] shadow-xs hover:shadow-sm transition space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">
                            {lead.name}
                          </h4>
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            disabled={deletingId === lead.id}
                            className="text-gray-300 hover:text-rose-600 transition p-0.5 shrink-0"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-gray-500">{lead.phone}</span>
                          <span className="font-bold text-[#14532D]">
                            ₹{Number(lead.value).toLocaleString('en-IN')}
                          </span>
                        </div>

                        {lead.next_followup_at && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                              Follow-up: {new Date(lead.next_followup_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        )}

                        {/* Quick action bar */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
                          <button
                            onClick={() => openWhatsAppModal(lead)}
                            className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                            title="Direct WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-1">
                            {lead.stage !== 'converted' && lead.stage !== 'lost' && (
                              <button
                                onClick={() => handleConvertToCustomer(lead)}
                                disabled={updatingId === lead.id}
                                className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 transition text-[10px] font-semibold flex items-center gap-0.5"
                                title="Convert to VIP Customer"
                              >
                                <Crown className="w-3 h-3 text-amber-600" />
                                Convert
                              </button>
                            )}

                            {lead.stage !== 'converted' && lead.stage !== 'lost' && (
                              <button
                                onClick={() => handleAdvanceStage(lead)}
                                disabled={updatingId === lead.id}
                                className="p-1 rounded bg-[#14532D] text-white hover:bg-[#14532D]/90 transition"
                                title="Advance Stage"
                              >
                                {updatingId === lead.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ArrowRight className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-[#CFE0D5] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0F7F2]/60 text-gray-600 font-semibold border-b border-[#CFE0D5]">
                <tr>
                  <th className="py-3 px-4">Lead / Buyer Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Pipeline Stage</th>
                  <th className="py-3 px-4">Est. Deal Value</th>
                  <th className="py-3 px-4">Next Follow-up</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => {
                  const stageObj = STAGES.find((s) => s.key === lead.stage);

                  return (
                    <tr key={lead.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{lead.name}</td>
                      <td className="py-3.5 px-4 font-mono text-gray-600">{lead.phone}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold border text-[11px] ${
                            stageObj?.color || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {stageObj?.label || lead.stage}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#14532D]">
                        ₹{Number(lead.value).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        {lead.next_followup_at
                          ? new Date(lead.next_followup_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'None'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openWhatsAppModal(lead)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                            title="Direct WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          {lead.stage !== 'converted' && lead.stage !== 'lost' && (
                            <button
                              onClick={() => handleConvertToCustomer(lead)}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                              title="Convert to VIP Customer"
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-rose-600 transition"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CFE0D5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
                  <Contact className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Add B2B Wholesale Lead</h3>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Buyer Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Metro Apparels Delhi (Gaurav Gupta)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +919877788899"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Value (₹)</label>
                  <input
                    type="number"
                    step="1000"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  >
                    <option value="new">1. New Inquiry</option>
                    <option value="contacted">2. Contacted</option>
                    <option value="sample_sent">3. Samples Sent</option>
                    <option value="negotiation">4. Negotiation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Acquisition Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                >
                  <option value="website_b2b">Website B2B Inquiry</option>
                  <option value="storefront">Storefront Inquiry</option>
                  <option value="whatsapp_inquiry">WhatsApp Inbound Message</option>
                  <option value="trade_show">Apparel Expo / Trade Show</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Next Follow-up Due Date
                </label>
                <input
                  type="date"
                  value={nextFollowup}
                  onChange={(e) => setNextFollowup(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
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
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK WHATSAPP MODAL */}
      {waModalOpen && waRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CFE0D5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">WhatsApp B2B Outreach</h3>
                  <p className="text-xs text-gray-500">To {waRecipient.name} ({waRecipient.phone})</p>
                </div>
              </div>
              <button
                onClick={() => setWaModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {waSuccess ? (
              <div className="my-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Send className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Message Sent!</h4>
                <p className="text-xs text-gray-500">Outreach dispatched to WhatsApp bridge.</p>
              </div>
            ) : (
              <form onSubmit={handleSendWhatsApp} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Outreach Message</label>
                  <textarea
                    rows={4}
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#CFE0D5]">
                  <button
                    type="button"
                    onClick={() => setWaModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={waSending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 text-xs font-medium transition disabled:opacity-50"
                  >
                    {waSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
