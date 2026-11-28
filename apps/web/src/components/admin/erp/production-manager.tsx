'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Plus,
  Scissors,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Package,
  Sparkles,
  User,
  ArrowRight,
  Loader2,
  X,
  FileText,
} from 'lucide-react';

interface StageRecord {
  id: string;
  production_order_id: string;
  stage: 'cutting' | 'stitching' | 'washing' | 'finishing' | 'packing';
  qty_in: number;
  qty_out: number;
  wastage: number;
  assigned_to?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
}

interface ProductionOrder {
  id: string;
  order_no: string;
  product_id: string;
  variant_id?: string | null;
  planned_qty: number;
  completed_qty: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string | null;
  created_at: string;
  product?: { id: string; name: string; slug: string } | null;
  variant?: { id: string; size: string; fit?: string; wash?: string; sku?: string } | null;
  stages?: StageRecord[];
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
}

interface VariantItem {
  id: string;
  product_id: string;
  size: string;
  fit?: string | null;
  wash?: string | null;
  sku?: string | null;
}

interface ProductionManagerProps {
  productionOrders: ProductionOrder[];
  products: ProductItem[];
  variants: VariantItem[];
}

const STAGE_CONFIG = [
  { key: 'cutting', label: '1. Cutting', icon: Scissors, desc: 'Fabric Lay & Pattern Cut' },
  { key: 'stitching', label: '2. Stitching', icon: Layers, desc: 'Assembly & Seams' },
  { key: 'washing', label: '3. Washing', icon: Sparkles, desc: 'Enzyme / Stone Wash' },
  { key: 'finishing', label: '4. Finishing', icon: TrendingUp, desc: 'Rivets, Buttons & QA' },
  { key: 'packing', label: '5. Packing', icon: Package, desc: 'Poly-Mailer & Boxing' },
];

