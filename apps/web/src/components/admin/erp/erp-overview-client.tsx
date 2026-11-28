'use client';

import React from 'react';
import Link from 'next/link';
import {
  Factory,
  Boxes,
  ClipboardList,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  Package,
  ClipboardCheck,
  Wrench,
  Receipt,
} from 'lucide-react';

interface ErpOverviewClientProps {
  rawMaterials: any[];
  products: any[];
  variants?: any[];
  boms: any[];
  productionOrders: any[];
  purchaseOrders: any[];
  qcInspections?: any[];
  jobWorkChallans?: any[];
  wholesaleOrders?: any[];
}

export function ErpOverviewClient({
  rawMaterials,
  products,
  variants = [],
  boms,
  productionOrders,
  purchaseOrders,
  qcInspections = [],
  jobWorkChallans = [],
  wholesaleOrders = [],
}: ErpOverviewClientProps) {
  const totalStockValue = rawMaterials.reduce(
    (sum, m) => sum + Number(m.stock_qty || 0) * Number(m.unit_price || 0),
    0
  );

  const lowStockMaterials = rawMaterials.filter(
    (m) => Number(m.stock_qty) <= Number(m.reorder_level)
  );

  const lowStockVariants = variants.filter((v) => Number(v.stock_qty ?? 0) <= 10);

  const inProgressProduction = productionOrders.filter((o) => o.status === 'in_progress');
  const totalGarmentsInProgress = inProgressProduction.reduce(
    (sum, o) => sum + (o.planned_qty || 0),
    0
  );

  const activePos = purchaseOrders.filter(
    (po) => po.status === 'ordered' || po.status === 'partial'
  );
  const openPoPayable = activePos.reduce(
    (sum, po) => sum + Math.max(0, Number(po.total_amount || 0) - Number(po.paid_amount || 0)),
    0
  );

  // QC Pulse
  const totalQcPass = qcInspections.reduce((s, q) => s + Number(q.pass_qty || 0), 0);
  const totalQcInspected = qcInspections.reduce(
    (s, q) => s + Number(q.pass_qty || 0) + Number(q.rework_qty || 0) + Number(q.reject_qty || 0),
    0
  );
  const qcPassRate = totalQcInspected > 0 ? Math.round((totalQcPass / totalQcInspected) * 100) : 100;

  // Job Work Pulse
  const openChallans = jobWorkChallans.filter(
    (c) => c.status === 'issued' || c.status === 'partial_return'
  );
  const karigarPendingPcs = openChallans.reduce(
    (s, c) => s + Math.max(0, Number(c.qty_issued || 0) - Number(c.qty_returned || 0)),
    0
  );

  // Wholesale Khata Pulse
  const activeWholesale = wholesaleOrders.filter((w) => w.status !== 'cancelled');
  const b2bReceivable = activeWholesale.reduce(
    (s, w) => s + Math.max(0, Number(w.total_amount || 0) - Number(w.paid_amount || 0)),
    0
  );

  // True Garment Costing (BOM + Scrap% + CMT Labor + Washing/Overhead)
  const productUnitEconomics = products
    .map((p) => {
      const pBoms = boms.filter((b) => b.product_id === p.id);
      const bomCost = pBoms.reduce((sum, b) => {
        const scrapMult = 1 + Number(b.scrap_percent || 0) / 100;
        return sum + Number(b.qty_per_piece || 0) * scrapMult * Number(b.raw_material?.unit_price || 0);
      }, 0);
      const labor = Number(p.labor_cost_per_piece || 0);
      const overhead = Number(p.overhead_cost_per_piece || 0);
      const totalLandedCost = bomCost + labor + overhead;
      const basePrice = Number(p.base_price || 0);
      const grossMargin = basePrice > 0 ? Math.round(((basePrice - totalLandedCost) / basePrice) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        bomCount: pBoms.length,
        bomCost,
        laborAndOverhead: labor + overhead,
        totalLandedCost,
        basePrice,
        grossMargin,
      };
    })
    .filter((pe) => pe.bomCount > 0 || pe.laborAndOverhead > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#14532D] uppercase tracking-wider">
            <Factory className="w-4 h-4" />
            <span>TOLAND Textile Manufacturing Plant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
            ERP & Factory Operations
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Sheikhpura, Barbigha Unit &mdash; Real-time inventory, BOM costing, QC lab, karigar wages & B2B khata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/erp/production"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#14532D]/90 transition shadow-sm"
          >
            <Layers className="w-4 h-4" />
            Track Production
          </Link>
          <Link
            href="/admin/erp/purchase-orders"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#CFE0D5] text-xs font-bold text-gray-800 hover:border-[#14532D] transition"
          >
            <ClipboardList className="w-4 h-4" />
            POs & GRN
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Raw Stock Value
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#14532D] mt-2">
            ₹{totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-gray-500 mt-1 block">
            Across {rawMaterials.length} fabric & trim lines
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Active Batches
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F0F7F2] flex items-center justify-center text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{inProgressProduction.length}</p>
          <span className="text-xs text-blue-700 font-semibold mt-1 block">
            {totalGarmentsInProgress.toLocaleString()} pcs in floor pipeline
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Open PO / Partial GRN
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F0F7F2] flex items-center justify-center text-amber-600">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{activePos.length}</p>
          <span className="text-xs text-amber-700 font-semibold mt-1 block">
            ₹{openPoPayable.toLocaleString('en-IN')} unpaid/inward balance
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Reorder Alerts
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                lowStockMaterials.length + lowStockVariants.length > 0
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-[#F0F7F2] text-emerald-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p
            className={`text-2xl font-black mt-2 ${
              lowStockMaterials.length + lowStockVariants.length > 0
                ? 'text-rose-600'
                : 'text-emerald-700'
            }`}
          >
            {lowStockMaterials.length + lowStockVariants.length}
          </p>
          <span className="text-xs text-gray-500 mt-1 block">
            {lowStockMaterials.length} raw · {lowStockVariants.length} finished SKUs
          </span>
        </div>
      </div>

      {/* Phase 2 Modules Pulse Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/erp/qc"
          className="bg-white p-4 rounded-2xl border border-[#CFE0D5] hover:border-[#14532D] transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase text-gray-500 block">
                QC & Defect Lab
              </span>
              <span className="text-base font-black text-gray-900">
                {qcPassRate}% Pass Rate ({qcInspections.length} logs)
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link
          href="/admin/erp/job-work"
          className="bg-white p-4 rounded-2xl border border-[#CFE0D5] hover:border-[#14532D] transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase text-gray-500 block">
                Karigar & Job Work
              </span>
              <span className="text-base font-black text-gray-900">
                {openChallans.length} Open Challans ({karigarPendingPcs} pcs)
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link
          href="/admin/erp/wholesale"
          className="bg-white p-4 rounded-2xl border border-[#CFE0D5] hover:border-[#14532D] transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase text-gray-500 block">
                B2B Quotes & Khata
              </span>
              <span className="text-base font-black text-gray-900">
                ₹{b2bReceivable.toLocaleString('en-IN')} Receivable
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>

      {/* Action Center: Raw Material Alerts + Finished SKU Size Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#CFE0D5] flex items-center justify-between bg-[#F0F7F2]/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Raw Material Reorder Alerts ({lowStockMaterials.length})
            </h2>
            <Link
              href="/admin/erp/raw-materials"
              className="text-xs font-bold text-[#14532D] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#CFE0D5] flex-1">
            {lowStockMaterials.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                All raw fabrics, threads, and trim inventories are healthy above reorder threshold.
              </div>
            ) : (
              lowStockMaterials.slice(0, 6).map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 flex items-center justify-between hover:bg-[#F0F7F2]/30"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-900">{m.name}</p>
                    <p className="text-[11px] text-gray-500">
                      Current:{' '}
                      <strong className="text-rose-600">
                        {m.stock_qty} {m.unit}
                      </strong>{' '}
                      &middot; Reorder at: {m.reorder_level} {m.unit}
                    </p>
                  </div>
                  <Link
                    href={`/admin/erp/purchase-orders?material=${m.id}`}
                    className="px-2.5 py-1 text-[11px] font-bold bg-[#E3EFE7] text-[#14532D] rounded-lg hover:bg-[#14532D] hover:text-white transition"
                  >
                    Order PO
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Finished Goods Size-Wise Low-Stock Action Center */}
        <div className="bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#CFE0D5] flex items-center justify-between bg-[#F0F7F2]/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#14532D]" />
              Finished SKU Size Low-Stock (&le;10 pcs) ({lowStockVariants.length})
            </h2>
            <Link
              href="/admin/erp/production"
              className="text-xs font-bold text-[#14532D] hover:underline flex items-center gap-1"
            >
              Run Batch <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#CFE0D5] flex-1">
            {lowStockVariants.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                All finished jeans & garment SKU sizes have comfortable stock levels.
              </div>
            ) : (
              lowStockVariants.slice(0, 6).map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 flex items-center justify-between hover:bg-[#F0F7F2]/30"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      {v.product?.name || 'Denim Style'} &middot; Size {v.size}
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono">
                      SKU: {v.sku} &middot; Stock:{' '}
                      <strong className="text-rose-600">{v.stock_qty} pcs</strong>
                    </p>
                  </div>
                  <Link
                    href={`/admin/erp/production?product=${v.product_id}&variant=${v.id}`}
                    className="px-2.5 py-1 text-[11px] font-bold bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 transition"
                  >
                    Cut Batch
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* True Unit Economics (BOM + Scrap + CMT Labor + Overheads) */}
      <div className="bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#CFE0D5] flex items-center justify-between bg-[#F0F7F2]/50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#14532D]" />
            True Garment Landed Cost & Margin (BOM + Scrap + CMT Labor + Overheads)
          </h2>
          <Link
            href="/admin/erp/boms"
            className="text-xs font-bold text-[#14532D] hover:underline flex items-center gap-1"
          >
            Edit Costing & Recipes <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {productUnitEconomics.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No product BOM recipes or CMT labor configured yet. Set up BOMs to compute real landed COGS.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F0F7F2]/70 text-gray-600 border-b border-[#CFE0D5] text-[10px] uppercase">
                  <th className="py-2.5 px-4 font-bold">Garment Style</th>
                  <th className="py-2.5 px-3 font-bold">BOM + Scrap</th>
                  <th className="py-2.5 px-3 font-bold">Labor + OH</th>
                  <th className="py-2.5 px-3 font-bold">Total Landed Cost</th>
                  <th className="py-2.5 px-3 font-bold">Selling Price</th>
                  <th className="py-2.5 px-4 font-bold text-right">Net Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CFE0D5]">
                {productUnitEconomics.map((pe) => (
                  <tr key={pe.id} className="hover:bg-[#F0F7F2]/30">
                    <td className="py-3 px-4 font-bold text-gray-900">{pe.name}</td>
                    <td className="py-3 px-3 font-mono text-gray-700">₹{pe.bomCost.toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono text-gray-700">
                      ₹{pe.laborAndOverhead.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#14532D]">
                      ₹{pe.totalLandedCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold">
                      ₹{pe.basePrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                      {pe.grossMargin}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Floor Wastage Snapshot */}
      <div className="bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#CFE0D5] flex items-center justify-between bg-[#F0F7F2]/50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#14532D]" />
            Active Factory Floor Stages (Yield & Wastage Overview)
          </h2>
          <Link
            href="/admin/erp/stock-ledger"
            className="text-xs font-bold text-[#14532D] hover:underline flex items-center gap-1"
          >
            Stock Ledger <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {['cutting', 'stitching', 'washing', 'finishing', 'packing'].map((st) => {
            const matchingStages = productionOrders.flatMap((o) =>
              (o.stages || []).filter((s: any) => s.stage === st)
            );
            const totalOut = matchingStages.reduce((s, stg) => s + (stg.qty_out || 0), 0);
            const totalScrap = matchingStages.reduce((s, stg) => s + (stg.wastage || 0), 0);

            return (
              <div key={st} className="p-3.5 rounded-xl bg-[#F0F7F2]/60 border border-[#CFE0D5]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  {st} Stage
                </span>
                <p className="text-lg font-black text-[#14532D] mt-1">
                  {totalOut.toLocaleString()} pcs
                </p>
                <span className="text-[11px] text-rose-600 block mt-0.5">
                  Total Scrap: {totalScrap} pcs
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
