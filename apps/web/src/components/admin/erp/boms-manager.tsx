'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  Save,
  IndianRupee,
} from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  labor_cost_per_piece?: number | null;
  overhead_cost_per_piece?: number | null;
}

interface RawMaterialItem {
  id: string;
  name: string;
  type: string;
  unit: string;
  stock_qty: number;
  unit_price: number;
}

interface BomLine {
  id: string;
  product_id: string;
  raw_material_id: string;
  qty_per_piece: number;
  scrap_percent?: number | null;
  product?: ProductItem;
  raw_material?: RawMaterialItem;
}

export function BOMsManager({
  products,
  rawMaterials,
  boms,
}: {
  products: ProductItem[];
  rawMaterials: RawMaterialItem[];
  boms: BomLine[];
}) {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState(rawMaterials[0]?.id || '');
  const [qtyPerPiece, setQtyPerPiece] = useState('1');
  const [scrapPercent, setScrapPercent] = useState('3');

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const [laborCost, setLaborCost] = useState(String(selectedProduct?.labor_cost_per_piece || 0));
  const [overheadCost, setOverheadCost] = useState(
    String(selectedProduct?.overhead_cost_per_piece || 0)
  );
  const [costSaving, setCostSaving] = useState(false);
  const [costSavedMsg, setCostSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    const p = products.find((x) => x.id === selectedProductId);
    setLaborCost(String(p?.labor_cost_per_piece || 0));
    setOverheadCost(String(p?.overhead_cost_per_piece || 0));
    setCostSavedMsg(null);
  }, [selectedProductId, products]);

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const productBoms = boms.filter((b) => b.product_id === selectedProductId);

  const totalMaterialCost = productBoms.reduce((acc, b) => {
    const scrapMult = 1 + Number(b.scrap_percent || 0) / 100;
    const effQty = Number(b.qty_per_piece || 0) * scrapMult;
    return acc + effQty * Number(b.raw_material?.unit_price || 0);
  }, 0);

  const totalLandedCost =
    totalMaterialCost + Number(laborCost || 0) + Number(overheadCost || 0);
  const sellingPrice = Number(selectedProduct?.base_price || 0);
  const marginPerPiece = sellingPrice - totalLandedCost;
  const marginPct = sellingPrice > 0 ? Math.round((marginPerPiece / sellingPrice) * 100) : 0;

  let maxPossibleUnits = productBoms.length > 0 ? Infinity : 0;
  let bottleneckMaterial = '';

  productBoms.forEach((b) => {
    const scrapMult = 1 + Number(b.scrap_percent || 0) / 100;
    const effQty = Number(b.qty_per_piece || 0) * scrapMult;
    const stock = Number(b.raw_material?.stock_qty || 0);
    if (effQty > 0) {
      const canMake = Math.floor(stock / effQty);
      if (canMake < maxPossibleUnits) {
        maxPossibleUnits = canMake;
        bottleneckMaterial = b.raw_material?.name || '';
      }
    }
  });
  if (maxPossibleUnits === Infinity) maxPossibleUnits = 0;

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/erp/boms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProductId,
          raw_material_id: selectedMaterialId,
          qty_per_piece: Number(qtyPerPiece),
          scrap_percent: Number(scrapPercent || 0),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save BOM line');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error saving BOM');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCosting = async () => {
    if (!selectedProductId) return;
    setCostSaving(true);
    setCostSavedMsg(null);
    try {
      const res = await fetch('/api/admin/erp/boms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProductId,
          labor_cost_per_piece: Number(laborCost || 0),
          overhead_cost_per_piece: Number(overheadCost || 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update costing');
      setCostSavedMsg('Costing saved!');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Failed to update costing');
    } finally {
      setCostSaving(false);
    }
  };

  const handleDelete = async (b: BomLine) => {
    if (!confirm(`Remove "${b.raw_material?.name}" from this BOM recipe?`)) return;
    setDeletingId(b.id);
    try {
      const res = await fetch(`/api/admin/erp/boms?id=${encodeURIComponent(b.id)}`, {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Recipe, Scrap & Landed Garment Costing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">
            Bill of Materials (BOM)
          </h1>
          <p className="text-xs text-muted">
            Map denim yardage + scrap %, threads, trims, and CMT labor/washing overheads per garment piece.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setQtyPerPiece('1');
            setScrapPercent('3');
            setModalOpen(true);
          }}
          disabled={!selectedProductId}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-all shrink-0 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Ingredient Trim</span>
        </button>
      </div>

      {/* Product Selector & Landed Cost KPIs */}
      <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                  {p.name} (Selling: ₹{p.base_price})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs">
            <div className="p-3 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] min-w-[130px]">
              <span className="text-3xs font-bold text-muted block uppercase">BOM + Scrap</span>
              <span className="text-base font-black text-text font-mono block">
                ₹{totalMaterialCost.toFixed(2)}
              </span>
              <span className="text-3xs text-muted">Raw material/pc</span>
            </div>

            <div className="p-3 rounded-xl bg-[#E3EFE7] border border-[#CFE0D5] min-w-[145px]">
              <span className="text-3xs font-bold text-muted block uppercase">Total Mfg COGS</span>
              <span className="text-base font-black text-primary font-mono block">
                ₹{totalLandedCost.toFixed(2)}
              </span>
              <span className="text-3xs text-emerald-700 font-bold">
                Margin: ₹{marginPerPiece.toFixed(0)} ({marginPct}%)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] min-w-[155px]">
              <span className="text-3xs font-bold text-muted block uppercase">Factory Capacity</span>
              <span className="text-base font-black text-text font-mono block">
                {maxPossibleUnits.toLocaleString('en-IN')} pcs
              </span>
              <span
                className="text-3xs text-muted truncate max-w-[140px] block"
                title={bottleneckMaterial}
              >
                {bottleneckMaterial ? `Bottleneck: ${bottleneckMaterial}` : 'No materials mapped'}
              </span>
            </div>
          </div>
        </div>

        {/* CMT Labor & Overhead Controls */}
        {selectedProduct && (
          <div className="pt-4 border-t border-[#CFE0D5] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-lg text-xs">
              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-muted mb-1">
                  CMT / Stitching Labor Cost per Piece (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono font-bold text-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-muted mb-1">
                  Washing, Packaging & Overhead per Piece (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={overheadCost}
                    onChange={(e) => setOverheadCost(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono font-bold text-text"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {costSavedMsg && (
                <span className="text-xs font-bold text-emerald-700">{costSavedMsg}</span>
              )}
              <button
                type="button"
                onClick={handleSaveCosting}
                disabled={costSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#14532D]/90 disabled:opacity-50"
              >
                {costSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Labor & Overheads</span>
              </button>
            </div>
          </div>
        )}
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
                <th className="py-3 px-3">Net Qty / Pc</th>
                <th className="py-3 px-3">Scrap Allowance</th>
                <th className="py-3 px-3">Gross Qty / Pc</th>
                <th className="py-3 px-3">Current Stock</th>
                <th className="py-3 px-3">Cost / Garment</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CFE0D5]">
              {productBoms.length > 0 ? (
                productBoms.map((b) => {
                  const m = b.raw_material;
                  const scrap = Number(b.scrap_percent || 0);
                  const effQty = Number(b.qty_per_piece || 0) * (1 + scrap / 100);
                  const itemCost = Number(m?.unit_price || 0) * effQty;

                  return (
                    <tr key={b.id} className="hover:bg-[#F0F7F2]/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-text block">{m?.name || 'Unknown Material'}</span>
                        <span className="text-3xs font-mono text-muted">
                          Rate: ₹{Number(m?.unit_price || 0).toFixed(2)}/{m?.unit}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-3xs font-bold uppercase bg-[#F0F7F2] border border-[#CFE0D5] text-primary">
                          {m?.type || 'Material'}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-text">
                        {Number(b.qty_per_piece).toFixed(3)} {m?.unit}
                      </td>

                      <td className="py-3 px-3 font-mono text-amber-700 font-bold">
                        +{scrap.toFixed(1)}%
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-text">
                        {effQty.toFixed(4)} {m?.unit}
                      </td>

                      <td className="py-3 px-3 font-mono text-muted">
                        {Number(m?.stock_qty || 0).toLocaleString('en-IN')} {m?.unit}
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
                  <td colSpan={8} className="py-12 text-center text-muted text-xs">
                    No ingredient recipe mapped for this product yet. Click &quot;Add Ingredient Trim&quot; above.
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Net Qty / Piece *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={qtyPerPiece}
                    onChange={(e) => setQtyPerPiece(e.target.value)}
                    placeholder="e.g. 1.45"
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono font-bold text-text focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Scrap / Marker Loss (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={scrapPercent}
                    onChange={(e) => setScrapPercent(e.target.value)}
                    placeholder="3"
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono font-bold text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <span className="text-3xs text-muted block">
                Example: 1.45 meters denim + 3% cutting scrap = 1.4935 meters deducted per garment.
              </span>

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
