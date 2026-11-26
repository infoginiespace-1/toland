'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Tag,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';

interface TemplateItem {
  id: string;
  key: string;
  name: string;
  body: string;
  variables: string[];
  category: 'otp' | 'transactional' | 'promo';
  is_active: boolean;
  created_at: string;
}

interface TemplatesManagerProps {
  templates: TemplateItem[];
}

export function TemplatesManager({ templates }: TemplatesManagerProps) {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [variablesInput, setVariablesInput] = useState('');
  const [category, setCategory] = useState<'otp' | 'transactional' | 'promo'>('transactional');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setKey('');
    setName('');
    setBodyText('');
    setVariablesInput('name, order_no');
    setCategory('transactional');
    setIsActive(true);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (t: TemplateItem) => {
    setEditingTemplate(t);
    setKey(t.key);
    setName(t.name);
    setBodyText(t.body);
    setVariablesInput((t.variables || []).join(', '));
    setCategory(t.category);
    setIsActive(t.is_active);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bodyText.trim() || (!editingTemplate && !key.trim())) {
      setError('Key, name, and message body are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const parsedVars = variablesInput
        .split(',')
        .map((v) => v.trim())
        .filter((v) => Boolean(v));

      const isEdit = Boolean(editingTemplate);
      const url = '/api/admin/whatsapp/templates';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = isEdit
        ? {
            id: editingTemplate!.id,
            name,
            body: bodyText,
            variables: parsedVars,
            category,
            is_active: isActive,
          }
        : {
            key,
            name,
            body: bodyText,
            variables: parsedVars,
            category,
            is_active: isActive,
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save template');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error saving template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/whatsapp/templates?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete template');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Error deleting template');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchKey = t.key.toLowerCase().includes(q);
      const matchBody = t.body.toLowerCase().includes(q);
      if (!matchName && !matchKey && !matchBody) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14532D]">WhatsApp Message Templates</h1>
          <p className="text-sm text-gray-600 mt-1">
            Pre-approved message layouts with dynamic variable placeholders for OTPs, orders, and campaigns.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-sm font-medium transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-[#CFE0D5] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['all', 'transactional', 'promo', 'otp'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                categoryFilter === cat
                  ? 'bg-[#14532D] text-white shadow-sm'
                  : 'bg-[#F0F7F2] text-gray-700 hover:bg-[#E3EFE7]'
              }`}
            >
              {cat === 'all' ? 'All Templates' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by key or text..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-[#CFE0D5] bg-[#F0F7F2]/40 focus:outline-none focus:ring-1 focus:ring-[#14532D]"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => {
          const categoryColors: Record<string, string> = {
            otp: 'bg-purple-100 text-purple-800 border-purple-200',
            transactional: 'bg-blue-100 text-blue-800 border-blue-200',
            promo: 'bg-amber-100 text-amber-800 border-amber-200',
          };

          return (
            <div
              key={template.id}
              className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm flex flex-col justify-between space-y-4 hover:border-[#14532D]/40 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{template.name}</h3>
                    <span className="font-mono text-xs text-[#14532D] font-bold">
                      #{template.key}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        categoryColors[template.category] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {template.category}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        template.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {template.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-[#F0F7F2]/50 rounded-lg border border-[#CFE0D5] text-xs font-mono text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {template.body}
                </div>

                {template.variables && template.variables.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-gray-500 font-medium">Placeholders:</span>
                    {template.variables.map((v, i) => (
                      <span
                        key={i}
                        className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[10px] text-gray-600"
                      >
                        {`{{${i + 1}}}`}: {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(template)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#CFE0D5] text-gray-700 hover:bg-[#F0F7F2] rounded-lg text-xs font-medium transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  disabled={deletingId === template.id}
                  className="p-1.5 text-gray-400 hover:text-rose-600 transition rounded-lg hover:bg-gray-50"
                  title="Delete Template"
                >
                  {deletingId === template.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#CFE0D5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {editingTemplate ? 'Edit Message Template' : 'New WhatsApp Template'}
                </h3>
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

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Template Key *</label>
                  <input
                    type="text"
                    disabled={Boolean(editingTemplate)}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g. order_shipped"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D] disabled:bg-gray-100 font-mono text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Display Title *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Order Shipped Notification"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                >
                  <option value="transactional">Transactional (Orders, Shipping, Receipts)</option>
                  <option value="promo">Promotional / Campaign (Launches, Discounts)</option>
                  <option value="otp">OTP / Security Code</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Message Text with Placeholders (e.g. &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125;) *
                </label>
                <textarea
                  rows={4}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Hello {{1}}, your TOLAND denim order #{{2}} of ₹{{3}} has been dispatched via {{4}}!"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D] font-mono text-xs leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Variable Names (comma separated)
                </label>
                <input
                  type="text"
                  value={variablesInput}
                  onChange={(e) => setVariablesInput(e.target.value)}
                  placeholder="e.g. customer_name, order_no, amount, tracking_url"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CFE0D5] text-[#14532D] focus:ring-[#14532D]"
                />
                <label htmlFor="isActive" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Template is active for automatic triggers and broadcast campaigns
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
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
