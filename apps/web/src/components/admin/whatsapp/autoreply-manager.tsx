'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  MessageSquare,
  FileSpreadsheet,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';

interface AutoReplyRule {
  id: string;
  keyword: string;
  match_type: 'exact' | 'contains' | 'regex';
  reply_template_key?: string | null;
  is_active: boolean;
  created_at: string;
}

interface TemplateOption {
  key: string;
  name: string;
}

interface AutoReplyManagerProps {
  rules: AutoReplyRule[];
  templates: TemplateOption[];
}

export function AutoReplyManager({ rules, templates }: AutoReplyManagerProps) {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [matchType, setMatchType] = useState<'exact' | 'contains' | 'regex'>('exact');
  const [templateKey, setTemplateKey] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const openCreateModal = () => {
    setKeyword('');
    setMatchType('exact');
    setTemplateKey(templates[0]?.key || '');
    setIsActive(true);
    setError(null);
    setModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      setError('Keyword trigger is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/whatsapp/auto-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          match_type: matchType,
          reply_template_key: templateKey || null,
          is_active: isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create rule');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error creating rule');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (rule: AutoReplyRule) => {
    try {
      setTogglingId(rule.id);
      const res = await fetch('/api/admin/whatsapp/auto-replies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, is_active: !rule.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update rule');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Error toggling rule');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this auto-reply rule?')) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/whatsapp/auto-replies?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete rule');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Error deleting rule');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRules = rules.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      const matchKey = r.keyword.toLowerCase().includes(q);
      const matchTpl = r.reply_template_key?.toLowerCase().includes(q);
      if (!matchKey && !matchTpl) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14532D]">WhatsApp Auto-Reply Bot Rules</h1>
          <p className="text-sm text-gray-600 mt-1">
            Instant 24/7 conversational bot responses for catalogs, rate inquiries, swatch samples, and order tracking.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-sm font-medium transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          Add Bot Rule
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-[#CFE0D5] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#CFE0D5] flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keyword trigger..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-[#CFE0D5] bg-[#F0F7F2]/40 focus:outline-none focus:ring-1 focus:ring-[#14532D]"
            />
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {filteredRules.length} Active Bot Triggers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F0F7F2]/60 text-gray-600 font-semibold border-b border-[#CFE0D5]">
              <tr>
                <th className="py-3 px-4">Keyword Trigger</th>
                <th className="py-3 px-4">Matching Logic</th>
                <th className="py-3 px-4">Automated Response Template</th>
                <th className="py-3 px-4">Bot Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRules.map((rule) => {
                const matchColors: Record<string, string> = {
                  exact: 'bg-emerald-100 text-emerald-800',
                  contains: 'bg-blue-100 text-blue-800',
                  regex: 'bg-purple-100 text-purple-800',
                };

                return (
                  <tr key={rule.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 text-xs">
                      &quot;{rule.keyword}&quot;
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          matchColors[rule.match_type] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {rule.match_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {rule.reply_template_key ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[#14532D] text-xs font-bold">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          #{rule.reply_template_key}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Default greeting</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(rule)}
                        disabled={togglingId === rule.id}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold transition ${
                          rule.is_active ? 'text-emerald-700 hover:text-emerald-800' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {togglingId === rule.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : rule.is_active ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {rule.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        disabled={deletingId === rule.id}
                        className="p-1.5 text-gray-400 hover:text-rose-600 transition rounded-lg hover:bg-gray-50"
                        title="Delete Rule"
                      >
                        {deletingId === rule.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE RULE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CFE0D5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Add Auto-Reply Bot Rule</h3>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Trigger Keyword / Phrase *
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. CATALOG, PRICE, SAMPLE, TRACK"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Match Type</label>
                <select
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                >
                  <option value="exact">Exact Match (Message equals keyword)</option>
                  <option value="contains">Contains (Keyword appears anywhere in message)</option>
                  <option value="regex">Regular Expression</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Response Template</label>
                <select
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                >
                  <option value="">Default Friendly Greeting</option>
                  {templates.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name} (#{t.key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeRule"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CFE0D5] text-[#14532D] focus:ring-[#14532D]"
                />
                <label htmlFor="activeRule" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Rule is active and will respond automatically
                </label>
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
                  Save Bot Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
