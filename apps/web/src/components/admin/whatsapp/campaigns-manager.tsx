'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Radio,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Users,
  Search,
  AlertTriangle,
  Loader2,
  X,
  FileSpreadsheet,
  Send,
} from 'lucide-react';

interface CampaignItem {
  id: string;
  name: string;
  template_key?: string | null;
  segment_filter: any;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'cancelled';
  scheduled_at?: string | null;
  created_at: string;
}

interface TemplateOption {
  key: string;
  name: string;
  category: string;
}

interface CampaignsManagerProps {
  campaigns: CampaignItem[];
  templates: TemplateOption[];
}

export function CampaignsManager({ campaigns, templates }: CampaignsManagerProps) {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [templateKey, setTemplateKey] = useState('');
  const [targetAudience, setTargetAudience] = useState('vip');
  const [scheduleTime, setScheduleTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const openCreateModal = () => {
    setName('');
    setTemplateKey(templates[0]?.key || '');
    setTargetAudience('vip');
    setScheduleTime('');
    setError(null);
    setModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !templateKey) {
      setError('Campaign name and template are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/whatsapp/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          template_key: templateKey,
          segment_filter: { audience: targetAudience },
          scheduled_at: scheduleTime ? new Date(scheduleTime).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create campaign');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error launching campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch('/api/admin/whatsapp/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Error updating campaign');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchTpl = c.template_key?.toLowerCase().includes(q);
      if (!matchName && !matchTpl) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14532D]">WhatsApp Broadcast Campaigns</h1>
          <p className="text-sm text-gray-600 mt-1">
            Bulk outreach engine for seasonal product drops, festive booking drives, and VIP customer retention.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-sm font-medium transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          Launch Campaign
        </button>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.map((camp) => {
          const statusColors: Record<string, string> = {
            running: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
            completed: 'bg-gray-100 text-gray-800 border-gray-300',
            paused: 'bg-amber-100 text-amber-800 border-amber-300',
          };

          const audienceLabel = camp.segment_filter?.audience === 'all'
            ? 'All Opted-In Customers'
            : camp.segment_filter?.audience === 'vip'
            ? 'VIP Denim Club Only'
            : camp.segment_filter?.audience === 'wholesale'
            ? 'Wholesale Distributors & Stockists'
            : 'Custom Segment';

          return (
            <div
              key={camp.id}
              className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">{camp.name}</h3>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${
                      statusColors[camp.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {camp.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span className="flex items-center gap-1 text-gray-700 font-medium">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    Target: {audienceLabel}
                  </span>
                  {camp.template_key && (
                    <span className="flex items-center gap-1 font-mono text-[#14532D]">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      #{camp.template_key}
                    </span>
                  )}
                  {camp.scheduled_at && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(camp.scheduled_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {camp.status === 'running' && (
                  <button
                    onClick={() => handleUpdateStatus(camp.id, 'paused')}
                    disabled={updatingId === camp.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold transition"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </button>
                )}

                {camp.status === 'paused' && (
                  <button
                    onClick={() => handleUpdateStatus(camp.id, 'running')}
                    disabled={updatingId === camp.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Resume
                  </button>
                )}

                {camp.status === 'scheduled' && (
                  <button
                    onClick={() => handleUpdateStatus(camp.id, 'running')}
                    disabled={updatingId === camp.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#14532D] text-white hover:bg-[#14532D]/90 text-xs font-semibold transition shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Broadcast Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LAUNCH CAMPAIGN MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CFE0D5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
                  <Radio className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Launch Broadcast Campaign</h3>
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

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Campaign Title *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Winter Selvedge Denim Launch 2026"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                >
                  <option value="vip">VIP Denim Club Members</option>
                  <option value="wholesale">Wholesale Distributors & Stockists</option>
                  <option value="all">All Opted-in WhatsApp Customers</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Approved Message Template *</label>
                <select
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                >
                  {templates.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name} (#{t.key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Schedule Broadcast Time (Leave blank for immediate dispatch)
                </label>
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
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
                  Confirm Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
