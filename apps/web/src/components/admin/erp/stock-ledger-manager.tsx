'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Package,
  Layers,
  Calendar,
  AlertTriangle,
  Loader2,
  X,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { downloadCsv } from '@/lib/csv-export';

interface LedgerItem {
  id: string;
  item_type: 'raw_material' | 'finished_variant';
  item_id: string;
  change: number;
  reason: 'purchase' | 'production_in' | 'production_out' | 'sale' | 'adjustment' | 'wastage';
  ref_id?: string | null;
  created_at: string;
}

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  stock_qty: number;
}

interface VariantItem {
  id: string;
  product_id: string;
  size: string;
  fit?: string | null;
  wash?: string | null;
  sku?: string | null;
  stock_qty: number;
  product?: { name: string } | null;
}

interface StockLedgerManagerProps {
  ledger: LedgerItem[];
  rawMaterials: RawMaterial[];
  variants: VariantItem[];
}

export function StockLedgerManager({
  ledger,
  rawMaterials,
  variants,
}: StockLedgerManagerProps) {
  const router = useRouter();

  // Search & Filter
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'raw_material' | 'finished_variant'>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');

  // Adjustment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [adjItemType, setAdjItemType] = useState<'raw_material' | 'finished_variant'>('raw_material');
  const [adjItemId, setAdjItemId] = useState('');
  const [adjChange, setAdjChange] = useState('');
  const [adjReason, setAdjReason] = useState<'adjustment' | 'wastage'>('adjustment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map IDs to Names
  const rawMap = new Map(rawMaterials.map((r) => [r.id, r]));
  const varMap = new Map(variants.map((v) => [v.id, v]));

  const getItemLabel = (itemType: string, itemId: string) => {
    if (itemType === 'raw_material') {
      const rm = rawMap.get(itemId);
      return rm ? `${rm.name} (${rm.unit})` : `Raw Material #${itemId.slice(0, 8)}`;
    } else {
      const v = varMap.get(itemId);
      if (!v) return `Variant #${itemId.slice(0, 8)}`;
      return `${v.product?.name || 'Garment'} - Size ${v.size} ${v.fit ? `(${v.fit})` : ''} ${v.sku ? `[${v.sku}]` : ''}`;
    }
  };

  const openAdjustmentModal = () => {
    setAdjItemType('raw_material');
    setAdjItemId(rawMaterials[0]?.id || '');
    setAdjChange('');
    setAdjReason('adjustment');
    setError(null);
    setModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjItemId) {
      setError('Please select an item to adjust');
      return;
    }
    const num = Number(adjChange);
    if (isNaN(num) || num === 0) {
      setError('Adjustment amount must be a non-zero number');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/erp/stock-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: adjItemType,
          item_id: adjItemId,
          change: num,
          reason: adjReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record stock adjustment');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error recording adjustment');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Ledger
  const filteredLedger = ledger.filter((entry) => {
    if (typeFilter !== 'all' && entry.item_type !== typeFilter) return false;
    if (reasonFilter !== 'all' && entry.reason !== reasonFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const label = getItemLabel(entry.item_type, entry.item_id).toLowerCase();
      const reason = entry.reason.toLowerCase();
      if (!label.includes(q) && !reason.includes(q)) return false;
    }
    return true;
  });

  // KPI calculations
  const totalEntries = ledger.length;
  const inFlowCount = ledger.filter((l) => Number(l.change) > 0).length;
  const outFlowCount = ledger.filter((l) => Number(l.change) < 0).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14532D]">Stock Ledger & Audit Trail</h1>
          <p className="text-sm text-gray-600 mt-1">
            Immutable movement history for raw fabric, trims, packaging, and finished denim jeans.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                `toland-stock-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
                ['Date', 'Category', 'Item', 'Change Qty', 'Reason', 'Ref ID'],
                filteredLedger.map((entry) => [
                  new Date(entry.created_at).toLocaleString('en-IN'),
                  entry.item_type,
                  getItemLabel(entry.item_type, entry.item_id),
                  entry.change,
                  entry.reason,
                  entry.ref_id || '',
                ])
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#CFE0D5] text-slate-700 rounded-lg hover:border-[#14532D] hover:text-[#14532D] text-sm font-medium transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openAdjustmentModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-sm font-medium transition shadow-sm w-fit cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Stock Adjustment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Audit Logs</span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#14532D] mt-2">{totalEntries}</p>
          <span className="text-xs text-gray-500 mt-1 block">Recorded warehouse events</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Inbound Receipts</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{inFlowCount}</p>
          <span className="text-xs text-emerald-600 mt-1 block">PO deliveries & completed output</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Outbound Dispatches</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{outFlowCount}</p>
          <span className="text-xs text-rose-600 mt-1 block">Production draw, sales & wastage</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-[#CFE0D5] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              typeFilter === 'all'
                ? 'bg-[#14532D] text-white shadow-sm'
                : 'bg-[#F0F7F2] text-gray-700 hover:bg-[#E3EFE7]'
            }`}
          >
            All Inventory
          </button>
          <button
            onClick={() => setTypeFilter('raw_material')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              typeFilter === 'raw_material'
                ? 'bg-[#14532D] text-white shadow-sm'
                : 'bg-[#F0F7F2] text-gray-700 hover:bg-[#E3EFE7]'
            }`}
          >
            Raw Materials Only
          </button>
          <button
            onClick={() => setTypeFilter('finished_variant')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              typeFilter === 'finished_variant'
                ? 'bg-[#14532D] text-white shadow-sm'
                : 'bg-[#F0F7F2] text-gray-700 hover:bg-[#E3EFE7]'
            }`}
          >
            Finished Garments
          </button>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[#CFE0D5] bg-[#F0F7F2]/60 text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#14532D]"
          >
            <option value="all">All Reasons</option>
            <option value="purchase">PO Purchase / Received</option>
            <option value="production_in">Production Input</option>
            <option value="production_out">Production Output</option>
            <option value="sale">Customer Order Sale</option>
            <option value="adjustment">Manual Adjustment</option>
            <option value="wastage">Factory Wastage</option>
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items, fabrics, reasons..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-[#CFE0D5] bg-[#F0F7F2]/40 focus:outline-none focus:ring-1 focus:ring-[#14532D]"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-[#CFE0D5] shadow-sm overflow-hidden">
        {filteredLedger.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No stock movements found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Stock changes from purchase orders, production batches, and sales will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0F7F2]/60 text-gray-600 font-semibold border-b border-[#CFE0D5]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Item Type</th>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Quantity Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLedger.map((entry) => {
                  const numChange = Number(entry.change);
                  const isPositive = numChange > 0;
                  const itemLabel = getItemLabel(entry.item_type, entry.item_id);

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                            entry.item_type === 'raw_material'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {entry.item_type === 'raw_material' ? (
                            <>
                              <Layers className="w-3 h-3" /> Raw Material
                            </>
                          ) : (
                            <>
                              <Package className="w-3 h-3" /> Finished Garment
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 max-w-xs truncate">
                        {itemLabel}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="capitalize px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px]">
                          {entry.reason.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 ${
                            isPositive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          {isPositive ? `+${numChange}` : `${numChange}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADJUSTMENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CFE0D5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Record Stock Adjustment</h3>
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

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Item Category *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjItemType('raw_material');
                      setAdjItemId(rawMaterials[0]?.id || '');
                    }}
                    className={`py-2 px-3 text-xs rounded-lg font-medium border transition ${
                      adjItemType === 'raw_material'
                        ? 'bg-[#14532D] text-white border-[#14532D]'
                        : 'bg-white border-[#CFE0D5] text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Raw Material
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjItemType('finished_variant');
                      setAdjItemId(variants[0]?.id || '');
                    }}
                    className={`py-2 px-3 text-xs rounded-lg font-medium border transition ${
                      adjItemType === 'finished_variant'
                        ? 'bg-[#14532D] text-white border-[#14532D]'
                        : 'bg-white border-[#CFE0D5] text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Finished Garment
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Item *</label>
                <select
                  value={adjItemId}
                  onChange={(e) => setAdjItemId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                >
                  {adjItemType === 'raw_material'
                    ? rawMaterials.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} (Current Stock: {r.stock_qty} {r.unit})
                        </option>
                      ))
                    : variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.product?.name || 'Garment'} - Size {v.size} {v.fit ? `(${v.fit})` : ''} (Current: {v.stock_qty} pcs)
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quantity Change (+ to add, - to deduct) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={adjChange}
                  onChange={(e) => setAdjChange(e.target.value)}
                  placeholder="e.g. +50 or -12.5"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Adjustment Reason</label>
                <select
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                >
                  <option value="adjustment">Stock Reconciliation / Audit Correction</option>
                  <option value="wastage">Factory Floor Scrap / Damage</option>
                </select>
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
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
