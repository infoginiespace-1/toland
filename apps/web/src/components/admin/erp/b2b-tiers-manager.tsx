'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Tag,
  Plus,
  Trash2,
  TrendingDown,
  Building,
  Package,
  Layers,
  Search,
  AlertTriangle,
  Loader2,
  X,
  CheckCircle2,
} from 'lucide-react';

interface B2BTierItem {
  id: string;
  product_id: string;
  min_qty: number;
  price: number;
  created_at: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
  } | null;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
}

interface B2BTiersManagerProps {
  tiers: B2BTierItem[];
  products: ProductItem[];
}

export function B2BTiersManager({ tiers, products }: B2BTiersManagerProps) {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [minQty, setMinQty] = useState('50');
  const [price, setPrice] = useState('750');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Selected product reference for live discount calc in modal
  const selectedProduct = products.find((p) => p.id === productId);
  const retailPrice = selectedProduct?.price || 0;
  const wholesalePriceNum = parseFloat(price) || 0;
  const discountPct = retailPrice > 0 && wholesalePriceNum > 0
    ? Math.max(0, Math.round(((retailPrice - wholesalePriceNum) / retailPrice) * 100))
    : 0;

  const openAddModal = () => {
    setProductId(products[0]?.id || '');
    setMinQty('50');
    setPrice(products[0] ? String(Math.round(products[0].price * 0.75)) : '750');
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setError('Please select a product');
      return;
    }
    const q = parseInt(minQty, 10);
    const p = parseFloat(price);

    if (isNaN(q) || q <= 1) {
      setError('Minimum quantity must be greater than 1');
      return;
    }
    if (isNaN(p) || p <= 0) {
      setError('Wholesale price must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/erp/b2b-tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, min_qty: q, price: p }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save tier');

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error saving tier');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this wholesale volume tier?')) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/erp/b2b-tiers?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete tier');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Error deleting tier');
    } finally {
      setDeletingId(null);
    }
  };

  // Group tiers by product
  const tiersByProduct: Record<string, { product: ProductItem; tiers: B2BTierItem[] }> = {};

  products.forEach((prod) => {
    tiersByProduct[prod.id] = { product: prod, tiers: [] };
  });

  tiers.forEach((t) => {
    if (tiersByProduct[t.product_id]) {
      tiersByProduct[t.product_id].tiers.push(t);
    } else if (t.product) {
      tiersByProduct[t.product_id] = {
        product: { id: t.product.id, name: t.product.name, slug: t.product.slug, price: t.product.price },
        tiers: [t],
      };
    }
  });

  // Filter groups
  const productGroups = Object.values(tiersByProduct).filter((group) => {
    if (search) {
      const q = search.toLowerCase();
      if (!group.product.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // KPIs
  const totalTiers = tiers.length;
  const activeB2BProducts = Object.values(tiersByProduct).filter((g) => g.tiers.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14532D]">B2B Wholesale Price Tiers</h1>
          <p className="text-sm text-gray-600 mt-1">
            Automated volume discount structures for distributors, wholesale buyers, and boutique stockists.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-sm font-medium transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          Add Wholesale Tier
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">B2B Enabled Styles</span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#14532D] mt-2">{activeB2BProducts} Products</p>
          <span className="text-xs text-gray-500 mt-1 block">With configured volume slabs</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Configured Slabs</span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#228B22]">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalTiers} Tiers</p>
          <span className="text-xs text-gray-500 mt-1 block">Volume brackets active</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">B2B Minimum MoQ</span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#14532D] mt-2">50 Pcs</p>
          <span className="text-xs text-gray-500 mt-1 block">Standard wholesale starter lot</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-[#CFE0D5] shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-[#CFE0D5] bg-[#F0F7F2]/40 focus:outline-none focus:ring-1 focus:ring-[#14532D]"
          />
        </div>
      </div>

      {/* Product Volume Matrix */}
      <div className="space-y-4">
        {productGroups.map(({ product, tiers: prodTiers }) => {
          const sortedTiers = [...prodTiers].sort((a, b) => a.min_qty - b.min_qty);

          return (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-[#CFE0D5] shadow-sm overflow-hidden"
            >
              <div className="p-4 bg-[#F0F7F2]/40 border-b border-[#CFE0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{product.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Retail Base Price: <span className="font-semibold text-[#14532D]">₹{product.price}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setProductId(product.id);
                    setMinQty('50');
                    setPrice(String(Math.round(product.price * 0.75)));
                    setError(null);
                    setModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#CFE0D5] text-[#14532D] hover:bg-[#F0F7F2] rounded-lg text-xs font-semibold transition w-fit"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Bracket
                </button>
              </div>

              {sortedTiers.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">
                  No wholesale volume tiers configured yet for this product.
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sortedTiers.map((tier) => {
                    const discount = product.price > 0
                      ? Math.round(((product.price - Number(tier.price)) / product.price) * 100)
                      : 0;

                    return (
                      <div
                        key={tier.id}
                        className="p-3.5 rounded-xl border border-[#CFE0D5] bg-gradient-to-br from-white to-[#F0F7F2]/30 flex flex-col justify-between relative group"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900">
                              {tier.min_qty}+ Pieces
                            </span>
                            {discount > 0 && (
                              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                {discount}% Off
                              </span>
                            )}
                          </div>

                          <div className="mt-2">
                            <span className="text-lg font-bold text-[#14532D]">
                              ₹{Number(tier.price).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-gray-500 ml-1">/ piece</span>
                          </div>

                          <div className="mt-2 text-[11px] text-gray-500">
                            Minimum Order Value: ₹{(tier.min_qty * Number(tier.price)).toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-end">
                          <button
                            onClick={() => handleDelete(tier.id)}
                            disabled={deletingId === tier.id}
                            className="text-gray-400 hover:text-rose-600 transition p-1"
                            title="Delete Tier"
                          >
                            {deletingId === tier.id ? (
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
              )}
            </div>
          );
        })}
      </div>

      {/* ADD / UPDATE TIER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CFE0D5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Add Wholesale Pricing Tier</h3>
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
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Product *</label>
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    const sel = products.find((p) => p.id === e.target.value);
                    if (sel) {
                      setPrice(String(Math.round(sel.price * 0.75)));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Retail: ₹{p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Minimum Order Quantity (MoQ) *
                </label>
                <input
                  type="number"
                  min="2"
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                  placeholder="e.g. 50, 100, 200, 500"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Wholesale Price per Piece (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 720"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                />
              </div>

              {selectedProduct && retailPrice > 0 && wholesalePriceNum > 0 && (
                <div className="p-3 bg-[#F0F7F2] rounded-lg text-xs space-y-1 border border-[#CFE0D5]">
                  <div className="flex justify-between text-gray-700">
                    <span>Retail Baseline:</span>
                    <span className="font-semibold">₹{retailPrice}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Wholesale Discount:</span>
                    <span className="font-bold text-emerald-700">{discountPct}% OFF</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Estimated MoQ Order Value:</span>
                    <span className="font-bold text-[#14532D]">
                      ₹{(parseInt(minQty || '0', 10) * wholesalePriceNum).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

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
                  Save Pricing Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
