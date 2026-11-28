'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Search,
  Truck,
  PackageCheck,
  Building,
  Printer,
} from 'lucide-react';

interface POItem {
  id: string;
  po_no: string;
  supplier_id: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  total_amount: number;
  created_at: string;
  supplier?: { name: string; gst_number?: string; phone?: string };
  items?: Array<{
    id: string;
    qty: number;
    unit_price: number;
    total: number;
    raw_material?: { name: string; unit: string; type: string };
  }>;
}

interface SupplierOption {
  id: string;
  name: string;
}

interface RawMaterialOption {
  id: string;
  name: string;
  unit: string;
  unit_price: number;
}

interface PurchaseOrdersManagerProps {
  purchaseOrders: POItem[];
  suppliers: SupplierOption[];
  rawMaterials: RawMaterialOption[];
  initialMaterialId?: string;
}

export function PurchaseOrdersManager({
  purchaseOrders,
  suppliers,
  rawMaterials,
  initialMaterialId,
}: PurchaseOrdersManagerProps) {
  const preselectedMat = initialMaterialId
    ? rawMaterials.find((m) => m.id === initialMaterialId)
    : undefined;

  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(Boolean(preselectedMat));
  const [loading, setLoading] = useState(false);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [printPo, setPrintPo] = useState<POItem | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [orderItems, setOrderItems] = useState<
    Array<{ raw_material_id: string; qty: number; unit_price: number }>
  >([
    {
      raw_material_id: preselectedMat?.id || rawMaterials[0]?.id || '',
      qty: 500,
      unit_price: preselectedMat?.unit_price || rawMaterials[0]?.unit_price || 200,
    },
  ]);

  const addLineItem = () => {
    const firstMat = rawMaterials[0];
    setOrderItems([
      ...orderItems,
      {
        raw_material_id: firstMat?.id || '',
        qty: 100,
        unit_price: firstMat?.unit_price || 10,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    if (field === 'raw_material_id') {
      const mat = rawMaterials.find((m) => m.id === value);
      updated[index] = {
        ...updated[index],
        raw_material_id: value,
        unit_price: mat?.unit_price || 0,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setOrderItems(updated);
  };

  const calculateFormTotal = () => {
    return orderItems.reduce(
      (acc, it) => acc + Number(it.qty || 0) * Number(it.unit_price || 0),
      0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || orderItems.length === 0) {
      setError('Please select a supplier and at least one material item');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        supplier_id: supplierId,
        status: 'ordered',
        items: orderItems,
      };

      const res = await fetch('/api/admin/erp/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create PO');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReceived = async (po: POItem) => {
    if (
      !confirm(
        `Receive goods for ${po.po_no}? This will automatically add quantities to raw materials stock and post to the stock ledger.`
      )
    )
      return;

    try {
      setReceivingId(po.id);
      const res = await fetch('/api/admin/erp/purchase-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: po.id, status: 'received' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update PO status');

      router.refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setReceivingId(null);
    }
  };

  const filtered = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.po_no.toLowerCase().includes(search.toLowerCase()) ||
      (po.supplier?.name && po.supplier.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <ClipboardList className="w-4 h-4" />
            <span>Procurement & Inward Freight</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">
            Purchase Orders ({purchaseOrders.length})
          </h1>
          <p className="text-xs text-muted">
            Order raw fabrics and trims from mills; receive shipments directly into the factory ledger.
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

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by PO Number (TLD-PO-...) or Mill/Supplier name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs text-text focus:outline-none focus:border-primary font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'ordered', label: 'Ordered / In Transit' },
            { key: 'received', label: 'Received' },
            { key: 'draft', label: 'Draft' },
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

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase tracking-wider">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-3">Supplier / Mill</th>
                <th className="py-3 px-3">Ordered Date</th>
                <th className="py-3 px-3">Line Items</th>
                <th className="py-3 px-3">Total Value</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CFE0D5]">
              {filtered.length > 0 ? (
                filtered.map((po) => {
                  const isReceived = po.status === 'received';
                  const isOrdered = po.status === 'ordered';

                  return (
                    <tr key={po.id} className="hover:bg-[#F0F7F2]/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-black text-primary">
                        {po.po_no}
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
                        {new Date(po.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-3 text-muted">
                        <div className="space-y-0.5">
                          {po.items?.map((it, idx) => (
                            <span key={idx} className="block text-3xs">
                              • {it.raw_material?.name}: {Number(it.qty).toLocaleString('en-IN')}{' '}
                              {it.raw_material?.unit}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-black text-text">
                        ₹{Number(po.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-3">
                        {isReceived ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-success/15 text-success border border-success/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Stock Received
                          </span>
                        ) : isOrdered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-primary/15 text-primary border border-primary/25">
                            <Truck className="w-3 h-3" />
                            In Transit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-muted/15 text-muted border border-border">
                            {po.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setPrintPo(po)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#CFE0D5] bg-white text-text text-3xs font-bold hover:border-primary hover:text-primary transition-colors cursor-pointer"
                            title="Print or Save Purchase Order PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print PO</span>
                          </button>

                          {isOrdered && (
                            <button
                              type="button"
                              onClick={() => handleMarkReceived(po)}
                              disabled={receivingId === po.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success text-white text-3xs font-bold hover:bg-success/90 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {receivingId === po.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <PackageCheck className="w-3.5 h-3.5" />
                              )}
                              <span>Receive Goods</span>
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

      {/* Modal Dialog */}
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

              {/* Line Items */}
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
                          <label className="block text-3xs text-muted mb-0.5">Quantity ({mat?.unit || 'Units'})</label>
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

              {/* Total Calculation */}
              <div className="p-3 rounded-xl bg-[#E3EFE7] border border-[#CFE0D5] flex items-center justify-between text-xs">
                <span className="font-bold text-primary">Total Estimated PO Amount:</span>
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

      {/* Printable Supplier Purchase Order Modal */}
      {printPo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto print:bg-white print:p-0">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-[#CFE0D5] space-y-6 relative print:shadow-none print:border-none print:max-w-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Official Supplier Purchase Order</span>
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

            {/* Mill Letterhead */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">TOLAND PRIVATE LIMITED</h2>
                <p className="text-xs text-slate-600 mt-0.5">Sheikhpura, Barbigha, Khetalpura 811101, Bihar, India</p>
                <p className="text-xs font-mono text-slate-700 mt-0.5">Phone: +91 87971 86001 · Procurement Desk</p>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">PURCHASE ORDER</span>
                <div className="text-lg font-mono font-extrabold text-[#14532D]">{printPo.po_no}</div>
                <div className="text-xs text-slate-500">
                  Date: {new Date(printPo.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Supplier Info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vendor / Supplier Mill</div>
              <div className="text-sm font-bold text-slate-900">{printPo.supplier?.name || 'Supplier'}</div>
              {printPo.supplier?.gst_number && (
                <div className="font-mono text-slate-700">GSTIN: {printPo.supplier.gst_number}</div>
              )}
              {printPo.supplier?.phone && (
                <div className="text-slate-600">Contact: {printPo.supplier.phone}</div>
              )}
            </div>

            {/* Items Table */}
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
                      <span className="block text-[10px] text-slate-500 capitalize">{it.raw_material?.type}</span>
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {Number(it.qty).toLocaleString('en-IN')} {it.raw_material?.unit}
                    </td>
                    <td className="py-2.5 text-right font-mono">₹{Number(it.unit_price).toFixed(2)}</td>
                    <td className="py-2.5 text-right font-mono font-bold">₹{Number(it.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900">
                  <td colSpan={3} className="py-3 text-right font-extrabold text-slate-900 uppercase">Total PO Value (INR):</td>
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
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
