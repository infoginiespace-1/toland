'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  Truck,
  X,
  Loader2,
  AlertTriangle,
  PackageCheck,
  Printer,
  IndianRupee,
  Ban,
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  gst_number?: string;
  phone?: string;
}

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  unit_price: number;
  type?: string;
}

interface POItem {
  id: string;
  raw_material_id: string;
  qty: number;
  received_qty?: number;
  unit_price: number;
  total: number;
  raw_material?: RawMaterial;
}

interface PurchaseOrder {
  id: string;
  po_no: string;
  supplier_id: string;
  status: string;
  total_amount: number;
  gst_amount?: number;
  supplier_invoice_no?: string | null;
  payment_status?: string;
  paid_amount?: number;
  expected_date?: string | null;
  notes?: string | null;
  created_at: string;
  supplier?: Supplier;
  items?: POItem[];
}

export function PurchaseOrdersManager({
  purchaseOrders,
  suppliers,
  rawMaterials,
  initialMaterialId,
}: {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  rawMaterials: RawMaterial[];
  initialMaterialId?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [gstAmount, setGstAmount] = useState('0');
  const [expectedDate, setExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [orderItems, setOrderItems] = useState<
    Array<{ raw_material_id: string; qty: string; unit_price: string }>
  >([
    {
      raw_material_id: initialMaterialId || rawMaterials[0]?.id || '',
      qty: '500',
      unit_price: String(
        rawMaterials.find((m) => m.id === (initialMaterialId || rawMaterials[0]?.id))?.unit_price ||
          0
      ),
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printPo, setPrintPo] = useState<PurchaseOrder | null>(null);

  // Partial / Full GRN Modal State
  const [grnPo, setGrnPo] = useState<PurchaseOrder | null>(null);
  const [grnQtyMap, setGrnQtyMap] = useState<Record<string, string>>({});
  const [grnInvoiceNo, setGrnInvoiceNo] = useState('');
  const [grnLoading, setGrnLoading] = useState(false);
  const [grnError, setGrnError] = useState<string | null>(null);

  // Payment Tracking Modal State
  const [payPo, setPayPo] = useState<PurchaseOrder | null>(null);
  const [paidInput, setPaidInput] = useState('');
  const [payInvoiceInput, setPayInvoiceInput] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    if (initialMaterialId) {
      setModalOpen(true);
    }
  }, [initialMaterialId]);

  const addLineItem = () => {
    const defaultMat = rawMaterials[0];
    setOrderItems((prev) => [
      ...prev,
      {
        raw_material_id: defaultMat?.id || '',
        qty: '100',
        unit_price: String(defaultMat?.unit_price || 0),
      },
    ]);
  };

  const removeLineItem = (idx: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLineItem = (idx: number, field: string, value: string) => {
    setOrderItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        if (field === 'raw_material_id') {
          const mat = rawMaterials.find((m) => m.id === value);
          if (mat) updated.unit_price = String(mat.unit_price || 0);
        }
        return updated;
      })
    );
  };

  const calculateSubtotal = () => {
    return orderItems.reduce(
      (sum, item) => sum + Number(item.qty || 0) * Number(item.unit_price || 0),
      0
    );
  };

  const calculateFormTotal = () => calculateSubtotal() + Number(gstAmount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        supplier_id: supplierId,
        status: 'ordered',
        gst_amount: Number(gstAmount || 0),
        expected_date: expectedDate || null,
        notes: poNotes.trim() || null,
        items: orderItems.map((it) => ({
          raw_material_id: it.raw_material_id,
          qty: Number(it.qty),
          unit_price: Number(it.unit_price),
        })),
      };

      const res = await fetch('/api/admin/erp/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Purchase Order');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error creating PO');
    } finally {
      setLoading(false);
    }
  };

  const openGrnModal = (po: PurchaseOrder) => {
    const initialMap: Record<string, string> = {};
    (po.items || []).forEach((it) => {
      const remaining = Math.max(0, Number(it.qty || 0) - Number(it.received_qty || 0));
      initialMap[it.id] = remaining > 0 ? String(remaining) : '0';
    });
    setGrnQtyMap(initialMap);
    setGrnInvoiceNo(po.supplier_invoice_no || '');
    setGrnError(null);
    setGrnPo(po);
  };

  const handleGrnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnPo) return;
    setGrnLoading(true);
    setGrnError(null);

    try {
      const receiveItems = (grnPo.items || []).map((it) => ({
        id: it.id,
        receive_qty: Number(grnQtyMap[it.id] || 0),
      }));

      const res = await fetch('/api/admin/erp/purchase-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: grnPo.id,
          action: 'receive_grn',
          supplier_invoice_no: grnInvoiceNo.trim() || null,
          receive_items: receiveItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to receive goods');

      setGrnPo(null);
      router.refresh();
    } catch (err: any) {
      setGrnError(err?.message || 'GRN Error');
    } finally {
      setGrnLoading(false);
    }
  };

  const openPaymentModal = (po: PurchaseOrder) => {
    setPayPo(po);
    setPaidInput(String(po.paid_amount ?? po.total_amount ?? 0));
    setPayInvoiceInput(po.supplier_invoice_no || '');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payPo) return;
    setPayLoading(true);
    try {
      const res = await fetch('/api/admin/erp/purchase-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payPo.id,
          action: 'update_payment',
          paid_amount: Number(paidInput || 0),
          supplier_invoice_no: payInvoiceInput.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update payment');
      setPayPo(null);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Payment update error');
    } finally {
      setPayLoading(false);
    }
  };

  const handleCancelPo = async (po: PurchaseOrder) => {
    if (!confirm(`Cancel Purchase Order ${po.po_no}?`)) return;
    try {
      const res = await fetch('/api/admin/erp/purchase-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: po.id, action: 'cancel' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel PO');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Cancel failed');
    }
  };

  const filtered = purchaseOrders.filter((po) => {
    const q = search.toLowerCase();
    const matchesSearch =
      po.po_no.toLowerCase().includes(q) ||
      (po.supplier?.name && po.supplier.name.toLowerCase().includes(q)) ||
      (po.supplier_invoice_no && po.supplier_invoice_no.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <ClipboardList className="w-4 h-4" />
            <span>Procurement, Partial GRN & Supplier Khata</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">
            Purchase Orders ({purchaseOrders.length})
          </h1>
          <p className="text-xs text-muted">
            Order raw fabrics and trims from mills; log partial or full GRN receipts, GST bills & payments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO #, Mill name, or Supplier Invoice #..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs text-text focus:outline-none focus:border-primary font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'ordered', label: 'Ordered' },
            { key: 'partial', label: 'Partial GRN' },
            { key: 'received', label: 'Received' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-[#F0F7F2] text-muted hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase tracking-wider">
                <th className="py-3 px-4">PO / Invoice</th>
                <th className="py-3 px-3">Supplier / Mill</th>
                <th className="py-3 px-3">Line Items (Rec / Ord)</th>
                <th className="py-3 px-3">Total & GST</th>
                <th className="py-3 px-3">Payment Status</th>
                <th className="py-3 px-3">GRN Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CFE0D5]">
              {filtered.length > 0 ? (
                filtered.map((po) => {
                  const isReceived = po.status === 'received';
                  const isPartial = po.status === 'partial';
                  const isOrdered = po.status === 'ordered' || po.status === 'draft';
                  const isCancelled = po.status === 'cancelled';
                  const anyReceived = (po.items || []).some(
                    (it) => Number(it.received_qty || 0) > 0
                  );
                  const totalVal = Number(po.total_amount || 0);
                  const paidVal = Number(po.paid_amount || 0);

                  return (
                    <tr key={po.id} className="hover:bg-[#F0F7F2]/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-primary block">{po.po_no}</span>
                        <span className="text-3xs text-muted block">
                          {new Date(po.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {po.supplier_invoice_no && (
                          <span className="text-3xs font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                            Inv: {po.supplier_invoice_no}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-text block">
                          {po.supplier?.name || 'Unknown Supplier'}
                        </span>
                        {po.supplier?.gst_number && (
                          <span className="text-3xs font-mono text-muted">
                            GST: {po.supplier.gst_number}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-muted">
                        <div className="space-y-0.5">
                          {po.items?.map((it, idx) => (
                            <span key={idx} className="block text-3xs">
                              • {it.raw_material?.name}:{' '}
                              <strong className="text-text font-mono">
                                {Number(it.received_qty || 0).toLocaleString('en-IN')}/
                                {Number(it.qty).toLocaleString('en-IN')}
                              </strong>{' '}
                              {it.raw_material?.unit}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono font-black text-text block">
                          ₹{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        {Number(po.gst_amount || 0) > 0 && (
                          <span className="text-3xs font-mono text-muted">
                            Incl. GST ₹{Number(po.gst_amount).toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => openPaymentModal(po)}
                          className="text-left group cursor-pointer"
                          title="Update supplier bill payment"
                        >
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold capitalize border ${
                              po.payment_status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : po.payment_status === 'partial'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {po.payment_status || 'unpaid'}
                          </span>
                          <span className="block text-3xs font-mono text-muted mt-1 group-hover:text-primary">
                            Paid ₹{paidVal.toLocaleString('en-IN')}
                          </span>
                        </button>
                      </td>

                      <td className="py-3.5 px-3">
                        {isReceived ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-success/15 text-success border border-success/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Stock Received
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Truck className="w-3 h-3" />
                            Partial GRN
                          </span>
                        ) : isOrdered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-primary/15 text-primary border border-primary/25">
                            <Truck className="w-3 h-3" />
                            In Transit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-muted/15 text-muted border border-border capitalize">
                            {po.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setPrintPo(po)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#CFE0D5] bg-white text-text text-3xs font-bold hover:border-primary hover:text-primary transition-colors cursor-pointer"
                            title="Print or Save Purchase Order PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>

                          {!isReceived && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => openGrnModal(po)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success text-white text-3xs font-bold hover:bg-success/90 shadow-2xs transition-colors cursor-pointer"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Receive GRN</span>
                            </button>
                          )}

                          {!anyReceived && !isReceived && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleCancelPo(po)}
                              className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Cancel Purchase Order"
                            >
                              <Ban className="w-3.5 h-3.5" />
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
                    No purchase orders found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => !loading && setModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-5 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
              <h2 className="text-base font-black text-text">Create Raw Material Purchase Order</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={loading}
                className="text-muted hover:text-text p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Select Mill / Vendor *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-text font-medium focus:outline-none focus:border-primary"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-text font-medium"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text uppercase tracking-wider text-3xs">
                    Order Line Items ({orderItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="inline-flex items-center gap-1 text-primary hover:text-accent font-bold text-3xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {orderItems.map((item, idx) => {
                    const mat = rawMaterials.find((m) => m.id === item.raw_material_id);

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      >
                        <div className="sm:col-span-6">
                          <label className="block text-3xs text-muted mb-0.5">Raw Material</label>
                          <select
                            value={item.raw_material_id}
                            onChange={(e) => updateLineItem(idx, 'raw_material_id', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#CFE0D5] bg-white text-xs font-medium"
                          >
                            {rawMaterials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-3xs text-muted mb-0.5">
                            Quantity ({mat?.unit || 'Units'})
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="0.001"
                            value={item.qty}
                            onChange={(e) => updateLineItem(idx, 'qty', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#CFE0D5] bg-white font-mono font-bold text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-3xs text-muted mb-0.5">Rate (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateLineItem(idx, 'unit_price', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#CFE0D5] bg-white font-mono text-xs"
                          />
                        </div>

                        <div className="sm:col-span-1 text-right pt-4 sm:pt-0">
                          {orderItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLineItem(idx)}
                              className="p-1.5 rounded-lg text-danger hover:bg-danger/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Mill GST / Freight Tax (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={gstAmount}
                    onChange={(e) => setGstAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Freight / PO Notes
                  </label>
                  <input
                    type="text"
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    placeholder="e.g. Transport by VRL Logistics to Barbigha"
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#E3EFE7] border border-[#CFE0D5] flex items-center justify-between text-xs">
                <span className="font-bold text-primary">Total Payable PO Value (Incl. GST):</span>
                <span className="font-mono font-black text-base text-primary">
                  ₹{calculateFormTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#CFE0D5]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl border border-[#CFE0D5] font-bold text-muted hover:text-text hover:bg-[#F0F7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Issue Purchase Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partial / Full GRN Receive Modal */}
      {grnPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => !grnLoading && setGrnPo(null)}
          />
          <div className="relative bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-4 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
              <div>
                <span className="font-mono text-xs font-bold text-primary">{grnPo.po_no}</span>
                <h2 className="text-base font-black text-text">Goods Receipt Note (Partial / Full GRN)</h2>
              </div>
              <button
                type="button"
                onClick={() => setGrnPo(null)}
                disabled={grnLoading}
                className="text-muted hover:text-text p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {grnError && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold">
                {grnError}
              </div>
            )}

            <form onSubmit={handleGrnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Supplier Mill Tax Invoice / Challan No.
                </label>
                <input
                  type="text"
                  value={grnInvoiceNo}
                  onChange={(e) => setGrnInvoiceNo(e.target.value)}
                  placeholder="e.g. INV/2026-27/412"
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono font-bold"
                />
              </div>

              <div className="space-y-2">
                <span className="font-bold text-text uppercase tracking-wider text-3xs block">
                  Enter Quantity Received Today (Supports Partial Split Deliveries)
                </span>
                {(grnPo.items || []).map((it) => {
                  const ordered = Number(it.qty || 0);
                  const already = Number(it.received_qty || 0);
                  const remaining = Math.max(0, ordered - already);
                  return (
                    <div
                      key={it.id}
                      className="p-3 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-text block">
                          {it.raw_material?.name || 'Material'}
                        </span>
                        <span className="text-3xs font-mono text-muted">
                          Ordered: {ordered} · Received: {already} · Remaining: {remaining}{' '}
                          {it.raw_material?.unit}
                        </span>
                      </div>
                      <div className="w-full sm:w-36">
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          step="0.001"
                          disabled={remaining <= 0}
                          value={grnQtyMap[it.id] ?? '0'}
                          onChange={(e) =>
                            setGrnQtyMap((prev) => ({ ...prev, [it.id]: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#CFE0D5] bg-white font-mono font-bold text-right"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#CFE0D5]">
                <button
                  type="button"
                  onClick={() => setGrnPo(null)}
                  disabled={grnLoading}
                  className="px-4 py-2 rounded-xl border border-[#CFE0D5] font-bold text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grnLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-success text-white font-black uppercase tracking-wider hover:bg-success/90 disabled:opacity-50"
                >
                  {grnLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Post GRN to Stock Ledger</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Payment Tracking Modal */}
      {payPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => !payLoading && setPayPo(null)}
          />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-4 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
              <div>
                <span className="font-mono text-xs font-bold text-primary">{payPo.po_no}</span>
                <h2 className="text-base font-black text-text">Supplier Bill & Payment</h2>
              </div>
              <button
                type="button"
                onClick={() => setPayPo(null)}
                disabled={payLoading}
                className="text-muted hover:text-text p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] flex justify-between">
                <span className="text-muted font-bold">Total PO Payable:</span>
                <span className="font-mono font-black text-primary">
                  ₹{Number(payPo.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Cumulative Amount Paid (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={paidInput}
                    onChange={(e) => setPaidInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Supplier Invoice No.
                </label>
                <input
                  type="text"
                  value={payInvoiceInput}
                  onChange={(e) => setPayInvoiceInput(e.target.value)}
                  placeholder="Optional tax invoice ref"
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#CFE0D5]">
                <button
                  type="button"
                  onClick={() => setPayPo(null)}
                  className="px-4 py-2 rounded-xl border border-[#CFE0D5] font-bold text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white font-black uppercase tracking-wider"
                >
                  {payLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable PO Modal */}
      {printPo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto print:bg-white print:p-0">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-[#CFE0D5] space-y-6 relative print:shadow-none print:border-none print:max-w-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Official Supplier Purchase Order
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#14532D] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#14532D]/90 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintPo(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4 border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  TOLAND PRIVATE LIMITED
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sheikhpura, Barbigha, Khetalpura 811101, Bihar, India
                </p>
                <p className="text-xs font-mono text-slate-700 mt-0.5">
                  Phone: +91 87971 86001 · Procurement Desk
                </p>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  PURCHASE ORDER
                </span>
                <div className="text-lg font-mono font-extrabold text-[#14532D]">{printPo.po_no}</div>
                <div className="text-xs text-slate-500">
                  Date:{' '}
                  {new Date(printPo.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                {printPo.supplier_invoice_no && (
                  <div className="text-xs font-mono text-slate-700">
                    Mill Inv: {printPo.supplier_invoice_no}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Vendor / Supplier Mill
              </div>
              <div className="text-sm font-bold text-slate-900">
                {printPo.supplier?.name || 'Supplier'}
              </div>
              {printPo.supplier?.gst_number && (
                <div className="font-mono text-slate-700">GSTIN: {printPo.supplier.gst_number}</div>
              )}
              {printPo.supplier?.phone && (
                <div className="text-slate-600">Contact: {printPo.supplier.phone}</div>
              )}
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-600 uppercase text-[10px] font-bold">
                  <th className="py-2">Raw Material Description</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit Rate</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(printPo.items || []).map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-semibold text-slate-900">
                      {it.raw_material?.name || 'Raw Material'}
                      <span className="block text-[10px] text-slate-500 capitalize">
                        {it.raw_material?.type}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {Number(it.qty).toLocaleString('en-IN')} {it.raw_material?.unit}
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      ₹{Number(it.unit_price).toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold">
                      ₹{Number(it.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {Number(printPo.gst_amount || 0) > 0 && (
                  <tr>
                    <td colSpan={3} className="py-2 text-right text-slate-600 font-semibold">
                      GST / Freight:
                    </td>
                    <td className="py-2 text-right font-mono">
                      ₹{Number(printPo.gst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
                <tr className="border-t-2 border-slate-900">
                  <td colSpan={3} className="py-3 text-right font-extrabold text-slate-900 uppercase">
                    Total PO Value (INR):
                  </td>
                  <td className="py-3 text-right font-mono font-extrabold text-base text-[#14532D]">
                    ₹{Number(printPo.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-[11px] text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">Delivery Location:</p>
                <p>TOLAND Manufacturing Floor, Barbigha, Sheikhpura, Bihar 811101</p>
              </div>
              <div className="text-right">
                <div className="h-8" />
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
