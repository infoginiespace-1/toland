'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface QcInspection {
  id: string;
  qc_no: string;
  inspection_type: 'fabric_roll' | 'stage' | 'final_garment';
  production_order_id: string | null;
  raw_material_id: string | null;
  stage_name: string | null;
  inspected_qty: number;
  pass_qty: number;
  rework_qty: number;
  reject_qty: number;
  defect_reason: string | null;
  gsm_actual: number | null;
  shrinkage_pct: number | null;
  inspector_name: string | null;
  status: 'passed' | 'rework_required' | 'failed';
  notes: string | null;
  created_at: string;
  production_order?: { id: string; order_no: string; product?: { name: string } };
  raw_material?: { id: string; name: string; batch_lot_no?: string; shade?: string };
}

export function QcManager({
  inspections,
  productionOrders,
  rawMaterials,
}: {
  inspections: QcInspection[];
  productionOrders: Array<{ id: string; order_no: string; status: string; product?: { name: string } }>;
  rawMaterials: Array<{ id: string; name: string; type: string; batch_lot_no?: string; shade?: string }>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [inspectionType, setInspectionType] = useState<'fabric_roll' | 'stage' | 'final_garment'>('stage');
  const [productionOrderId, setProductionOrderId] = useState(productionOrders[0]?.id || '');
  const [rawMaterialId, setRawMaterialId] = useState(rawMaterials[0]?.id || '');
  const [stageName, setStageName] = useState('stitching');
  const [passQty, setPassQty] = useState('95');
  const [reworkQty, setReworkQty] = useState('3');
  const [rejectQty, setRejectQty] = useState('2');
  const [defectReason, setDefectReason] = useState('');
  const [gsmActual, setGsmActual] = useState('');
  const [shrinkagePct, setShrinkagePct] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalInspected = inspections.reduce((s, i) => s + Number(i.inspected_qty || 0), 0);
  const totalPass = inspections.reduce((s, i) => s + Number(i.pass_qty || 0), 0);
  const totalRework = inspections.reduce((s, i) => s + Number(i.rework_qty || 0), 0);
  const totalReject = inspections.reduce((s, i) => s + Number(i.reject_qty || 0), 0);
  const passRate = totalInspected > 0 ? Math.round((totalPass / totalInspected) * 100) : 100;

  const filtered = inspections.filter((i) => {
    const q = search.toLowerCase();
    const matchesSearch =
      i.qc_no.toLowerCase().includes(q) ||
      (i.production_order?.order_no || '').toLowerCase().includes(q) ||
      (i.raw_material?.name || '').toLowerCase().includes(q) ||
      (i.defect_reason || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/erp/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspection_type: inspectionType,
          production_order_id: inspectionType === 'fabric_roll' ? null : productionOrderId || null,
          raw_material_id: inspectionType === 'fabric_roll' ? rawMaterialId || null : null,
          stage_name: inspectionType === 'fabric_roll' ? 'inward_fabric' : stageName,
          pass_qty: Number(passQty || 0),
          rework_qty: Number(reworkQty || 0),
          reject_qty: Number(rejectQty || 0),
          defect_reason: defectReason,
          gsm_actual: gsmActual ? Number(gsmActual) : null,
          shrinkage_pct: shrinkagePct ? Number(shrinkagePct) : null,
          inspector_name: inspectorName,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record QC inspection');
      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error logging QC');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveRework = async (item: QcInspection) => {
    try {
      const res = await fetch('/api/admin/erp/qc', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          pass_qty: Number(item.pass_qty || 0) + Number(item.rework_qty || 0),
          rework_qty: 0,
          reject_qty: item.reject_qty,
          status: 'passed',
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Update failed');
    }
  };

  const handleDelete = async (item: QcInspection) => {
    if (!confirm(`Delete QC log ${item.qc_no}?`)) return;
    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/admin/erp/qc?id=${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
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
            <ClipboardCheck className="w-4 h-4" />
            <span>AQL Fabric & Garment Defect Lab</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">
            Quality Control (QC) & Rework ({inspections.length})
          </h1>
          <p className="text-xs text-muted">
            Log fabric roll GSM/shrinkage tests, line stage defects (stitch skip, shade variation), and rework pass-off.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New QC Inspection</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5]">
          <span className="text-3xs font-bold uppercase text-muted block">Overall Pass Yield</span>
          <p className="text-2xl font-black text-[#14532D] mt-1">{passRate}%</p>
          <span className="text-3xs text-muted">{totalPass} passed / {totalInspected} checked</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5]">
          <span className="text-3xs font-bold uppercase text-muted block">Active Rework Pool</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{totalRework} pcs</p>
          <span className="text-3xs text-muted">Needs line rectification</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5]">
          <span className="text-3xs font-bold uppercase text-muted block">Rejected / Seconds</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{totalReject} pcs</p>
          <span className="text-3xs text-muted">Grade-B / dead scrap</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5]">
          <span className="text-3xs font-bold uppercase text-muted block">Total Logs</span>
          <p className="text-2xl font-black text-text mt-1">{inspections.length}</p>
          <span className="text-3xs text-muted">Fabric & floor audits</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search QC #, Batch #, Material, or Defect reason..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-xs"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { key: 'all', label: 'All' },
            { key: 'passed', label: 'Passed' },
            { key: 'rework_required', label: 'Rework Req' },
            { key: 'failed', label: 'Failed' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatusFilter(t.key)}
              className={`px-3 py-1.5 rounded-xl font-bold ${
                statusFilter === t.key ? 'bg-primary text-white' : 'bg-[#F0F7F2] text-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#CFE0D5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase tracking-wider">
                <th className="py-3 px-4">QC # & Type</th>
                <th className="py-3 px-3">Target Batch / Roll</th>
                <th className="py-3 px-3">Pass / Rework / Reject</th>
                <th className="py-3 px-3">Lab Specs & Defect</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CFE0D5]">
              {filtered.length > 0 ? (
                filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-[#F0F7F2]/40">
                    <td className="py-3 px-4">
                      <span className="font-mono font-black text-primary block">{q.qc_no}</span>
                      <span className="text-3xs uppercase font-bold text-muted">
                        {q.inspection_type.replace('_', ' ')}
                        {q.stage_name ? ` (${q.stage_name})` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {q.production_order ? (
                        <div>
                          <span className="font-mono font-bold text-text block">
                            {q.production_order.order_no}
                          </span>
                          <span className="text-3xs text-muted">
                            {q.production_order.product?.name}
                          </span>
                        </div>
                      ) : q.raw_material ? (
                        <div>
                          <span className="font-bold text-text block">{q.raw_material.name}</span>
                          <span className="text-3xs font-mono text-muted">
                            {q.raw_material.batch_lot_no || 'Roll'} {q.raw_material.shade || ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted">General Floor Audit</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className="text-emerald-700 font-bold">{q.pass_qty} Pass</span> ·{' '}
                      <span className="text-amber-700 font-bold">{q.rework_qty} Rwk</span> ·{' '}
                      <span className="text-rose-600 font-bold">{q.reject_qty} Rej</span>
                    </td>
                    <td className="py-3 px-3">
                      {q.defect_reason && (
                        <span className="text-rose-700 font-semibold block">{q.defect_reason}</span>
                      )}
                      {(q.gsm_actual != null || q.shrinkage_pct != null) && (
                        <span className="text-3xs font-mono text-muted block">
                          {q.gsm_actual != null ? `${q.gsm_actual} GSM ` : ''}
                          {q.shrinkage_pct != null ? `· ${q.shrinkage_pct}% Shrinkage` : ''}
                        </span>
                      )}
                      {q.inspector_name && (
                        <span className="text-3xs text-muted">By: {q.inspector_name}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {q.status === 'passed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Passed
                        </span>
                      ) : q.status === 'rework_required' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3" /> Rework
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {q.status === 'rework_required' && (
                          <button
                            type="button"
                            onClick={() => handleResolveRework(q)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-3xs font-bold hover:bg-emerald-700"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Pass Rework</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(q)}
                          disabled={deletingId === q.id}
                          className="p-1.5 rounded-lg text-danger hover:bg-danger/10"
                        >
                          {deletingId === q.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted text-xs">
                    No QC inspection logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !loading && setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-4 z-10 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
              <h2 className="text-base font-black text-text">Log Quality Control Inspection</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="text-muted p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider">
                    Inspection Type
                  </label>
                  <select
                    value={inspectionType}
                    onChange={(e) => setInspectionType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50"
                  >
                    <option value="stage">Production Stage QC</option>
                    <option value="final_garment">Final AQL Packing QC</option>
                    <option value="fabric_roll">Inward Fabric Roll Lab</option>
                  </select>
                </div>

                {inspectionType === 'fabric_roll' ? (
                  <div>
                    <label className="block font-bold mb-1 uppercase tracking-wider">
                      Fabric / Material
                    </label>
                    <select
                      value={rawMaterialId}
                      onChange={(e) => setRawMaterialId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50"
                    >
                      {rawMaterials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.batch_lot_no ? `(${m.batch_lot_no})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold mb-1 uppercase tracking-wider">
                      Production Batch
                    </label>
                    <select
                      value={productionOrderId}
                      onChange={(e) => setProductionOrderId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50"
                    >
                      <option value="">Select Batch...</option>
                      {productionOrders.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.order_no} ({p.product?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {inspectionType !== 'fabric_roll' && (
                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider">Floor Stage</label>
                  <select
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50"
                  >
                    <option value="cutting">Cutting</option>
                    <option value="stitching">Stitching</option>
                    <option value="washing">Washing</option>
                    <option value="finishing">Finishing</option>
                    <option value="packing">Packing</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 uppercase text-emerald-700">Pass Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={passQty}
                    onChange={(e) => setPassQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 uppercase text-amber-700">Rework Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={reworkQty}
                    onChange={(e) => setReworkQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 uppercase text-rose-700">Reject Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={rejectQty}
                    onChange={(e) => setRejectQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 uppercase">Defect Reason</label>
                  <input
                    type="text"
                    value={defectReason}
                    onChange={(e) => setDefectReason(e.target.value)}
                    placeholder="Stitch skip, Shade mismatch, Rivet loose..."
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 uppercase">QC Master Name</label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    placeholder="e.g. Imran QC Master"
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 uppercase">Actual GSM Tested</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gsmActual}
                    onChange={(e) => setGsmActual(e.target.value)}
                    placeholder="390"
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 uppercase">Wash Shrinkage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={shrinkagePct}
                    onChange={(e) => setShrinkagePct(e.target.value)}
                    placeholder="2.5"
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#CFE0D5]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#CFE0D5] font-bold text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white font-black uppercase tracking-wider"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save QC Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
