'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Plus,
  Search,
  Printer,
  Truck,
  IndianRupee,
  X,
  Loader2,
  Trash2,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  base_price: number;
}

interface Variant {
  id: string;
  product_id: string;
  size: string;
  sku: string;
  price: number;
  stock_qty: number;
}

interface B2bTier {
  id: string;
  product_id: string;
  min_qty: number;
  price: number;
}

interface WholesaleOrder {
  id: string;
  quote_no: string;
  buyer_name: string;
  buyer_company: string | null;
  buyer_phone: string;
  buyer_gst: string | null;
  buyer_address: string | null;
  items: Array<{
    product_id: string;
    product_name: string;
    variant_id: string | null;
    size: string;
    sku: string;
    qty: number;
    unit_price: number;
    tier_applied?: string | null;
    line_total: number;
  }>;
  subtotal: number;
  gst_percent: number;
  gst_amount: number;
  total_amount: number;
  paid_amount: number;
  credit_limit: number;
  payment_terms: string;
  payment_status: string;
  status: string;
  stock_deducted: boolean;
  notes: string | null;
  created_at: string;
}

export function WholesaleManager({
  orders,
  products,
  variants,
  b2bTiers,
}: {
  orders: WholesaleOrder[];
  products: Product[];
  variants: Variant[];
  b2bTiers: B2bTier[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerGst, setBuyerGst] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 15 Days');
  const [gstPercent, setGstPercent] = useState('12');

  const firstProd = products[0];
  const firstVar = variants.find((v) => v.product_id === firstProd?.id);
  const [lineItems, setLineItems] = useState<
    Array<{ product_id: string; variant_id: string; qty: string; unit_price: string }>
  >([
    {
      product_id: firstProd?.id || '',
      variant_id: firstVar?.id || '',
      qty: '50',
      unit_price: String(firstProd?.base_price || 0),
    },
  ]);

  const [payOrder, setPayOrder] = useState<WholesaleOrder | null>(null);
  const [paidInput, setPaidInput] = useState('');
  const [printOrder, setPrintOrder] = useState<WholesaleOrder | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveTierPrice = (prodId: string, qtyNum: number) => {
    const matching = b2bTiers
      .filter((t) => t.product_id === prodId && qtyNum >= Number(t.min_qty))
      .sort((a, b) => Number(b.min_qty) - Number(a.min_qty));
    if (matching.length > 0) {
      return { price: Number(matching[0].price), tierLabel: `MOQ ${matching[0].min_qty}+` };
    }
    const p = products.find((x) => x.id === prodId);
    return { price: Number(p?.base_price || 0), tierLabel: null };
  };

  const addLine = () => {
    const p = products[0];
    const v = variants.find((x) => x.product_id === p?.id);
    const { price } = resolveTierPrice(p?.id || '', 50);
    setLineItems((prev) => [
      ...prev,
      {
        product_id: p?.id || '',
        variant_id: v?.id || '',
        qty: '50',
        unit_price: String(price),
      },
    ]);
  };

  const updateLine = (idx: number, field: string, value: string) => {
    setLineItems((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const next = { ...row, [field]: value };
        if (field === 'product_id') {
          const v = variants.find((x) => x.product_id === value);
          next.variant_id = v?.id || '';
          next.unit_price = String(resolveTierPrice(value, Number(next.qty || 1)).price);
        } else if (field === 'qty') {
          next.unit_price = String(resolveTierPrice(next.product_id, Number(value || 1)).price);
        }
        return next;
      })
    );
  };

  const formSubtotal = lineItems.reduce(
    (s, r) => s + Number(r.qty || 0) * Number(r.unit_price || 0),
    0
  );
  const formGst = (formSubtotal * Number(gstPercent || 0)) / 100;
  const formTotal = formSubtotal + formGst;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payloadItems = lineItems.map((r) => {
        const p = products.find((x) => x.id === r.product_id);
        const v = variants.find((x) => x.id === r.variant_id);
        const tier = resolveTierPrice(r.product_id, Number(r.qty || 1)).tierLabel;
        return {
          product_id: r.product_id,
          product_name: p?.name || 'Denim Style',
          variant_id: r.variant_id || null,
          size: v?.size || 'Assorted',
          sku: v?.sku || '',
          qty: Number(r.qty || 1),
          unit_price: Number(r.unit_price || 0),
          tier_applied: tier,
        };
      });

      const res = await fetch('/api/admin/erp/wholesale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_name: buyerName,
          buyer_company: buyerCompany,
          buyer_phone: buyerPhone,
          buyer_gst: buyerGst,
          buyer_address: buyerAddress,
          payment_terms: paymentTerms,
          gst_percent: Number(gstPercent || 12),
          items: payloadItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create B2B order');
      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error saving quote');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (order: WholesaleOrder, nextStatus: string) => {
    const confirmMsg =
      nextStatus === 'dispatched'
        ? `Mark ${order.quote_no} Dispatched? Finished SKU inventory will be deducted automatically.`
        : `Update ${order.quote_no} status to ${nextStatus}?`;
    if (!confirm(confirmMsg)) return;

    const res = await fetch('/api/admin/erp/wholesale', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: order.id, status: nextStatus }),
    });
    if (res.ok) router.refresh();
    else {
      const d = await res.json();
      alert(d.error || 'Failed to update status');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payOrder) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/erp/wholesale', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payOrder.id,
          action: 'update_payment',
          paid_amount: Number(paidInput || 0),
        }),
      });
      if (!res.ok) throw new Error('Payment update failed');
      setPayOrder(null);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const totalBilled = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const totalCollected = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + Number(o.paid_amount || 0), 0);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      o.quote_no.toLowerCase().includes(q) ||
      o.buyer_name.toLowerCase().includes(q) ||
      (o.buyer_company || '').toLowerCase().includes(q) ||
      o.buyer_phone.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Receipt className="w-4 h-4" />
            <span>Wholesale Distribution, GST Proforma & Credit Khata</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">
            B2B Quotes & Khata ({orders.length})
          </h1>
          <p className="text-xs text-muted">
            Build MOQ tier proforma quotes, dispatch stock with ledger sync & track dealer credit collections.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New B2B Quote</span>
        </button>
      </div>

      {/* Khata Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5]">
          <span className="text-3xs font-bold uppercase text-muted block">Total Wholesale Billed</span>
          <p className="text-2xl font-black text-primary mt-1 font-mono">
            ₹{totalBilled.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5]">
          <span className="text-3xs font-bold uppercase text-muted block">Collected Payments</span>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            ₹{totalCollected.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5]">
          <span className="text-3xs font-bold uppercase text-muted block">Pending Udhar / Due</span>
          <p className="text-2xl font-black text-rose-600 mt-1 font-mono">
            ₹{Math.max(0, totalBilled - totalCollected).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5]">
          <span className="text-3xs font-bold uppercase text-muted block">Dispatched Orders</span>
          <p className="text-2xl font-black text-text mt-1">
            {orders.filter((o) => o.status === 'dispatched').length}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Quote #, Buyer, Shop or Phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {['all', 'quote', 'confirmed', 'dispatched', 'cancelled'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize ${
                statusFilter === s ? 'bg-primary text-white' : 'bg-[#F0F7F2] text-muted'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#CFE0D5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase tracking-wider">
                <th className="py-3 px-4">Quote / Order #</th>
                <th className="py-3 px-3">Wholesale Buyer</th>
                <th className="py-3 px-3">Line Summary</th>
                <th className="py-3 px-3">Total (Incl. GST)</th>
                <th className="py-3 px-3">Khata Balance</th>
                <th className="py-3 px-3">Stage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CFE0D5]">
              {filtered.length > 0 ? (
                filtered.map((o) => {
                  const due = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));
                  return (
                    <tr key={o.id} className="hover:bg-[#F0F7F2]/40">
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-primary block">{o.quote_no}</span>
                        <span className="text-3xs text-muted">{o.payment_terms}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-text block">
                          {o.buyer_company || o.buyer_name}
                        </span>
                        <span className="text-3xs text-muted font-mono">
                          {o.buyer_name} · {o.buyer_phone}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {(o.items || []).map((it, idx) => (
                          <span key={idx} className="block text-3xs text-muted">
                            • {it.product_name} (Sz {it.size}) x <strong>{it.qty}</strong> @₹
                            {it.unit_price}
                          </span>
                        ))}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-text">
                        ₹{Number(o.total_amount).toLocaleString('en-IN')}
                        <span className="block text-3xs font-normal text-muted">
                          GST {o.gst_percent}% (₹{Number(o.gst_amount).toLocaleString('en-IN')})
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => {
                            setPayOrder(o);
                            setPaidInput(String(o.paid_amount || 0));
                          }}
                          className="text-left group"
                        >
                          <span
                            className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase ${
                              o.payment_status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.payment_status === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {o.payment_status}
                          </span>
                          <span className="block text-3xs font-mono text-muted mt-1 group-hover:text-primary">
                            Due: ₹{due.toLocaleString('en-IN')}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-3xs font-bold uppercase bg-slate-100 text-slate-800">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPrintOrder(o)}
                            className="p-1.5 rounded-lg border border-[#CFE0D5] hover:border-primary"
                            title="Print GST Proforma"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {o.status === 'quote' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(o, 'confirmed')}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-3xs font-bold"
                            >
                              Confirm
                            </button>
                          )}
                          {(o.status === 'quote' || o.status === 'confirmed') && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(o, 'dispatched')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14532D] text-white text-3xs font-bold"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted text-xs">
                    No wholesale quotes or B2B khata orders created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quote Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-4 z-10 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
              <h2 className="text-base font-black text-text">Create B2B Proforma Quote</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && <div className="p-2 rounded bg-danger/10 text-danger text-xs">{error}</div>}
            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Buyer Contact Name *"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#CFE0D5]"
                />
                <input
                  type="text"
                  placeholder="Shop / Firm Name"
                  value={buyerCompany}
                  onChange={(e) => setBuyerCompany(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#CFE0D5]"
                />
                <input
                  type="text"
                  required
                  placeholder="Phone Number *"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#CFE0D5] font-mono"
                />
                <input
                  type="text"
                  placeholder="Buyer GSTIN (Optional)"
                  value={buyerGst}
                  onChange={(e) => setBuyerGst(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#CFE0D5] font-mono uppercase"
                />
              </div>
              <input
                type="text"
                placeholder="Billing / Delivery Market Address"
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5]"
              />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase text-3xs">
                    Wholesale Items (Auto-applies B2B MOQ Tier Price)
                  </span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-primary font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Style
                  </button>
                </div>
                {lineItems.map((row, idx) => {
                  const prodVars = variants.filter((v) => v.product_id === row.product_id);
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <select
                        value={row.product_id}
                        onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                        className="sm:col-span-5 px-2 py-1.5 rounded-lg border bg-white text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={row.variant_id}
                        onChange={(e) => updateLine(idx, 'variant_id', e.target.value)}
                        className="sm:col-span-3 px-2 py-1.5 rounded-lg border bg-white text-xs"
                      >
                        {prodVars.map((v) => (
                          <option key={v.id} value={v.id}>
                            Sz {v.size} (Stk:{v.stock_qty})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={row.qty}
                        onChange={(e) => updateLine(idx, 'qty', e.target.value)}
                        className="sm:col-span-2 px-2 py-1.5 rounded-lg border bg-white font-mono font-bold"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.unit_price}
                        onChange={(e) => updateLine(idx, 'unit_price', e.target.value)}
                        className="sm:col-span-2 px-2 py-1.5 rounded-lg border bg-white font-mono font-bold"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">GST (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Credit / Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5]"
                  >
                    <option value="Advance 100%">Advance 100%</option>
                    <option value="50% Advance / 50% Dispatch">50% Advance / 50% Dispatch</option>
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 30 Days">Net 30 Days</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#E3EFE7] flex justify-between items-center font-bold text-primary">
                <span>Proforma Total (Sub ₹{formSubtotal.toFixed(0)} + GST ₹{formGst.toFixed(0)}):</span>
                <span className="font-mono text-base font-black">₹{formTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#CFE0D5]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#CFE0D5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold"
                >
                  {loading ? 'Saving...' : 'Create Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setPayOrder(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-4 z-10">
            <h2 className="text-base font-black">Update Khata Payment ({payOrder.quote_no})</h2>
            <form onSubmit={handlePaymentSubmit} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F0F7F2] flex justify-between font-bold">
                <span>Invoice Total:</span>
                <span className="font-mono">₹{Number(payOrder.total_amount).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <label className="block font-bold mb-1">Cumulative Paid Received (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidInput}
                  onChange={(e) => setPaidInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] font-mono font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayOrder(null)}
                  className="px-4 py-2 rounded-xl border border-[#CFE0D5]"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-white font-bold">
                  Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Proforma Invoice */}
      {printOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto print:bg-white print:p-0">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-5 print:shadow-none print:max-w-full">
            <div className="flex justify-between items-center pb-3 border-b print:hidden">
              <span className="text-xs font-bold uppercase text-slate-600">B2B Proforma Invoice</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#14532D] text-white text-xs font-bold"
                >
                  Print / Save PDF
                </button>
                <button type="button" onClick={() => setPrintOrder(null)} className="p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-black">TOLAND PRIVATE LIMITED</h2>
                <p className="text-xs text-slate-600">
                  Sheikhpura, Barbigha, Khetalpura 811101, Bihar &middot; Wholesale Desk
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-500">PROFORMA INVOICE</span>
                <div className="font-mono font-black text-lg text-[#14532D]">
                  {printOrder.quote_no}
                </div>
                <div className="text-xs text-slate-500">{printOrder.payment_terms}</div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border text-xs">
              <p className="font-bold text-sm">{printOrder.buyer_company || printOrder.buyer_name}</p>
              <p>Contact: {printOrder.buyer_name} ({printOrder.buyer_phone})</p>
              {printOrder.buyer_gst && <p className="font-mono">GSTIN: {printOrder.buyer_gst}</p>}
              {printOrder.buyer_address && <p>{printOrder.buyer_address}</p>}
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 uppercase text-[10px]">
                  <th className="py-2">Style & Size</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Rate</th>
                  <th className="py-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {printOrder.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 font-semibold">
                      {it.product_name} (Size {it.size})
                    </td>
                    <td className="py-2 text-right font-mono">{it.qty}</td>
                    <td className="py-2 text-right font-mono">₹{it.unit_price}</td>
                    <td className="py-2 text-right font-mono font-bold">₹{it.line_total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2 text-right font-semibold">
                    Subtotal + GST ({printOrder.gst_percent}%):
                  </td>
                  <td className="py-2 text-right font-mono font-black text-base text-[#14532D]">
                    ₹{Number(printOrder.total_amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
