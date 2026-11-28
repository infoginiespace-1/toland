'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  Filter,
  Edit,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface ProductsTableClientProps {
  products: any[];
  categories: any[];
  initialSearch?: string;
  initialCategoryId?: string;
  initialStatus?: string;
}

export function ProductsTableClient({
  products,
  categories,
  initialSearch = '',
  initialCategoryId = '',
  initialStatus = 'all',
}: ProductsTableClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Client-side filtering
  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      !selectedCategory || p.category_id === selectedCategory;

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && p.is_active) ||
      (selectedStatus === 'inactive' && !p.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also remove its variants and images.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }
      router.refresh();
    } catch (err: any) {
      alert(`Error deleting product: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getImageUrl = (images: any[]) => {
    if (!images || images.length === 0) return null;
    const first = images[0];
    const path = typeof first === 'string' ? first : first.path;
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden space-y-4 p-5">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#CFE0D5]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by model name or slug..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs text-text focus:outline-none focus:border-primary font-medium"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs text-text focus:outline-none focus:border-primary font-medium"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs text-text focus:outline-none focus:border-primary font-medium"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Mobile Products Card List (md:hidden) */}
      <div className="md:hidden divide-y divide-[#CFE0D5]">
        {filtered.length > 0 ? (
          filtered.map((product) => {
            const imageUrl = getImageUrl(product.images);
            const totalStock = (product.variants || []).reduce(
              (acc: number, v: any) => acc + Number(v.stock_qty || 0),
              0
            );
            const isLowStock = totalStock <= 10;

            return (
              <div key={product.id} className="p-3.5 space-y-2.5 hover:bg-[#F0F7F2]/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] overflow-hidden shrink-0 flex items-center justify-center">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Layers className="w-6 h-6 text-primary/40" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-text truncate">{product.name}</span>
                      {product.is_featured && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-4xs font-black bg-warning/20 text-warning uppercase">
                          <Sparkles className="w-2.5 h-2.5" />
                          Featured
                        </span>
                      )}
                    </div>
                    <span className="text-3xs text-primary font-bold block mt-0.5">
                      {product.category?.name || 'Uncategorized'}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-black text-slate-900 font-mono">₹{product.base_price}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-4xs font-mono font-bold ${
                          totalStock === 0
                            ? 'bg-danger/15 text-danger border border-danger/25'
                            : isLowStock
                            ? 'bg-warning/15 text-warning border border-warning/25'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        Stock: {totalStock} pcs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-4xs font-bold ${
                      product.is_active
                        ? 'bg-success/15 text-success border border-success/25'
                        : 'bg-muted/15 text-muted border border-border'
                    }`}
                  >
                    {product.is_active ? 'Active' : 'Archived'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/products/${product.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-[#F0F7F2]"
                      title="View"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-white text-3xs font-bold shadow-2xs hover:bg-primary-hover"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id, product.name)}
                      disabled={deletingId === product.id}
                      className="p-1 rounded-lg text-danger hover:bg-danger/10 disabled:opacity-50"
                    >
                      {deletingId === product.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-muted">No manufactured products found matching your search.</div>
        )}
      </div>

      {/* Desktop Products Table (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase tracking-wider">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Base Price</th>
              <th className="py-3 px-3">Variants</th>
              <th className="py-3 px-3">Total Stock</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CFE0D5]">
            {filtered.length > 0 ? (
              filtered.map((product) => {
                const imageUrl = getImageUrl(product.images);
                const totalStock = (product.variants || []).reduce(
                  (acc: number, v: any) => acc + Number(v.stock_qty || 0),
                  0
                );
                const isLowStock = totalStock <= 10;

                return (
                  <tr key={product.id} className="hover:bg-[#F0F7F2]/40 transition-colors">
                    {/* Product Media + Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] overflow-hidden shrink-0 flex items-center justify-center">
                          {imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Layers className="w-5 h-5 text-primary/40" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-text hover:text-primary transition-colors">
                              {product.name}
                            </span>
                            {product.is_featured && (
                              <span className="text-3xs px-1.5 py-0.2 rounded bg-accent/15 text-accent font-bold uppercase">
                                Featured
                              </span>
                            )}
                          </div>
                          <span className="text-3xs font-mono text-muted block mt-0.5">
                            /{product.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 font-medium text-text">
                      <span className="px-2 py-0.5 rounded-lg bg-[#F0F7F2] border border-[#CFE0D5] text-3xs font-semibold">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Base Price */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-text">₹{product.base_price}</span>
                      {product.mrp && product.mrp > product.base_price && (
                        <span className="text-3xs text-muted line-through block">
                          ₹{product.mrp}
                        </span>
                      )}
                    </td>

                    {/* Variant Count */}
                    <td className="py-3 px-3 font-mono text-muted">
                      {product.variants?.length || 0} sizes
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-3">
                      <span
                        className={`font-mono font-bold ${
                          totalStock === 0
                            ? 'text-danger'
                            : isLowStock
                            ? 'text-warning font-black'
                            : 'text-text'
                        }`}
                      >
                        {totalStock} pcs
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3">
                      {product.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-success/15 text-success border border-success/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-muted/15 text-muted border border-border">
                          Archived
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          title="View on Storefront"
                          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-[#F0F7F2] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          title="Edit Product"
                          className="p-1.5 rounded-lg text-primary hover:bg-[#E3EFE7] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={deletingId === product.id}
                          title="Delete Product"
                          className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                        >
                          {deletingId === product.id ? (
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
                <td colSpan={7} className="py-12 text-center text-muted text-xs">
                  No manufactured products found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
