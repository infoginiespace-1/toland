'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Scissors,
  Sparkles,
  Droplets,
  CheckCircle2,
  Package,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Layers,
  FileText,
  Printer,
  Ban,
  QrCode,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  is_active?: boolean;
  base_price?: number;
  mrp?: number;
  images?: Array<{ id: string; path: string }>;
}

interface QcInspectionRecord {
  id: string;
  qc_no: string;
  status: 'passed' | 'rework' | 'failed';
  pass_qty?: number;
  rework_qty?: number;
  reject_qty?: number;
  production_order_id?: string;
  inspection_type?: string;
}

interface Variant {
  id: string;
  product_id: string;
  size: string;
  fit: string | null;
  wash: string | null;
  sku: string;
  stock_qty?: number;
}

interface BomRequirement {
  id: string;
  product_id: string;
  raw_material_id: string;
  qty_per_piece: number;
  scrap_percent?: number;
  raw_material?: {
    id: string;
    name: string;
    unit: string;
    stock_qty: number;
  };
}

interface ProductionStage {
  id: string;
  production_order_id: string;
  stage: 'cutting' | 'stitching' | 'washing' | 'finishing' | 'packing';
  qty_in: number;
  qty_out: number;
  wastage: number;
  assigned_to: string | null;
  started_at: string | null;
  ended_at: string | null;
}

interface SizeAllocation {
  variant_id: string;
  size: string;
  sku: string;
  planned_qty: number;
  completed_qty?: number;
}

interface ProductionOrder {
  id: string;
  order_no: string;
  product_id: string;
  variant_id: string | null;
  planned_qty: number;
  completed_qty: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  size_allocations?: SizeAllocation[];
  allow_shortfall?: boolean;
  notes: string | null;
  created_at: string;
  product?: Product;
  variant?: Variant;
  stages?: ProductionStage[];
}

const STAGE_CONFIG: Array<{
  key: 'cutting' | 'stitching' | 'washing' | 'finishing' | 'packing';
  label: string;
  icon: React.ElementType;
  desc: string;
}> = [
  { key: 'cutting', label: '1. Cutting', icon: Scissors, desc: 'Fabric laying & marker cutting' },
  { key: 'stitching', label: '2. Stitching', icon: Sparkles, desc: '5-thread overlock & assembly' },
  { key: 'washing', label: '3. Washing', icon: Droplets, desc: 'Enzyme stone wash & fading' },
  { key: 'finishing', label: '4. Finishing', icon: CheckCircle2, desc: 'Rivets, shank button & ironing' },
  { key: 'packing', label: '5. Packing', icon: Package, desc: 'Tagging & 50-pcs carton boxing' },
];

