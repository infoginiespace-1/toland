'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  MessageSquare,
  Tag,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Edit,
  ExternalLink,
  Crown,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Loader2,
  X,
  Send,
  FileText,
} from 'lucide-react';

interface CustomerRecord {
  id: string;
  phone: string;
  name?: string | null;
  source: string;
  tags: string[];
  stage: 'lead' | 'prospect' | 'active_buyer' | 'dormant' | 'vip';
  notes?: string | null;
  opt_in_whatsapp: boolean;
  opted_out_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomersManagerProps {
  customers: CustomerRecord[];
}

export function CustomersManager({ customers }: CustomersManagerProps) {
  const router = useRouter();

  // Search & Filter
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  // Customer Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('storefront');
  const [stage, setStage] = useState<'lead' | 'prospect' | 'active_buyer' | 'dormant' | 'vip'>('lead');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [optInWhatsapp, setOptInWhatsapp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WhatsApp Quick Send Modal
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waRecipient, setWaRecipient] = useState<CustomerRecord | null>(null);
  const [waMessage, setWaMessage] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waSuccess, setWaSuccess] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);

  // KPIs
  const totalCustomers = customers.length;
  const vipCount = customers.filter((c) => c.stage === 'vip').length;
  const activeBuyerCount = customers.filter((c) => c.stage === 'active_buyer').length;
  const optedInCount = customers.filter((c) => c.opt_in_whatsapp).length;
  const optInPercentage = totalCustomers > 0 ? Math.round((optedInCount / totalCustomers) * 100) : 100;

  const openCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setSource('storefront');
    setStage('lead');
    setTagsInput('');
    setNotes('');
    setOptInWhatsapp(true);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (c: CustomerRecord) => {
    setEditingCustomer(c);
    setName(c.name || '');
    setPhone(c.phone);
    setSource(c.source);
    setStage(c.stage);
    setTagsInput((c.tags || []).join(', '));
    setNotes(c.notes || '');
    setOptInWhatsapp(c.opt_in_whatsapp);
    setError(null);
    setModalOpen(true);
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Customer phone number is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => Boolean(t));

      const isEdit = Boolean(editingCustomer);
      const url = '/api/admin/crm/customers';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = isEdit
        ? {
            id: editingCustomer!.id,
            name,
            stage,
            tags: parsedTags,
            notes,
            opt_in_whatsapp: optInWhatsapp,
          }
        : {
            phone,
            name,
            source,
            stage,
            tags: parsedTags,
            notes,
            opt_in_whatsapp: optInWhatsapp,
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save customer');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error saving customer');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsAppModal = (c: CustomerRecord) => {
    setWaRecipient(c);
    setWaMessage(
      `Namaste ${c.name || 'Valued Customer'}, thank you for choosing TOLAND Denim! How can our Sheikhpura factory assist you today?`
    );
    setWaSuccess(false);
    setWaError(null);
    setWaModalOpen(true);
  };

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waRecipient || !waMessage.trim()) return;

    try {
      setWaSending(true);
      setWaError(null);

      const res = await fetch('/api/admin/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: waRecipient.phone,
          message: waMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch WhatsApp message');

      setWaSuccess(true);
      setTimeout(() => {
        setWaModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setWaError(err?.message || 'Failed to send WhatsApp message');
    } finally {
      setWaSending(false);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    if (stageFilter !== 'all' && c.stage !== stageFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchPhone = c.phone.includes(q);
      const matchTag = c.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchPhone && !matchTag) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14532D]">Customer Profiles & Segmentation</h1>
          <p className="text-sm text-gray-600 mt-1">
            Directory of retail shoppers, boutique stockists, and wholesale distributors.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-sm font-medium transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Directory</span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#14532D] mt-2">{totalCustomers}</p>
          <span className="text-xs text-gray-500 mt-1 block">Registered profiles</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">VIP Denim Club</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{vipCount}</p>
          <span className="text-xs text-amber-600 mt-1 block">High LTV & repeat buyers</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Buyers</span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#228B22]">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{activeBuyerCount}</p>
          <span className="text-xs text-gray-500 mt-1 block">Recent purchase history</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">WhatsApp Opt-in</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{optInPercentage}%</p>
          <span className="text-xs text-emerald-600 mt-1 block">{optedInCount} reachable via Baileys</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-[#CFE0D5] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'vip', 'active_buyer', 'prospect', 'lead', 'dormant'].map((st) => (
            <button
              key={st}
              onClick={() => setStageFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                stageFilter === st
                  ? 'bg-[#14532D] text-white shadow-sm'
                  : 'bg-[#F0F7F2] text-gray-700 hover:bg-[#E3EFE7]'
              }`}
            >
              {st === 'all' ? 'All Customers' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, tags..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-[#CFE0D5] bg-[#F0F7F2]/40 focus:outline-none focus:ring-1 focus:ring-[#14532D]"
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-[#CFE0D5] shadow-sm overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No customers found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {search ? 'Try clearing your search filters.' : 'Add your first customer to begin tracking sales and WhatsApp engagement.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0F7F2]/60 text-gray-600 font-semibold border-b border-[#CFE0D5]">
                <tr>
                  <th className="py-3 px-4">Customer Name & Contact</th>
                  <th className="py-3 px-4">Lifecycle Stage</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4">WhatsApp Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => {
                  const stageStyles: Record<string, string> = {
                    vip: 'bg-amber-100 text-amber-800 border-amber-300',
                    active_buyer: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    prospect: 'bg-blue-100 text-blue-800 border-blue-300',
                    lead: 'bg-purple-100 text-purple-800 border-purple-300',
                    dormant: 'bg-gray-100 text-gray-700 border-gray-300',
                  };

                  return (
                    <tr key={customer.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F0F7F2] text-[#14532D] font-bold text-xs flex items-center justify-center shrink-0 border border-[#CFE0D5]">
                            {customer.name ? customer.name.slice(0, 2).toUpperCase() : 'CU'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                              <span>{customer.name || 'Unnamed Client'}</span>
                              {customer.stage === 'vip' && (
                                <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              )}
                            </div>
                            <span className="text-gray-500 font-mono text-[11px] block mt-0.5">
                              {customer.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold border text-[11px] capitalize ${
                            stageStyles[customer.stage] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {customer.stage.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 capitalize">
                        {customer.source.replace('_', ' ')}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {customer.tags && customer.tags.length > 0 ? (
                            customer.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-[#F0F7F2] text-gray-700 text-[10px] px-1.5 py-0.5 rounded border border-[#CFE0D5] font-mono"
                              >
                                #{tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-[11px]">No tags</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {customer.opt_in_whatsapp ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" /> Opted In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-medium text-[11px]">
                            <ShieldAlert className="w-3.5 h-3.5" /> Opted Out
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openWhatsAppModal(customer)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                            title="Direct WhatsApp Message"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                            title="Edit Profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CFE0D5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {editingCustomer ? 'Edit Customer Profile' : 'New Customer Profile'}
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

            <form onSubmit={handleCustomerSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Customer / Business Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma or Bihar Denim Mart"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp Phone Number *</label>
                <input
                  type="tel"
                  disabled={Boolean(editingCustomer)}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +919811122233"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D] disabled:bg-gray-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lifecycle Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  >
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospect</option>
                    <option value="active_buyer">Active Buyer</option>
                    <option value="vip">VIP Denim Club</option>
                    <option value="dormant">Dormant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Acquisition Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    disabled={Boolean(editingCustomer)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D] disabled:bg-gray-100"
                  >
                    <option value="storefront">Storefront Retail</option>
                    <option value="b2b_portal">B2B Wholesale Portal</option>
                    <option value="website_b2b">Website Inquiry</option>
                    <option value="referral">Referral / Trade Show</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. vip, selvedge, bihar_retailer, repeat"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Internal CRM Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Customer fit preferences, payment terms, delivery address details..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="optIn"
                  checked={optInWhatsapp}
                  onChange={(e) => setOptInWhatsapp(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CFE0D5] text-[#14532D] focus:ring-[#14532D]"
                />
                <label htmlFor="optIn" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Customer opted-in for WhatsApp order updates & brochures
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
                  {editingCustomer ? 'Update Profile' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP QUICK SEND MODAL */}
      {waModalOpen && waRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CFE0D5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Send WhatsApp Message</h3>
                  <p className="text-xs text-gray-500">To {waRecipient.name || 'Client'} ({waRecipient.phone})</p>
                </div>
              </div>
              <button
                onClick={() => setWaModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {waError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{waError}</span>
              </div>
            )}

            {waSuccess ? (
              <div className="my-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Send className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Message Dispatched!</h4>
                <p className="text-xs text-gray-500">Queued in WhatsApp Baileys Outbox.</p>
              </div>
            ) : (
              <form onSubmit={handleSendWhatsApp} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Message Content</label>
                  <textarea
                    rows={4}
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                    required
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Sent from connected TOLAND WhatsApp factory bridge.
                  </p>
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
                    Send WhatsApp
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
