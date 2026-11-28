'use client';

import React from 'react';
import Link from 'next/link';
import {
  Factory,
  AlertTriangle,
  Boxes,
  TrendingUp,
  Layers,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Calculator,
  Scissors,
} from 'lucide-react';

interface ErpOverviewClientProps {
  rawMaterials: any[];
  products: any[];
  boms: any[];
  productionOrders: any[];
  purchaseOrders: any[];
}

export function ErpOverviewClient({
  rawMaterials,
  products,
  boms,
  productionOrders,
  purchaseOrders,
}: ErpOverviewClientProps) {
  // 1. Inventory Metrics
  const totalRawValue = rawMaterials.reduce(
    (sum, m) => sum + Number(m.stock_qty || 0) * Number(m.unit_price || 0),
    0
  );
  const lowStockMaterials = rawMaterials.filter(
    (m) => Number(m.stock_qty || 0) <= Number(m.reorder_level || 10)
  );

  // 2. Production & Wastage Metrics
  const activeBatches = productionOrders.filter((o) => o.status === 'in_progress');
  const activeUnitsPlanned = activeBatches.reduce((sum, o) => sum + Number(o.planned_qty || 0), 0);

  const stageSummary: Record<string, { inQty: number; outQty: number; wastage: number }> = {
    cutting: { inQty: 0, outQty: 0, wastage: 0 },
    stitching: { inQty: 0, outQty: 0, wastage: 0 },
    washing: { inQty: 0, outQty: 0, wastage: 0 },
    finishing: { inQty: 0, outQty: 0, wastage: 0 },
    packing: { inQty: 0, outQty: 0, wastage: 0 },
  };

  productionOrders.forEach((ord) => {
    (ord.stages || []).forEach((st: any) => {
      if (stageSummary[st.stage]) {
        stageSummary[st.stage].inQty += Number(st.qty_in || 0);
        stageSummary[st.stage].outQty += Number(st.qty_out || 0);
        stageSummary[st.stage].wastage += Number(st.wastage || 0);
      }
    });
  });

  // 3. Open Purchase Orders Value
  const openPOs = purchaseOrders.filter((p) => p.status === 'ordered');
  const openPOValue = openPOs.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);

  // 4. Garment Unit Costing Matrix
  const productCosting = products.map((prod) => {
    const prodBoms = boms.filter((b) => b.product_id === prod.id);
    const bomCost = prodBoms.reduce((sum, b) => {
      return sum + Number(b.qty_per_piece || 0) * Number(b.raw_material?.unit_price || 0);
    }, 0);

    let maxCapacity = prodBoms.length > 0 ? Infinity : 0;
    prodBoms.forEach((b) => {
      const avail = Number(b.raw_material?.stock_qty || 0);
      const req = Number(b.qty_per_piece || 1);
      if (req > 0) {
        maxCapacity = Math.min(maxCapacity, Math.floor(avail / req));
      }
    });
    if (maxCapacity === Infinity) maxCapacity = 0;

    const sellingPrice = Number(prod.base_price || 0);
    const grossMarginRs = sellingPrice - bomCost;
    const marginPct = sellingPrice > 0 && bomCost > 0 ? Math.round((grossMarginRs / sellingPrice) * 100) : 0;

    return {
      ...prod,
      bomCount: prodBoms.length,
      bomCost,
      grossMarginRs,
      marginPct,
      maxCapacity,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#14532D] uppercase tracking-wider">
            <Factory className="w-4 h-4" />
            <span>Sheikhpura Factory ERP Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Manufacturing Costing, Stock &amp; Yield
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live raw material valuation, low-stock reorder alerts, garment unit margins, and floor wastage telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/erp/production"
            className="px-4 py-2 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#14532D]/90 transition flex items-center gap-1.5 shadow-xs"
          >
            <Layers className="w-4 h-4" />
            <span>Manage Production</span>
          </Link>
          <Link
            href="/admin/erp/purchase-orders"
            className="px-4 py-2 rounded-xl bg-white border border-[#CFE0D5] text-slate-800 text-xs font-semibold hover:bg-[#F0F7F2] transition flex items-center gap-1.5"
          >
            <ClipboardList className="w-4 h-4 text-[#14532D]" />
            <span>Create PO</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Raw Material Value</span>
            <Boxes className="w-4 h-4 text-[#14532D]" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹{Math.round(totalRawValue).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500">{rawMaterials.length} raw inventory SKUs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Low Stock Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockMaterials.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
          <div className={`text-2xl font-extrabold ${lowStockMaterials.length > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {lowStockMaterials.length} Items
          </div>
          <p className="text-[11px] text-slate-500">At or below reorder threshold</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">In-Progress Output</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {activeUnitsPlanned} Pcs
          </div>
          <p className="text-[11px] text-slate-500">Across {activeBatches.length} active floor batches</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Open Inward POs</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹{Math.round(openPOValue).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500">{openPOs.length} orders awaiting mill delivery</p>
        </div>
      </div>

      {/* Low Stock Reorder Alerts */}
      <div className="bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#CFE0D5] flex items-center justify-between bg-[#F0F7F2]/40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900">Low-Stock Reorder Action Center</h2>
          </div>
          <Link href="/admin/erp/raw-materials" className="text-xs font-semibold text-[#14532D] hover:underline flex items-center gap-1">
            <span>All Raw Materials</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {lowStockMaterials.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <span className="font-semibold text-slate-800">All raw materials are safely stocked above reorder levels.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Material Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Current Stock</th>
                  <th className="px-4 py-3 text-right">Reorder Threshold</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockMaterials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-rose-50/30">
                    <td className="px-4 py-3 font-bold text-slate-900">{mat.name}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">{mat.type}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                      {Number(mat.stock_qty)} {mat.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">
                      {Number(mat.reorder_level)} {mat.unit}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/erp/purchase-orders?material=${mat.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#14532D] text-white text-[11px] font-semibold hover:bg-[#14532D]/90"
                      >
                        <ClipboardList className="w-3 h-3" />
                        <span>Order via PO</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Garment Unit Costing & Stage Wastage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Economics Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#CFE0D5] flex items-center justify-between bg-[#F0F7F2]/40">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#14532D]" />
              <h2 className="text-sm font-bold text-slate-900">Product Unit Economics (BOM vs Selling Price)</h2>
            </div>
            <Link href="/admin/erp/boms" className="text-xs font-semibold text-[#14532D] hover:underline">
              Configure BOMs &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Garment Model</th>
                  <th className="px-4 py-3 text-right">BOM Cost</th>
                  <th className="px-4 py-3 text-right">Base Price</th>
                  <th className="px-4 py-3 text-right">Margin</th>
                  <th className="px-4 py-3 text-right">Max Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productCosting.map((pc) => (
                  <tr key={pc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{pc.name}</div>
                      <div className="text-[10px] text-slate-500">{pc.bomCount} BOM components</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                      {pc.bomCount > 0 ? `₹${Math.round(pc.bomCost)}` : <span className="text-slate-400">No BOM</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ₹{pc.base_price}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {pc.bomCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {pc.marginPct}% (₹{Math.round(pc.grossMarginRs)})
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#14532D]">
                      {pc.bomCount > 0 ? `${pc.maxCapacity} pcs` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stage Wastage Breakdown */}
        <div className="bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#CFE0D5] flex items-center gap-2 bg-[#F0F7F2]/40">
            <Scissors className="w-4 h-4 text-[#14532D]" />
            <h2 className="text-sm font-bold text-slate-900">Floor Stage Yield &amp; Wastage</h2>
          </div>

          <div className="p-4 space-y-3">
            {Object.entries(stageSummary).map(([stageKey, data]) => {
              const totalHandled = data.outQty + data.wastage;
              const scrapPct = totalHandled > 0 ? ((data.wastage / totalHandled) * 100).toFixed(1) : '0.0';

              return (
                <div key={stageKey} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold capitalize text-slate-900">{stageKey} Station</span>
                    <span className="text-[11px] font-semibold text-rose-600">{scrapPct}% wastage</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Passed: {data.outQty} pcs</span>
                    <span>Scrap: {data.wastage} pcs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