export function ProductionManager({
  productionOrders,
  products,
  variants,
  boms = [],
  qcInspections = [],
  initialProductId,
  initialVariantId,
}: {
  productionOrders: ProductionOrder[];
  products: Product[];
  variants: Variant[];
  boms?: BomRequirement[];
  qcInspections?: QcInspectionRecord[];
  initialProductId?: string;
  initialVariantId?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [productId, setProductId] = useState(initialProductId || products[0]?.id || '');
  const [variantId, setVariantId] = useState(initialVariantId || '');
  const [multiSizeMode, setMultiSizeMode] = useState(false);
  const [sizeQtyMap, setSizeQtyMap] = useState<Record<string, string>>({});
  const [plannedQty, setPlannedQty] = useState('100');
  const [allowShortfall, setAllowShortfall] = useState(false);
  const [notes, setNotes] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<ProductionOrder | null>(null);
  const [activeStage, setActiveStage] = useState<ProductionStage | null>(null);
  const [qtyOut, setQtyOut] = useState('');
  const [wastage, setWastage] = useState('0');
  const [assignedTo, setAssignedTo] = useState('');
  const [markComplete, setMarkComplete] = useState(true);
  const [completedSizeMap, setCompletedSizeMap] = useState<Record<string, string>>({});
  const [stageLoading, setStageLoading] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);
  const [overrideQcGate, setOverrideQcGate] = useState(false);

  const [publishingId, setPublishingId] = useState<string | null>(null);

  const handleToggleProductActive = async (targetProductId: string, nextActive: boolean) => {
    try {
      setPublishingId(targetProductId);
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetProductId,
          is_active: nextActive,
          action: 'toggle_active',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update storefront visibility');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Error updating storefront visibility');
    } finally {
      setPublishingId(null);
    }
  };

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [printBatch, setPrintBatch] = useState<ProductionOrder | null>(null);
  const [pcsPerCarton, setPcsPerCarton] = useState('50');

  useEffect(() => {
    if (initialProductId || initialVariantId) {
      if (initialProductId) setProductId(initialProductId);
      if (initialVariantId) setVariantId(initialVariantId);
      setCreateModalOpen(true);
    }
  }, [initialProductId, initialVariantId]);

  const availableVariants = variants.filter((v) => v.product_id === productId);
  const productBoms = boms.filter((b) => b.product_id === productId);

  const effectiveRatioQty = multiSizeMode
    ? availableVariants.reduce((sum, v) => sum + Math.max(0, Number(sizeQtyMap[v.id] || 0)), 0)
    : Number(plannedQty || 0);

  const bomRequirements = productBoms.map((b) => {
    const scrapMult = 1 + Number(b.scrap_percent || 0) / 100;
    const needed = Math.round(Number(b.qty_per_piece || 0) * scrapMult * effectiveRatioQty * 1000) / 1000;
    const available = Number(b.raw_material?.stock_qty || 0);
    return {
      ...b,
      needed,
      available,
      hasShortfall: available < needed - 0.0001,
    };
  });
  const anyShortfall = bomRequirements.some((r) => r.hasShortfall);

  const filteredOrders = productionOrders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      o.order_no.toLowerCase().includes(q) ||
      (o.product?.name || '').toLowerCase().includes(q) ||
      (o.variant?.sku || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const inProgressOrders = productionOrders.filter((o) => o.status === 'in_progress');
  const completedOrders = productionOrders.filter((o) => o.status === 'completed');
  const totalGarmentsInProgress = inProgressOrders.reduce((sum, o) => sum + o.planned_qty, 0);
  const totalGarmentsCompleted = completedOrders.reduce(
    (sum, o) => sum + (o.completed_qty || o.planned_qty),
    0
  );

  const handleOpenCreateModal = () => {
    setCreateError(null);
    const defaultPid = productId || products[0]?.id || '';
    setProductId(defaultPid);
    setVariantId('');
    setMultiSizeMode(false);
    setSizeQtyMap({});
    setPlannedQty('100');
    setAllowShortfall(false);
    setNotes('');
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const sizeAllocations = multiSizeMode
        ? availableVariants
            .filter((v) => Number(sizeQtyMap[v.id] || 0) > 0)
            .map((v) => ({
              variant_id: v.id,
              size: v.size,
              sku: v.sku,
              planned_qty: Math.round(Number(sizeQtyMap[v.id])),
            }))
        : undefined;

      if (multiSizeMode && (!sizeAllocations || sizeAllocations.length === 0)) {
        throw new Error('Enter planned pieces for at least one size in Multi-Size Ratio mode.');
      }

      const res = await fetch('/api/admin/erp/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          variant_id: multiSizeMode ? null : variantId || null,
          planned_qty: multiSizeMode ? effectiveRatioQty : Number(plannedQty),
          size_allocations: sizeAllocations,
          allow_shortfall: allowShortfall,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start production batch');

      setCreateModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setCreateError(err?.message || 'Error starting production');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenStageModal = (order: ProductionOrder, stage: ProductionStage) => {
    setStageError(null);
    setOverrideQcGate(false);
    setActiveOrder(order);
    setActiveStage(stage);
    setQtyOut(String(stage.qty_out || stage.qty_in || 0));
    setWastage(String(stage.wastage || 0));
    setAssignedTo(stage.assigned_to || '');
    setMarkComplete(true);

    if (stage.stage === 'packing' && order.size_allocations && order.size_allocations.length > 0) {
      const initMap: Record<string, string> = {};
      order.size_allocations.forEach((a) => {
        initMap[a.variant_id] = String(a.completed_qty ?? a.planned_qty ?? 0);
      });
      setCompletedSizeMap(initMap);
    } else {
      setCompletedSizeMap({});
    }

    setStageModalOpen(true);
  };

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !activeStage) return;

    setStageLoading(true);
    setStageError(null);

    try {
      const completedSizeAllocs =
        activeStage.stage === 'packing' &&
        activeOrder.size_allocations &&
        activeOrder.size_allocations.length > 0
          ? activeOrder.size_allocations.map((a) => ({
              variant_id: a.variant_id,
              completed_qty: Number(completedSizeMap[a.variant_id] ?? a.planned_qty ?? 0),
            }))
          : undefined;

      const finalOut = completedSizeAllocs
        ? completedSizeAllocs.reduce((s, a) => s + a.completed_qty, 0)
        : Number(qtyOut || 0);

      const res = await fetch('/api/admin/erp/production', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_id: activeStage.id,
          production_order_id: activeOrder.id,
          qty_out: finalOut,
          wastage: Number(wastage || 0),
          assigned_to: assignedTo,
          mark_stage_complete: markComplete,
          completed_size_allocations: completedSizeAllocs,
          override_qc_gate: overrideQcGate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update manufacturing stage');

      setStageModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setStageError(err?.message || 'Error updating stage');
    } finally {
      setStageLoading(false);
    }
  };

  const handleCancelBatch = async (order: ProductionOrder) => {
    const reason = prompt(
      `Cancel batch ${order.order_no}? All BOM-deducted raw materials will be reversed back to stock.\nEnter reason (optional):`
    );
    if (reason === null) return;
    setCancellingId(order.id);
    try {
      const res = await fetch('/api/admin/erp/production', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          production_order_id: order.id,
          cancel_reason: reason || 'Cancelled from Production Floor',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel batch');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Cancel failed');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14532D]">Production Runs & 5-Stage Tracker</h1>
          <p className="text-sm text-gray-600 mt-1">
            Multi-size ratio cutting, BOM pre-flight validation, batch reversal & carton packing slip print.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-sm font-medium transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          New Production Batch
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Active Batches
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#14532D] mt-2">{inProgressOrders.length}</p>
          <span className="text-xs text-gray-500 mt-1 block">In production pipeline</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Garments In Flow
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#228B22]">
              <Scissors className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {totalGarmentsInProgress.toLocaleString()} pcs
          </p>
          <span className="text-xs text-gray-500 mt-1 block">Planned manufacturing volume</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Completed Batches
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#14532D] mt-2">{completedOrders.length}</p>
          <span className="text-xs text-emerald-600 font-medium mt-1 block">
            {totalGarmentsCompleted.toLocaleString()} pcs boxed
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Sheikhpura Factory
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-2">Khetalpura Unit</p>
          <span className="text-xs text-gray-500 mt-1 block">Barbigha, Bihar 811101</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-[#CFE0D5] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'all', label: `All (${productionOrders.length})` },
            { key: 'in_progress', label: `In Progress (${inProgressOrders.length})` },
            { key: 'completed', label: `Completed (${completedOrders.length})` },
            {
              key: 'cancelled',
              label: `Cancelled (${productionOrders.filter((o) => o.status === 'cancelled').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === tab.key
                  ? 'bg-[#14532D] text-white shadow-sm'
                  : 'bg-[#F0F7F2] text-gray-700 hover:bg-[#E3EFE7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Batch #, Product or SKU..."
          className="px-3.5 py-1.5 text-xs rounded-lg border border-[#CFE0D5] bg-[#F0F7F2]/40 focus:outline-none focus:ring-1 focus:ring-[#14532D] w-full md:w-72"
        />
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-[#CFE0D5] text-center">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800">No production batches found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {search
              ? 'Try adjusting your search criteria.'
              : 'Create your first production run to track garment manufacturing.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const stages = order.stages || [];
            const stageOrderMap: Record<string, number> = {
              cutting: 0,
              stitching: 1,
              washing: 2,
              finishing: 3,
              packing: 4,
            };
            const sortedStages = [...stages].sort(
              (a, b) => (stageOrderMap[a.stage] ?? 99) - (stageOrderMap[b.stage] ?? 99)
            );

            const firstStageIn = sortedStages[0]?.qty_in || order.planned_qty || 1;
            const finalStageOut = sortedStages[sortedStages.length - 1]?.qty_out || 0;
            const totalWastage = sortedStages.reduce((sum, s) => sum + (s.wastage || 0), 0);
            const yieldPct = Math.round((finalStageOut / firstStageIn) * 100);
            const isCancelled = order.status === 'cancelled';

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-[#CFE0D5] shadow-sm overflow-hidden"
              >
                <div className="p-5 border-b border-[#CFE0D5] bg-[#F0F7F2]/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-[#14532D] bg-[#E3EFE7] px-2.5 py-1 rounded">
                        {order.order_no}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                          order.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : isCancelled
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status === 'in_progress' ? 'In Production' : order.status}
                      </span>
                      {order.status === 'completed' && (
                        <span className="text-[11px] font-mono text-emerald-700 font-bold">
                          Yield: {yieldPct}%
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-700 pt-1">
                      <span className="font-semibold text-gray-900">
                        {order.product?.name || 'Toland Denim Garment'}
                      </span>
                      {order.size_allocations && order.size_allocations.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {order.size_allocations.map((sa, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-[#CFE0D5] text-gray-700"
                            >
                              Sz {sa.size}: <strong>{sa.planned_qty}</strong>
                              {order.status === 'completed' && sa.completed_qty !== undefined
                                ? ` (${sa.completed_qty} ok)`
                                : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        order.variant && (
                          <span className="text-gray-500 text-xs bg-white px-2 py-0.5 rounded border border-[#CFE0D5]">
                            Size: {order.variant.size} {order.variant.fit ? `• ${order.variant.fit}` : ''}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block">Planned</span>
                      <span className="font-bold text-gray-900">{order.planned_qty} pcs</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Packed</span>
                      <span className="font-bold text-[#14532D]">
                        {order.status === 'completed'
                          ? `${order.completed_qty} pcs`
                          : `${finalStageOut} pcs`}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Scrap</span>
                      <span className="font-bold text-rose-600">{totalWastage} pcs</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPrintBatch(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CFE0D5] bg-white text-xs font-semibold text-[#14532D] hover:bg-[#E3EFE7] transition"
                        title="Master Carton Packing Slip & SKU Labels"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Carton & Labels</span>
                      </button>

                      {order.status !== 'completed' && !isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleCancelBatch(order)}
                          disabled={cancellingId === order.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                          title="Cancel Batch & Reverse BOM Stock"
                        >
                          {cancellingId === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Ban className="w-3.5 h-3.5" />
                          )}
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {STAGE_CONFIG.map((conf, idx) => {
                      const stageRecord = sortedStages.find((s) => s.stage === conf.key);
                      const isDone = Boolean(stageRecord && stageRecord.qty_out > 0);
                      const isCurrent = Boolean(
                        stageRecord && stageRecord.qty_in > 0 && stageRecord.qty_out === 0
                      );

                      return (
                        <div
                          key={conf.key}
                          className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                            isDone
                              ? 'bg-[#F0F7F2] border-[#228B22]/30'
                              : isCurrent
                              ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300'
                              : 'bg-gray-50 border-gray-200 opacity-70'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                  isDone
                                    ? 'bg-[#14532D] text-white'
                                    : isCurrent
                                    ? 'bg-blue-600 text-white animate-pulse'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isCurrent
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {isDone ? 'Finished' : isCurrent ? 'In Progress' : 'Pending'}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-gray-900">{conf.label.slice(3)}</p>
                            <p className="text-[11px] text-gray-500">{conf.desc}</p>

                            <div className="mt-3 pt-2.5 border-t border-gray-200/80 space-y-1 text-xs">
                              <div className="flex justify-between text-gray-600">
                                <span>In:</span>
                                <span className="font-semibold text-gray-900">
                                  {stageRecord?.qty_in || 0}
                                </span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>Out:</span>
                                <span className="font-semibold text-[#14532D]">
                                  {stageRecord?.qty_out || 0}
                                </span>
                              </div>
                              <div className="flex justify-between text-rose-600 text-[11px]">
                                <span>Scrap / Waste:</span>
                                <span>{stageRecord?.wastage || 0}</span>
                              </div>
                              {stageRecord?.assigned_to && (
                                <p className="text-[10px] text-gray-500 pt-1 truncate">
                                  Op: {stageRecord.assigned_to}
                                </p>
                              )}
                            </div>
                          </div>

                          {stageRecord && order.status !== 'completed' && !isCancelled && (
                            <button
                              onClick={() => handleOpenStageModal(order, stageRecord)}
                              className={`mt-3 w-full py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition ${
                                isCurrent
                                  ? 'bg-[#14532D] text-white hover:bg-[#14532D]/90'
                                  : 'bg-white border border-[#CFE0D5] text-[#14532D] hover:bg-[#F0F7F2]'
                              }`}
                            >
                              Update Stage
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {order.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 flex items-start gap-2 border border-gray-200">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="whitespace-pre-line">{order.notes}</span>
                    </div>
                  )}

                  {/* Storefront Readiness & 1-Click Publishing Banner */}
                  <div className="mt-4 p-4 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                        <Package className="w-4 h-4 text-[#14532D]" />
                        <span>Finished Ready:</span>
                        <span className="font-mono text-[#14532D] font-black">
                          {order.completed_qty || 0} pcs
                        </span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <span>Photos:</span>
                        <span className="font-mono font-bold">
                          {order.product?.images?.length || 0} uploaded
                        </span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-700">Storefront:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            order.product?.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.product?.is_active ? 'Live on Storefront' : 'Draft / Hidden'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.product?.is_active ? (
                        <>
                          {order.product?.slug && (
                            <Link
                              href={`/products/${order.product.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#CFE0D5] text-xs font-bold text-[#14532D] hover:bg-[#E3EFE7] transition shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Live Storefront</span>
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleProductActive(order.product_id, false)}
                            disabled={publishingId === order.product_id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-xs font-bold text-amber-800 hover:bg-amber-100 transition disabled:opacity-50"
                          >
                            {publishingId === order.product_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <span>Set to Draft</span>
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleProductActive(order.product_id, true)}
                          disabled={publishingId === order.product_id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#14532D] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#14532D]/90 transition shadow-xs disabled:opacity-50"
                        >
                          {publishingId === order.product_id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          <span>1-Click Publish to Storefront</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE BATCH MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#CFE0D5] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">New Production Batch</h3>
                  <p className="text-xs text-gray-500">
                    Multi-size ratio cut & live BOM stock verification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Product *
                </label>
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setVariantId('');
                    setSizeQtyMap({});
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {availableVariants.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      Size Selection Mode
                    </label>
                    <button
                      type="button"
                      onClick={() => setMultiSizeMode(!multiSizeMode)}
                      className="text-xs font-bold text-[#14532D] underline"
                    >
                      {multiSizeMode
                        ? 'Switch to Single Size Run'
                        : 'Use Multi-Size Ratio Cut (28-36)'}
                    </button>
                  </div>

                  {!multiSizeMode ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={variantId}
                        onChange={(e) => setVariantId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#CFE0D5]"
                      >
                        <option value="">Unassigned / Standard run</option>
                        {availableVariants.map((v) => (
                          <option key={v.id} value={v.id}>
                            Size {v.size} {v.fit ? `(${v.fit})` : ''} [Stock: {v.stock_qty ?? 0}]
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={plannedQty}
                        onChange={(e) => setPlannedQty(e.target.value)}
                        placeholder="Planned Pcs"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#CFE0D5] font-mono font-bold"
                        required
                      />
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#F0F7F2]/60 border border-[#CFE0D5] space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableVariants.map((v) => (
                          <div
                            key={v.id}
                            className="p-2 rounded-lg bg-white border border-[#CFE0D5] text-xs"
                          >
                            <div className="flex justify-between font-bold text-gray-800 mb-1">
                              <span>Sz {v.size}</span>
                              <span className="text-[10px] font-mono text-gray-400">
                                Cur:{v.stock_qty ?? 0}
                              </span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={sizeQtyMap[v.id] || ''}
                              onChange={(e) =>
                                setSizeQtyMap((prev) => ({ ...prev, [v.id]: e.target.value }))
                              }
                              className="w-full px-2 py-1 rounded border border-[#CFE0D5] font-mono font-bold text-right"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="text-right text-xs font-bold text-[#14532D]">
                        Total Ratio Cut: {effectiveRatioQty} pcs
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Live BOM Requirement Preview */}
              {bomRequirements.length > 0 && effectiveRatioQty > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-slate-600 block">
                    Live BOM Material Requirement ({effectiveRatioQty} pcs w/ Scrap %)
                  </span>
                  {bomRequirements.map((r) => (
                    <div key={r.id} className="flex justify-between items-center">
                      <span className="text-slate-700 truncate max-w-[55%]">
                        {r.raw_material?.name}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          r.hasShortfall ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        Need {r.needed} / Avail {r.available} {r.raw_material?.unit}
                      </span>
                    </div>
                  ))}
                  {anyShortfall && (
                    <label className="flex items-center gap-2 pt-2 border-t border-slate-200 text-rose-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowShortfall}
                        onChange={(e) => setAllowShortfall(e.target.checked)}
                        className="rounded border-rose-300"
                      />
                      <span>Override shortfall check (Proceed with available partial materials)</span>
                    </label>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Batch Notes / Work Order Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 14oz Selvedge Denim, double needle stitching, antique brass rivets..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#CFE0D5]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || (anyShortfall && !allowShortfall)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-xs font-medium transition disabled:opacity-50"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Launch Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STAGE MODAL */}
      {stageModalOpen && activeOrder && activeStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CFE0D5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div>
                <span className="text-xs font-mono text-[#14532D] font-bold">
                  {activeOrder.order_no}
                </span>
                <h3 className="text-base font-bold text-gray-900 capitalize">
                  Update {activeStage.stage} Stage
                </h3>
              </div>
              <button
                onClick={() => setStageModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {stageError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{stageError}</span>
              </div>
            )}

            <form onSubmit={handleStageSubmit} className="mt-4 space-y-4">
              <div className="bg-[#F0F7F2] p-3 rounded-lg text-xs text-gray-700 flex justify-between items-center">
                <span>Input Quantity Received:</span>
                <span className="font-bold text-gray-900">{activeStage.qty_in} pcs</span>
              </div>

              {activeStage.stage === 'packing' &&
              activeOrder.size_allocations &&
              activeOrder.size_allocations.length > 0 ? (
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
                  <span className="font-bold text-emerald-900 block">
                    Size-Wise Finished Stock Credit (Boxes Ready):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {activeOrder.size_allocations.map((a) => (
                      <div
                        key={a.variant_id}
                        className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-emerald-200"
                      >
                        <span className="font-bold">Sz {a.size}</span>
                        <input
                          type="number"
                          min="0"
                          value={completedSizeMap[a.variant_id] ?? String(a.planned_qty)}
                          onChange={(e) =>
                            setCompletedSizeMap((prev) => ({
                              ...prev,
                              [a.variant_id]: e.target.value,
                            }))
                          }
                          className="w-16 px-1.5 py-0.5 rounded border border-emerald-300 font-mono font-bold text-right"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Output Quantity (Passed QA) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={activeStage.qty_in}
                    value={qtyOut}
                    onChange={(e) => setQtyOut(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5]"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Wastage / Scrap Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={wastage}
                  onChange={(e) => setWastage(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assigned Line / Operator / Department
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="e.g. Masterji Cutting Dept, Stitching Line B"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5]"
                />
              </div>

              {activeStage.stage === 'packing' && (() => {
                const batchQcs = qcInspections.filter(
                  (q) => q.production_order_id === activeOrder.id
                );
                const hasPassed = batchQcs.some(
                  (q) => q.status === 'passed' && Number(q.pass_qty || 0) > 0
                );

                return (
                  <div className="p-3.5 rounded-xl border text-xs space-y-2 bg-amber-50/70 border-amber-200 text-amber-900">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        Mandatory AQL Packing QC Gate
                      </span>
                      <Link
                        href="/admin/erp/qc"
                        target="_blank"
                        className="text-[11px] text-[#14532D] underline inline-flex items-center gap-0.5"
                      >
                        <span>Open QC Lab</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    {hasPassed ? (
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>AQL Packing QC Passed: Ready to box and credit finished inventory.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-amber-800 text-[11px]">
                          No passed final garment QC inspection recorded for this batch ({activeOrder.order_no}). Packing uninspected pieces may result in customer quality complaints.
                        </p>
                        <label className="flex items-center gap-2 pt-1 text-amber-950 font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={overrideQcGate}
                            onChange={(e) => setOverrideQcGate(e.target.checked)}
                            className="w-4 h-4 rounded text-[#14532D] focus:ring-[#14532D] accent-[#14532D]"
                          />
                          <span>Override QC Gate (Approved by Production Floor Manager)</span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="markComplete"
                  checked={markComplete}
                  onChange={(e) => setMarkComplete(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CFE0D5] text-[#14532D]"
                />
                <label htmlFor="markComplete" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Mark stage complete and push output to next stage
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#CFE0D5]">
                <button
                  type="button"
                  onClick={() => setStageModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stageLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-xs font-medium transition disabled:opacity-50"
                >
                  {stageLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Stage Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CARTON PACKING SLIP & BARCODE STICKER PRINT MODAL */}
      {printBatch && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto print:bg-white print:p-0">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-[#CFE0D5] space-y-6 print:shadow-none print:border-none print:max-w-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 uppercase">
                  Master Carton Slip & Barcode Stickers
                </span>
                <select
                  value={pcsPerCarton}
                  onChange={(e) => setPcsPerCarton(e.target.value)}
                  className="px-2 py-1 rounded border border-slate-300 text-xs font-mono"
                >
                  <option value="25">25 pcs / Carton</option>
                  <option value="50">50 pcs / Carton</option>
                  <option value="100">100 pcs / Bale</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#14532D] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintBatch(null)}
                  className="p-2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">TOLAND PACKING & DISPATCH SLIP</h2>
                <p className="text-xs text-slate-600">
                  Khetalpura Denim Manufacturing Unit, Barbigha, Bihar
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono font-black text-base text-[#14532D]">
                  {printBatch.order_no}
                </div>
                <div className="text-xs text-slate-600">
                  Total Lot: {printBatch.completed_qty || printBatch.planned_qty} pcs ·{' '}
                  {Math.max(
                    1,
                    Math.ceil(
                      (printBatch.completed_qty || printBatch.planned_qty) /
                        Math.max(1, Number(pcsPerCarton || 50))
                    )
                  )}{' '}
                  Cartons (@{pcsPerCarton}/box)
                </div>
              </div>
            </div>

            <div className="text-xs space-y-2">
              <div className="font-bold text-slate-800">
                Style: {printBatch.product?.name || 'Toland Garment'}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {(printBatch.size_allocations && printBatch.size_allocations.length > 0
                  ? printBatch.size_allocations
                  : printBatch.variant
                  ? [
                      {
                        variant_id: printBatch.variant.id,
                        size: printBatch.variant.size,
                        sku: printBatch.variant.sku,
                        planned_qty: printBatch.planned_qty,
                        completed_qty: printBatch.completed_qty || printBatch.planned_qty,
                      },
                    ]
                  : [
                      {
                        variant_id: 'std',
                        size: 'Assorted',
                        sku: printBatch.product?.slug?.toUpperCase() || printBatch.order_no,
                        planned_qty: printBatch.planned_qty,
                        completed_qty: printBatch.completed_qty || printBatch.planned_qty,
                      },
                    ]
                ).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border-2 border-dashed border-slate-400 bg-slate-50/50 space-y-1"
                  >
                    <div className="flex justify-between font-black text-slate-900">
                      <span>SIZE: {item.size}</span>
                      <span>{item.completed_qty || item.planned_qty} PCS</span>
                    </div>
                    <div className="font-mono text-[10px] tracking-widest text-slate-700 border-y border-slate-300 py-1 text-center bg-white">
                      |||| |||| |||| {item.sku || printBatch.order_no}
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>{printBatch.order_no}</span>
                      <span>QC PASS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
