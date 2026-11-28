'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MultiImageUploadPicker } from '@/components/admin/image-upload-picker';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ShieldAlert,
  TrendingUp,
  Percent,
  Scissors,
  Check,
} from 'lucide-react';
import Link from 'next/link';

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface VariantItem {
  id?: string;
  size: string;
  fit: string;
  wash: string;
  color: string;
  stock_qty: number;
  sku: string;
  price?: number;
}

interface ProductFormProps {
  initialData?: any;
  categories: CategoryOption[];
  isEdit?: boolean;
  bomsData?: any[];
}

export function ProductForm({
  initialData,
  categories,
  isEdit = false,
  bomsData = [],
}: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || (categories[0]?.id || ''));
  const [basePrice, setBasePrice] = useState(initialData?.base_price?.toString() || '');
  const [mrp, setMrp] = useState(initialData?.mrp?.toString() || '');
  const [gstPercent, setGstPercent] = useState(initialData?.gst_percent?.toString() || '12');
  const [hsnCode, setHsnCode] = useState(initialData?.hsn_code || '620342');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false);
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || '');

  // Images state
  const [images, setImages] = useState<Array<{ id?: string; path: string; sort?: number }>>(
    initialData?.images || []
  );

  // Variants state
  const [variants, setVariants] = useState<VariantItem[]>(
    initialData?.variants && initialData.variants.length > 0
      ? initialData.variants
      : [
          { size: '30', fit: 'Regular', wash: 'Raw Indigo', color: 'Indigo', stock_qty: 25, sku: '' },
          { size: '32', fit: 'Regular', wash: 'Raw Indigo', color: 'Indigo', stock_qty: 30, sku: '' },
          { size: '34', fit: 'Regular', wash: 'Raw Indigo', color: 'Indigo', stock_qty: 20, sku: '' },
        ]
  );

  // Auto-generate slug from name if empty
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEdit && (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const addVariantRow = () => {
    setVariants([
      ...variants,
      {
        size: '32',
        fit: 'Regular',
        wash: 'Raw Indigo',
        color: 'Indigo',
        stock_qty: 10,
        sku: `${slug.toUpperCase() || 'TLD'}-${variants.length + 1}`,
      },
    ]);
  };

  const removeVariantRow = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantItem, val: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    setVariants(updated);
  };

  const generateStandardDenimSizes = () => {
    const standardSizes = ['28', '30', '32', '34', '36', '38'];
    const generated: VariantItem[] = standardSizes.map((sz) => ({
      size: sz,
      fit: 'Regular',
      wash: 'Raw Indigo',
      color: 'Indigo',
      stock_qty: 20,
      sku: `${(slug || 'TLD').toUpperCase()}-${sz}`,
      price: basePrice ? Number(basePrice) : undefined,
    }));
    setVariants(generated);
  };

  // Manufacturing COGS & Profit Margin Calculations
  const bomRawCost = (bomsData || []).reduce((acc: number, item: any) => {
    const qty = Number(item.qty_per_piece || 0);
    const scrapPct = Number(item.scrap_percent || 0);
    const unitPrice = Number(item.raw_material?.unit_price || 0);
    return acc + qty * (1 + scrapPct / 100) * unitPrice;
  }, 0);

  const laborCost = Number(initialData?.labor_cost_per_piece || 0);
  const overheadCost = Number(initialData?.overhead_cost_per_piece || 0);
  const landedMfgCost = Math.round((bomRawCost + laborCost + overheadCost) * 100) / 100;

  const currentPrice = Number(basePrice || 0);
  const grossProfit = currentPrice > 0 && landedMfgCost > 0 ? currentPrice - landedMfgCost : 0;
  const marginPct = currentPrice > 0 && landedMfgCost > 0 ? Math.round((grossProfit / currentPrice) * 100) : 0;
  const isLossMaking = landedMfgCost > 0 && currentPrice > 0 && currentPrice < landedMfgCost;

  // Pipeline Readiness Checks
  const totalStockQty = variants.reduce((s, v) => s + (Number(v.stock_qty) || 0), 0);
  const hasBom = bomsData.length > 0;
  const hasImages = images.length > 0;
  const hasStock = totalStockQty > 0;

  const pipelineSteps = [
    {
      label: '1. Style Draft',
      status: isEdit ? 'done' : 'current',
      desc: name ? name : 'Define master style',
    },
    {
      label: '2. BOM Recipe',
      status: hasBom ? 'done' : 'pending',
      desc: hasBom ? `${bomsData.length} Raw Materials mapped` : 'Map denim & trims in ERP BOM',
    },
    {
      label: '3. Cutting & Mfg',
      status: hasStock || isEdit ? 'done' : 'pending',
      desc: 'Factory batch cutting & wash',
    },
    {
      label: '4. Pack & Stock',
      status: hasStock ? 'done' : 'pending',
      desc: hasStock ? `${totalStockQty} pcs in warehouse` : 'No finished stock ready',
    },
    {
      label: '5. Storefront',
      status: isActive ? 'done' : 'pending',
      desc: isActive ? 'Live for customer orders' : 'Draft mode (Hidden)',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Please provide a product name');
      return;
    }
    if (!slug.trim()) {
      setError('Please provide a product slug');
      return;
    }
    if (!basePrice || Number(basePrice) <= 0) {
      setError('Please enter a valid base price');
      return;
    }
    if (variants.length === 0) {
      setError('Please configure at least one product size variant');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        id: initialData?.id,
        name,
        slug,
        description,
        category_id: categoryId || null,
        base_price: Number(basePrice),
        mrp: mrp ? Number(mrp) : Number(basePrice),
        gst_percent: Number(gstPercent),
        hsn_code: hsnCode,
        is_active: isActive,
        is_featured: isFeatured,
        meta_title: metaTitle,
        meta_description: metaDescription,
        images,
        variants,
      };

      const res = await fetch('/api/admin/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setSuccess(`Product ${isEdit ? 'updated' : 'created'} successfully! Storefront cache revalidated.`);
      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error('[Product Save Error]:', err);
      setError(err?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#CFE0D5]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl bg-white border border-[#CFE0D5] text-muted hover:text-text hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-text tracking-tight">
                {isEdit ? `Edit Product: ${initialData?.name}` : 'Create New Product'}
              </h1>
              {isEdit && (
                <span
                  className={`px-2 py-0.5 rounded text-3xs font-black uppercase tracking-wider ${
                    isActive ? 'bg-success/20 text-success' : 'bg-warning/20 text-amber-800'
                  }`}
                >
                  {isActive ? 'Storefront Live' : 'Draft / Hidden'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted">
              Configure manufacturing specs, image gallery, BOM costing, and inventory variants.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEdit && slug && (
            <Link
              href={`/products/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#CFE0D5] text-xs font-bold text-muted hover:text-text hover:bg-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Storefront</span>
            </Link>
          )}
          <Link
            href="/admin/products"
            className="px-4 py-2 rounded-xl border border-[#CFE0D5] text-xs font-bold text-muted hover:text-text hover:bg-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isEdit ? 'Save Changes' : 'Publish Product'}</span>
          </button>
        </div>
      </div>

      {/* Manufacturing-to-Storefront Pipeline Stepper */}
      <div className="bg-white rounded-2xl p-5 border border-[#CFE0D5] shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-[#CFE0D5] pb-2">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-wider text-text">
              Manufacturing to Storefront Lifecycle
            </h2>
          </div>
          <span className="text-3xs font-mono text-muted">
            Factory Unit: Barbigha, Sheikhpura
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {pipelineSteps.map((step, idx) => {
            const isDone = step.status === 'done';
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-[#F0F7F2]/40 border-[#CFE0D5]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-3xs font-black uppercase tracking-wider ${
                      isDone ? 'text-emerald-800' : 'text-muted'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#CFE0D5]" />
                  )}
                </div>
                <p className="text-3xs text-muted leading-tight">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-success/15 border border-success/30 text-success text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Basic Info, Pricing & Variants */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. General Details Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#CFE0D5] shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-[#CFE0D5] pb-2">
              General Information
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text mb-1 uppercase tracking-wider">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Classic 13.5 oz Raw Selvedge Denim"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs text-text focus:outline-none focus:border-primary font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text mb-1 uppercase tracking-wider">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="classic-13-5-oz-raw-selvedge-denim"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs font-mono text-text focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text mb-1 uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs text-text focus:outline-none focus:border-primary font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1 uppercase tracking-wider">
                  Product Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Artisanal 100% cotton ring-spun denim stitched at our Sheikhpura, Bihar factory..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs text-text focus:outline-none focus:border-primary leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* 2. Pricing & Live Manufacturing COGS Analysis Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#CFE0D5] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#CFE0D5] pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                Pricing & Landed Manufacturing COGS
              </h2>
              {hasBom && (
                <Link
                  href="/admin/erp/bom"
                  className="text-3xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Edit ERP BOM ({bomsData.length} items)</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-text mb-1 uppercase tracking-wider">
                  Base Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="1299"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs font-mono font-bold text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1 uppercase tracking-wider">
                  MRP (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="2499"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs font-mono text-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1 uppercase tracking-wider">
                  GST Rate
                </label>
                <select
                  value={gstPercent}
                  onChange={(e) => setGstPercent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs text-text focus:outline-none focus:border-primary font-medium"
                >
                  <option value="5">5% (Below ₹1000)</option>
                  <option value="12">12% (Standard Apparel)</option>
                  <option value="18">18% (Specialty)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1 uppercase tracking-wider">
                  HSN Code
                </label>
                <input
                  type="text"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  placeholder="620342"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs font-mono text-text focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Live COGS & Profit Margin Breakdown */}
            <div className="p-4 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-text">
                <span className="flex items-center gap-1.5 text-primary">
                  <TrendingUp className="w-4 h-4" />
                  Unit Economics & Landed Cost Breakdown:
                </span>
                <span className="font-mono text-xs">
                  Factory Landed Cost: <strong className="text-text">₹{landedMfgCost.toFixed(2)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-3xs font-mono">
                <div className="p-2 bg-white rounded-lg border border-[#CFE0D5]">
                  <span className="text-muted block">BOM Raw Material</span>
                  <span className="font-bold text-text">₹{bomRawCost.toFixed(2)}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-[#CFE0D5]">
                  <span className="text-muted block">CMT Labor Rate</span>
                  <span className="font-bold text-text">₹{laborCost.toFixed(2)}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-[#CFE0D5]">
                  <span className="text-muted block">Factory Overheads</span>
                  <span className="font-bold text-text">₹{overheadCost.toFixed(2)}</span>
                </div>
                <div
                  className={`p-2 rounded-lg border ${
                    isLossMaking
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <span className="block opacity-80">Gross Profit Margin</span>
                  <span className="font-bold">
                    ₹{grossProfit.toFixed(0)} ({marginPct}%)
                  </span>
                </div>
              </div>

              {isLossMaking && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    <strong>Margin Warning:</strong> Base Selling Price (₹{currentPrice}) is below factory manufacturing cost (₹{landedMfgCost.toFixed(2)}). Selling this style will result in a loss of ₹{Math.abs(grossProfit).toFixed(0)} per piece.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Variants Matrix Builder Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#CFE0D5] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#CFE0D5] pb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                  Inventory & Size Variants ({variants.length})
                </h2>
                <p className="text-3xs text-muted">
                  Total Finished Stock Available: <strong>{totalStockQty} pcs</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateStandardDenimSizes}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E3EFE7] text-primary text-3xs font-bold hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto 28–38 Sizes</span>
                </button>
                <button
                  type="button"
                  onClick={addVariantRow}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-3xs font-bold hover:bg-primary-hover transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase">
                    <th className="py-2.5 px-3">Waist Size</th>
                    <th className="py-2.5 px-3">Fit</th>
                    <th className="py-2.5 px-3">Wash</th>
                    <th className="py-2.5 px-3">Stock Units</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CFE0D5]">
                  {variants.map((v, idx) => (
                    <tr key={idx} className="hover:bg-[#F0F7F2]/50 transition-colors">
                      <td className="py-2 px-3">
                        <select
                          value={v.size}
                          onChange={(e) => updateVariant(idx, 'size', e.target.value)}
                          className="px-2 py-1 rounded-lg border border-[#CFE0D5] text-xs font-mono font-bold"
                        >
                          {['28', '30', '32', '34', '36', '38', '40', 'S', 'M', 'L', 'XL', 'XXL'].map(
                            (sz) => (
                              <option key={sz} value={sz}>
                                {sz}
                              </option>
                            )
                          )}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={v.fit}
                          onChange={(e) => updateVariant(idx, 'fit', e.target.value)}
                          placeholder="Regular"
                          className="w-24 px-2 py-1 rounded-lg border border-[#CFE0D5] text-xs font-medium"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={v.wash}
                          onChange={(e) => updateVariant(idx, 'wash', e.target.value)}
                          placeholder="Raw Indigo"
                          className="w-28 px-2 py-1 rounded-lg border border-[#CFE0D5] text-xs font-medium"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          value={v.stock_qty}
                          onChange={(e) => updateVariant(idx, 'stock_qty', e.target.value)}
                          className="w-20 px-2 py-1 rounded-lg border border-[#CFE0D5] text-xs font-mono font-bold"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                          placeholder="AUTO"
                          className="w-32 px-2 py-1 rounded-lg border border-[#CFE0D5] text-3xs font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Media, Publishing Status, SEO */}
        <div className="space-y-6">
          {/* Status & Visibility Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#CFE0D5] shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-[#CFE0D5] pb-2">
              Visibility & Publishing
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-text block">Active in Storefront</span>
                  <span className="text-3xs text-muted">
                    {isActive ? 'Visible to all customers & indexed' : 'Draft / Staff preview only'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary accent-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-text block">Featured Collection</span>
                  <span className="text-3xs text-muted">Displayed on Homepage Hero</span>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary accent-primary"
                />
              </label>
            </div>
          </div>

          {/* Supabase Storage Media Picker Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#CFE0D5] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#CFE0D5] pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                Product Images ({images.length})
              </h2>
              {images.length === 0 && (
                <span className="text-3xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  Photos Required
                </span>
              )}
            </div>

            <MultiImageUploadPicker
              bucket="product-images"
              folder="catalog"
              images={images}
              onChange={setImages}
              maxImages={6}
            />
          </div>

          {/* Search Engine Optimization */}
          <div className="bg-white rounded-2xl p-6 border border-[#CFE0D5] shadow-xs space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-[#CFE0D5] pb-2">
              SEO Metadata
            </h2>

            <div>
              <label className="block text-xs font-bold text-text mb-1 uppercase tracking-wider">
                Meta Title
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Buy Heavyweight Selvedge Jeans | TOLAND"
                className="w-full px-3.5 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs text-text focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text mb-1 uppercase tracking-wider">
                Meta Description
              </label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Direct factory denim manufactured in Sheikhpura, Bihar..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs text-text focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
