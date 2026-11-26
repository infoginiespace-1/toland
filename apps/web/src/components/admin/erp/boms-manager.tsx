'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Layers,
  Sparkles,
  ArrowRight,
  Boxes,
} from 'lucide-react';

interface BOMItem {
  id: string;
  product_id: string;
  raw_material_id: string;
  qty_per_piece: number;
  product?: { id: string; name: string; slug: string };
  raw_material?: {
    id: string;
    name: string;
    type: string;
    unit: string;
    stock_qty: number;
    unit_price: number;
  };
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  base_price: number;
}

interface RawMaterialItem {
  id: string;
  name: string;
  type: string;
  unit: string;
  stock_qty: number;
  unit_price: number;
}

interface BOMsManagerProps {
  products: ProductItem[];
  rawMaterials: RawMaterialItem[];
  boms: BOMItem[];
}

export function BOMsManager({ products, rawMaterials, boms }: BOMsManagerProps) {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    rawMaterials[0]?.id || ''
  );
  const [qtyPerPiece, setQtyPerPiece] = useState('1');

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const productBoms = boms.filter((b) => b.product_id === selectedProductId);

  // Calculate total material cost per garment
  const totalMaterialCost = productBoms.reduce((acc, b) => {
    const unitPrice = Number(b.raw_material?.unit_price || 0);
    const qty = Number(b.qty_per_piece || 0);
    return acc + unitPrice * qty;
  }, 0);

  // Calculate production capacity bottleneck
  let maxPossibleUnits = Infinity;
  let bottleneckMaterial = '';

  productBoms.forEach((b) => {
    const availableStock = Number(b.raw_material?.stock_qty || 0);
    const neededPerPiece = Number(b.qty_per_piece || 1);
    const possibleForThis = Math.floor(availableStock / neededPerPiece);
    if (possibleForThis < maxPossibleUnits) {
      maxPossibleUnits = possibleForThis;
      bottleneckMaterial = b.raw_material?.name || '';
    }
  });

  if (maxPossibleUnits === Infinity || productBoms.length === 0) {
    maxPossibleUnits = 0;
  }

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedMaterialId || Number(qtyPerPiece) <= 0) {
      setError('Please provide valid material and consumption rate');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        product_id: selectedProductId,
        raw_material_id: selectedMaterialId,
        qty_per_piece: Number(qtyPerPiece),
      };

      const res = await fetch('/api/admin/erp/boms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save BOM ingredient');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (b: BOMItem) => {
    if (!confirm(`Remove "${b.raw_material?.name}" from this product's Bill of Materials?`)) return;

    try {
      setDeletingId(b.id);
      const res = await fetch(`/api/admin/erp/boms?id=${b.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      router.refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Recipe & Material Consumption</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">
            Bill of Materials (BOM)
          </h1>
          <p className="text-xs text-muted">
            Map denim fabric yardage, thread consumption, zippers, and trims required per 1 garment piece.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setQtyPerPiece('1');
            setModalOpen(true);
          }}
          disabled={!selectedProductId}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-all shrink-0 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Ingredient Trim</span>
        </button>
      </div>

      {/* Product Selector Dropdown */}
      <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-muted mb-1">
            Select Finished Denim Style
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full sm:max-w-md px-3.5 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/60 text-xs font-bold text-text focus:outline-none focus:border-primary"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Base: ₹{p.base_price})
              </option>
            ))}
          </select>
        </div>

        {/* Cost & Capacity Summary KPIs */}
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="p-3 rounded-xl bg-[#E3EFE7] border border-[#CFE0D5] min-w-[140px]">
            <span className="text-3xs font-bold text-muted block uppercase">Raw Material Cost</span>
            <span className="text-lg font-black text-primary font-mono block">
              ₹{totalMaterialCost.toFixed(2)}
            </span>
            <span className="text-3xs text-muted">Per finished piece</span>
          </div>

          <div className="p-3 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] min-w-[160px]">
            <span className="text-3xs font-bold text-muted block uppercase">Factory Capacity</span>
            <span className="text-lg font-black text-text font-mono block">
              {maxPossibleUnits.toLocaleString('en-IN')} pcs
            </span>
            <span className="text-3xs text-muted truncate max-w-[140px] block" title={bottleneckMaterial}>
              {bottleneckMaterial ? `Bottleneck: ${bottleneckMaterial}` : 'No materials mapped'}
            </span>
          </div>
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#CFE0D5] flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
            Ingredient Requirements for {selectedProduct?.name} ({productBoms.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase tracking-wider">
                <th className="py-3 px-4">Raw Material Ingredient</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Consumption / Piece</th>
                <th className="py-3 px-3">Current Stock</th>
                <th className="py-3 px-3">Cost / Unit</th>
                <th className="py-3 px-3">Cost / Garment</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CFE0D5]">
              {productBoms.length > 0 ? (
                productBoms.map((b) => {
                  const m = b.raw_material;
                  const itemCost = Number(m?.unit_price || 0) * Number(b.qty_per_piece || 0);

                  return (
                    <tr key={b.id} className="hover:bg-[#F0F7F2]/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-text block">{m?.name || 'Unknown Material'}</span>
                        <span className="text-3xs font-mono text-muted">ID: {b.raw_material_id.slice(0, 8)}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-3xs font-bold uppercase bg-[#F0F7F2] border border-[#CFE0D5] text-primary">
                          {m?.type || 'Material'}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-text">
                        {Number(b.qty_per_piece).toFixed(4)} {m?.unit}
                      </td>

                      <td className="py-3 px-3 font-mono text-muted">
                        {Number(m?.stock_qty || 0).toLocaleString('en-IN')} {m?.unit}
                      </td>

                      <td className="py-3 px-3 font-mono text-muted">
                        ₹{Number(m?.unit_price || 0).toFixed(2)}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-primary">
                        ₹{itemCost.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(b)}
                          disabled={deletingId === b.id}
                          className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                        >
                          {deletingId === b.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted text-xs">
                    No ingredient recipe mapped for this product yet. Click &quot;Add Ingredient Trim&quot; above.
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
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-5 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
              <h2 className="text-base font-black text-text">Add BOM Ingredient</h2>
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

            <form onSubmit={handleAddIngredient} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Raw Material Item *
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-text font-medium focus:outline-none focus:border-primary"
                >
                  {rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.unit} — ₹{m.unit_price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Consumption Per 1 Garment Piece *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  required
                  value={qtyPerPiece}
                  onChange={(e) => setQtyPerPiece(e.target.value)}
                  placeholder="e.g. 1.45 for meters of denim, or 5 for rivets"
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono font-bold text-text focus:outline-none focus:border-primary"
                />
                <span className="text-3xs text-muted block mt-1">
                  Example: 1.45 meters fabric, 1 metal zipper, 5 rivets, 1 shank button, 2 labels.
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
                  <span>Save Ingredient</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
