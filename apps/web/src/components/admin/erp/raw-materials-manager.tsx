'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Edit,
  Trash2,
  SlidersHorizontal,
  History,
  X,
  Loader2,
} from 'lucide-react';

interface RawMaterial {
  id: string;
  name: string;
  type: string;
  unit: string;
  stock_qty: number;
  reorder_level: number;
  unit_price: number;
  batch_lot_no?: string | null;
  gsm?: number | null;
  shade?: string | null;
  updated_at?: string;
}

export function RawMaterialsManager({ materials }: { materials: RawMaterial[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [adjustingMaterial, setAdjustingMaterial] = useState<RawMaterial | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState('fabric');
  const [unit, setUnit] = useState('meters');
  const [stockQty, setStockQty] = useState('0');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [unitPrice, setUnitPrice] = useState('0');
  const [batchLotNo, setBatchLotNo] = useState('');
  const [gsm, setGsm] = useState('');
  const [shade, setShade] = useState('');

  const [adjustChange, setAdjustChange] = useState('');
  const [adjustReason, setAdjustReason] = useState('physical_count_audit');

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingMaterial(null);
    setName('');
    setType('fabric');
    setUnit('meters');
    setStockQty('0');
    setReorderLevel('10');
    setUnitPrice('0');
    setBatchLotNo('');
    setGsm('');
    setShade('');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (m: RawMaterial) => {
    setEditingMaterial(m);
    setName(m.name);
    setType(m.type);
    setUnit(m.unit);
    setStockQty(String(m.stock_qty));
    setReorderLevel(String(m.reorder_level));
    setUnitPrice(String(m.unit_price));
    setBatchLotNo(m.batch_lot_no || '');
    setGsm(m.gsm != null ? String(m.gsm) : '');
    setShade(m.shade || '');
    setError(null);
    setModalOpen(true);
  };

  const openAdjustModal = (m: RawMaterial) => {
    setAdjustingMaterial(m);
    setAdjustChange('');
    setAdjustReason('physical_count_audit');
    setError(null);
    setAdjustModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...(editingMaterial ? { id: editingMaterial.id } : {}),
        name,
        type,
        unit,
        stock_qty: Number(stockQty || 0),
        reorder_level: Number(reorderLevel || 0),
        unit_price: Number(unitPrice || 0),
        batch_lot_no: batchLotNo.trim() || null,
        gsm: gsm.trim() ? Number(gsm) : null,
        shade: shade.trim() || null,
      };

      const res = await fetch('/api/admin/erp/raw-materials', {
        method: editingMaterial ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save material');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to save raw material');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingMaterial) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/erp/raw-materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: adjustingMaterial.id,
          adjust_change: Number(adjustChange),
          adjust_reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Adjustment failed');

      setAdjustModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (m: RawMaterial) => {
    if (!confirm(`Delete raw material "${m.name}"? Any linked BOM lines may also be affected.`)) {
      return;
    }
    setDeletingId(m.id);
    try {
      const res = await fetch(`/api/admin/erp/raw-materials?id=${encodeURIComponent(m.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeBadge = (matType: string) => {
    switch (matType) {
      case 'fabric':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'thread':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'button':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'zip':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'label':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'packaging':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filtered = materials.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q) ||
      (m.batch_lot_no && m.batch_lot_no.toLowerCase().includes(q)) ||
      (m.shade && m.shade.toLowerCase().includes(q));
    const matchesType = selectedType === 'all' || m.type === selectedType;
    return matchesSearch && matchesType;
  });

  const lowStockCount = materials.filter(
    (m) => Number(m.stock_qty) <= Number(m.reorder_level)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Boxes className="w-4 h-4" />
            <span>Manufacturing Inventory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">
            Raw Materials ({materials.length})
          </h1>
          <p className="text-xs text-muted">
            Track denim fabric rolls (Lot #, GSM, Shade), threads, YKK zippers, rivets, and factory trims.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/erp/stock-ledger"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#CFE0D5] text-xs font-bold text-text hover:border-primary hover:text-primary transition-colors shrink-0"
          >
            <History className="w-4 h-4" />
            <span>Stock Ledger</span>
          </Link>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Raw Material</span>
          </button>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-warning/15 border border-warning/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-warning font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {lowStockCount} raw material {lowStockCount === 1 ? 'item is' : 'items are'} below or at the factory reorder threshold!
            </span>
          </div>
          <Link
            href="/admin/erp/purchase-orders"
            className="px-3 py-1 rounded-lg bg-warning text-white font-bold hover:bg-warning/90 transition-colors"
          >
            Create Purchase Order
          </Link>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by material name, roll lot #, shade, or type..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs text-text focus:outline-none focus:border-primary font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { key: 'all', label: 'All Items' },
            { key: 'fabric', label: 'Fabrics' },
            { key: 'thread', label: 'Threads' },
            { key: 'button', label: 'Buttons & Rivets' },
            { key: 'zip', label: 'Zippers' },
            { key: 'label', label: 'Labels & Patches' },
            { key: 'packaging', label: 'Packaging' },
          ].map((tab) => {
            const active = selectedType === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedType(tab.key)}
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
                <th className="py-3 px-4">Raw Material & Roll Spec</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Current Stock</th>
                <th className="py-3 px-3">Reorder Point</th>
                <th className="py-3 px-3">Est. Unit Price</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CFE0D5]">
              {filtered.length > 0 ? (
                filtered.map((m) => {
                  const isLow = Number(m.stock_qty) <= Number(m.reorder_level);

                  return (
                    <tr key={m.id} className="hover:bg-[#F0F7F2]/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-text block">{m.name}</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-3xs font-mono text-muted">
                          <span>Unit: {m.unit}</span>
                          {m.batch_lot_no && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              Lot: {m.batch_lot_no}
                            </span>
                          )}
                          {m.gsm != null && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {m.gsm} GSM / oz
                            </span>
                          )}
                          {m.shade && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Shade: {m.shade}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase border ${getTypeBadge(
                            m.type
                          )}`}
                        >
                          {m.type}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isLow ? 'text-danger font-black' : 'text-text'
                            }`}
                          >
                            {Number(m.stock_qty).toLocaleString('en-IN')} {m.unit}
                          </span>
                          {isLow && (
                            <span className="text-3xs px-1.5 py-0.2 rounded bg-danger/15 text-danger font-bold uppercase">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-muted">
                        &le; {Number(m.reorder_level).toLocaleString('en-IN')} {m.unit}
                      </td>

                      <td className="py-3 px-3 font-mono text-text">
                        ₹{Number(m.unit_price).toFixed(2)} / {m.unit}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openAdjustModal(m)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E3EFE7] text-primary text-3xs font-bold hover:bg-primary/20 transition-colors"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>Adjust</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(m)}
                            className="p-1.5 rounded-lg text-primary hover:bg-[#E3EFE7] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(m)}
                            disabled={deletingId === m.id}
                            className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                          >
                            {deletingId === m.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted text-xs">
                    No raw materials found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => !loading && setModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-5 z-10 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
              <h2 className="text-base font-black text-text">
                {editingMaterial ? `Edit: ${editingMaterial.name}` : 'Register New Raw Material'}
              </h2>
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
                  Material Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 13.5 oz Raw Ring-Spun Cotton Denim"
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-text focus:outline-none focus:border-primary font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Category Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-text focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="fabric">Fabric</option>
                    <option value="thread">Thread</option>
                    <option value="button">Button / Rivet</option>
                    <option value="zip">Zipper</option>
                    <option value="label">Label / Leather Patch</option>
                    <option value="packaging">Packaging Box / Bag</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Stock Unit *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-text focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="meters">Meters (Fabrics)</option>
                    <option value="pieces">Pieces (Buttons, Zippers, Labels)</option>
                    <option value="cones">Cones (Sewing Thread)</option>
                    <option value="kg">Kilograms (kg)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono font-bold text-text focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono text-text focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Roll Lot / GSM / Shade Specs */}
              <div className="p-3 rounded-xl bg-[#F0F7F2]/60 border border-[#CFE0D5] space-y-3">
                <span className="text-3xs font-bold uppercase tracking-wider text-primary block">
                  Fabric Roll & Mill Traceability (Optional)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-3xs font-bold text-muted mb-1">Roll / Lot #</label>
                    <input
                      type="text"
                      value={batchLotNo}
                      onChange={(e) => setBatchLotNo(e.target.value)}
                      placeholder="LOT-A24"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#CFE0D5] bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-bold text-muted mb-1">GSM / Weight</label>
                    <input
                      type="number"
                      step="0.1"
                      value={gsm}
                      onChange={(e) => setGsm(e.target.value)}
                      placeholder="390"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#CFE0D5] bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-bold text-muted mb-1">Dye Shade</label>
                    <input
                      type="text"
                      value={shade}
                      onChange={(e) => setShade(e.target.value)}
                      placeholder="Indigo-B2"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#CFE0D5] bg-white text-xs"
                    />
                  </div>
                </div>
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
                  <span>Save Material</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adjustModalOpen && adjustingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => !loading && setAdjustModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-5 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
              <div>
                <h2 className="text-base font-black text-text">Stock Adjustment</h2>
                <p className="text-3xs text-muted truncate max-w-xs">{adjustingMaterial.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                disabled={loading}
                className="text-muted hover:text-text p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] flex items-center justify-between text-xs">
              <span className="text-muted">Current Ledger Balance:</span>
              <span className="font-mono font-bold text-text">
                {Number(adjustingMaterial.stock_qty).toLocaleString('en-IN')} {adjustingMaterial.unit}
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Quantity Change (+ / -) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={adjustChange}
                  onChange={(e) => setAdjustChange(e.target.value)}
                  placeholder="e.g. +150 for arrival or -12 for wastage"
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono font-bold text-text focus:outline-none focus:border-primary"
                />
                <span className="text-3xs text-muted block mt-1">
                  Prefix with &quot;+&quot; to add incoming stock, or &quot;-&quot; to deduct scraps/wastage.
                </span>
              </div>

              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Adjustment Reason *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-text focus:outline-none focus:border-primary font-medium"
                >
                  <option value="physical_count_audit">Physical Warehouse Audit</option>
                  <option value="wastage_scraps">Cutting Wastage & Scraps</option>
                  <option value="sample_production">R&D Sample Development</option>
                  <option value="supplier_receipt">Vendor Freight Receipt</option>
                  <option value="damage_spoiled">Transit Damaged / Defective</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#CFE0D5]">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
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
                  <span>Apply & Post to Ledger</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