export function ProductionManager({
  productionOrders,
  products,
  variants,
}: ProductionManagerProps) {
  const router = useRouter();

  // Create Batch Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [plannedQty, setPlannedQty] = useState('500');
  const [notes, setNotes] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Update Stage Modal
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<ProductionOrder | null>(null);
  const [activeStage, setActiveStage] = useState<StageRecord | null>(null);
  const [qtyOut, setQtyOut] = useState('');
  const [wastage, setWastage] = useState('0');
  const [assignedTo, setAssignedTo] = useState('');
  const [markComplete, setMarkComplete] = useState(true);
  const [stageLoading, setStageLoading] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');

  // Stats calculation
  const totalOrders = productionOrders.length;
  const inProgressOrders = productionOrders.filter((o) => o.status === 'in_progress');
  const completedOrders = productionOrders.filter((o) => o.status === 'completed');
  const totalGarmentsInProgress = inProgressOrders.reduce((sum, o) => sum + (o.planned_qty || 0), 0);
  const totalGarmentsCompleted = completedOrders.reduce((sum, o) => sum + (o.completed_qty || 0), 0);

  const filteredOrders = productionOrders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchNo = o.order_no?.toLowerCase().includes(q);
      const matchProd = o.product?.name?.toLowerCase().includes(q);
      const matchSku = o.variant?.sku?.toLowerCase().includes(q);
      if (!matchNo && !matchProd && !matchSku) return false;
    }
    return true;
  });

  const availableVariants = variants.filter((v) => v.product_id === productId);

  const handleOpenCreateModal = () => {
    setProductId(products[0]?.id || '');
    setVariantId('');
    setPlannedQty('500');
    setNotes('');
    setCreateError(null);
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setCreateError('Please select a target product');
      return;
    }
    if (!plannedQty || Number(plannedQty) <= 0) {
      setCreateError('Planned quantity must be greater than 0');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      const res = await fetch('/api/admin/erp/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          variant_id: variantId || null,
          planned_qty: Number(plannedQty),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize production batch');

      setCreateModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setCreateError(err?.message || 'Error creating production batch');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenStageModal = (order: ProductionOrder, stage: StageRecord) => {
    setActiveOrder(order);
    setActiveStage(stage);
    setQtyOut(stage.qty_out > 0 ? String(stage.qty_out) : String(stage.qty_in));
    setWastage(String(stage.wastage || 0));
    setAssignedTo(stage.assigned_to || '');
    setMarkComplete(true);
    setStageError(null);
    setStageModalOpen(true);
  };

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !activeStage) return;

    try {
      setStageLoading(true);
      setStageError(null);

      const res = await fetch('/api/admin/erp/production', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_id: activeStage.id,
          production_order_id: activeOrder.id,
          qty_out: Number(qtyOut || 0),
          wastage: Number(wastage || 0),
          assigned_to: assignedTo,
          mark_stage_complete: markComplete,
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14532D]">Production Runs & 5-Stage Tracker</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manufacturing workflow: Cutting &rarr; Stitching &rarr; Washing &rarr; Finishing &rarr; Packing with yield & scrap metrics.
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
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Batches</span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#14532D] mt-2">{inProgressOrders.length}</p>
          <span className="text-xs text-gray-500 mt-1 block">In production pipeline</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Garments In Flow</span>
            <div className="w-9 h-9 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#228B22]">
              <Scissors className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalGarmentsInProgress.toLocaleString()} pcs</p>
          <span className="text-xs text-gray-500 mt-1 block">Planned manufacturing volume</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#CFE0D5] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Completed Batches</span>
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
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sheikhpura Factory</span>
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              statusFilter === 'all'
                ? 'bg-[#14532D] text-white shadow-sm'
                : 'bg-[#F0F7F2] text-gray-700 hover:bg-[#E3EFE7]'
            }`}
          >
            All Batches ({totalOrders})
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              statusFilter === 'in_progress'
                ? 'bg-[#14532D] text-white shadow-sm'
                : 'bg-[#F0F7F2] text-gray-700 hover:bg-[#E3EFE7]'
            }`}
          >
            In Progress ({inProgressOrders.length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              statusFilter === 'completed'
                ? 'bg-[#14532D] text-white shadow-sm'
                : 'bg-[#F0F7F2] text-gray-700 hover:bg-[#E3EFE7]'
            }`}
          >
            Completed ({completedOrders.length})
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Batch #, Product or SKU..."
          className="px-3.5 py-1.5 text-xs rounded-lg border border-[#CFE0D5] bg-[#F0F7F2]/40 focus:outline-none focus:ring-1 focus:ring-[#14532D] w-full md:w-72"
        />
      </div>

      {/* Batches Flow Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-[#CFE0D5] text-center">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800">No production batches found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria.' : 'Create your first production run to track garment manufacturing.'}
          </p>
          {!search && (
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Create Production Batch
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const stages = order.stages || [];
            // Sort stages by fixed order
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

            // Compute overall yield %
            const firstStageIn = sortedStages[0]?.qty_in || order.planned_qty || 1;
            const finalStageOut = sortedStages[sortedStages.length - 1]?.qty_out || 0;
            const totalWastage = sortedStages.reduce((sum, s) => sum + (s.wastage || 0), 0);
            const yieldPct = Math.round((finalStageOut / firstStageIn) * 100);

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-[#CFE0D5] shadow-sm overflow-hidden"
              >
                {/* Batch Header */}
                <div className="p-5 border-b border-[#CFE0D5] bg-[#F0F7F2]/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[#14532D] bg-[#E3EFE7] px-2.5 py-1 rounded">
                        {order.order_no}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                          order.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status === 'in_progress' ? 'In Production' : order.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700 pt-1">
                      <span className="font-semibold text-gray-900">
                        {order.product?.name || 'Toland Denim Garment'}
                      </span>
                      {order.variant && (
                        <span className="text-gray-500 text-xs bg-white px-2 py-0.5 rounded border border-[#CFE0D5]">
                          Size: {order.variant.size} {order.variant.fit ? `• ${order.variant.fit}` : ''}{' '}
                          {order.variant.wash ? `• ${order.variant.wash}` : ''}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        Created {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block">Planned</span>
                      <span className="font-bold text-gray-900">{order.planned_qty} pcs</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Packed Output</span>
                      <span className="font-bold text-[#14532D]">
                        {order.status === 'completed' ? `${order.completed_qty} pcs` : `${finalStageOut} pcs`}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Total Scrap</span>
                      <span className="font-bold text-rose-600">{totalWastage} pcs</span>
                    </div>
                  </div>
                </div>

                {/* 5-Stage Stepper Grid */}
                <div className="p-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
                    Manufacturing Process Flow
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {STAGE_CONFIG.map((conf, idx) => {
                      const stageRecord = sortedStages.find((s) => s.stage === conf.key);
                      const Icon = conf.icon;

                      const isDone = Boolean(stageRecord && stageRecord.qty_out > 0);
                      const isCurrent = Boolean(
                        stageRecord &&
                          stageRecord.qty_in > 0 &&
                          stageRecord.qty_out === 0
                      );
                      const isPending = !stageRecord || stageRecord.qty_in === 0;

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
                                <span className="font-semibold text-gray-900">{stageRecord?.qty_in || 0}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>Out:</span>
                                <span className="font-semibold text-[#14532D]">{stageRecord?.qty_out || 0}</span>
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

                          {stageRecord && order.status !== 'completed' && (
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
                      <span>{order.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE BATCH MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CFE0D5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">New Production Batch</h3>
                  <p className="text-xs text-gray-500">Auto-initializes all 5 stages in sequence</p>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Product *</label>
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setVariantId('');
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
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Variant / Size (Optional)
                  </label>
                  <select
                    value={variantId}
                    onChange={(e) => setVariantId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  >
                    <option value="">All sizes / Standard run</option>
                    {availableVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        Size {v.size} {v.fit ? `(${v.fit})` : ''} {v.sku ? `[${v.sku}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Planned Quantity (Pieces) *</label>
                <input
                  type="number"
                  min="1"
                  value={plannedQty}
                  onChange={(e) => setPlannedQty(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Batch Notes / Work Order Instructions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 14oz Selvedge Denim, double needle stitching, antique brass rivets..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 leading-relaxed">
                <strong>ERP Auto-Sync Active:</strong> Initializing this batch deducts raw materials configured in BOM and records to Stock Ledger; completing Packing automatically adds finished garments to Variant Inventory.
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
                  disabled={createLoading}
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CFE0D5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div>
                <span className="text-xs font-mono text-[#14532D] font-bold">{activeOrder.order_no}</span>
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
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Wastage / Scrap Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={wastage}
                  onChange={(e) => setWastage(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
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
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="markComplete"
                  checked={markComplete}
                  onChange={(e) => setMarkComplete(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CFE0D5] text-[#14532D] focus:ring-[#14532D]"
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
    </div>
  );
}
