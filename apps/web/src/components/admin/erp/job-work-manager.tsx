'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  Plus,
  Users,
  FileText,
  X,
  Loader2,
  Printer,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface Karigar {
  id: string;
  name: string;
  phone: string | null;
  department: string;
  rate_per_piece: number;
  address: string | null;
  is_active: boolean;
}

interface JobWorkChallan {
  id: string;
  challan_no: string;
  karigar_id: string;
  production_order_id: string | null;
  process_stage: string;
  qty_issued: number;
  qty_returned: number;
  qty_rejected: number;
  rate_per_piece: number;
  total_wage: number;
  paid_amount: number;
  payment_status: string;
  status: string;
  issued_date: string;
  due_date: string | null;
  notes: string | null;
  karigar?: Karigar;
  production_order?: { id: string; order_no: string; product?: { name: string } };
}

export function JobWorkManager({
  karigars,
  challans,
  productionOrders,
}: {
  karigars: Karigar[];
  challans: JobWorkChallan[];
  productionOrders: Array<{ id: string; order_no: string; product?: { name: string } }>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'challans' | 'karigars'>('challans');

  // Create Challan Modal
  const [challanModal, setChallanModal] = useState(false);
  const [karigarId, setKarigarId] = useState(karigars[0]?.id || '');
  const [productionOrderId, setProductionOrderId] = useState(productionOrders[0]?.id || '');
  const [processStage, setProcessStage] = useState(karigars[0]?.department || 'stitching');
  const [qtyIssued, setQtyIssued] = useState('100');
  const [ratePerPiece, setRatePerPiece] = useState(String(karigars[0]?.rate_per_piece || 45));
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Create Karigar Modal
  const [karigarModal, setKarigarModal] = useState(false);
  const [kName, setKName] = useState('');
  const [kPhone, setKPhone] = useState('');
  const [kDept, setKDept] = useState('stitching');
  const [kRate, setKRate] = useState('45');
  const [kAddress, setKAddress] = useState('');

  // Return / Wage Modal
  const [returnChallan, setReturnChallan] = useState<JobWorkChallan | null>(null);
  const [retQty, setRetQty] = useState('');
  const [rejQty, setRejQty] = useState('0');
  const [paidAmt, setPaidAmt] = useState('0');

  const [printChallan, setPrintChallan] = useState<JobWorkChallan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openChallans = challans.filter(
    (c) => c.status === 'issued' || c.status === 'partial_return'
  );
  const totalWageEarned = challans.reduce((s, c) => s + Number(c.total_wage || 0), 0);
  const totalWagePaid = challans.reduce((s, c) => s + Number(c.paid_amount || 0), 0);

  const handleKarigarSelect = (id: string) => {
    setKarigarId(id);
    const k = karigars.find((x) => x.id === id);
    if (k) {
      setProcessStage(k.department);
      setRatePerPiece(String(k.rate_per_piece || 0));
    }
  };

  const handleCreateKarigar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/erp/job-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'karigar',
          name: kName,
          phone: kPhone,
          department: kDept,
          rate_per_piece: Number(kRate || 0),
          address: kAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add karigar');
      setKarigarModal(false);
      setKName('');
      setKPhone('');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error adding karigar');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/erp/job-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          karigar_id: karigarId,
          production_order_id: productionOrderId || null,
          process_stage: processStage,
          qty_issued: Number(qtyIssued),
          rate_per_piece: Number(ratePerPiece || 0),
          due_date: dueDate || null,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue challan');
      setChallanModal(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error issuing challan');
    } finally {
      setLoading(false);
    }
  };

  const openReturnModal = (c: JobWorkChallan) => {
    setReturnChallan(c);
    setRetQty(String(c.qty_returned || c.qty_issued));
    setRejQty(String(c.qty_rejected || 0));
    setPaidAmt(String(c.paid_amount || 0));
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnChallan) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/erp/job-work', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: returnChallan.id,
          qty_returned: Number(retQty || 0),
          qty_rejected: Number(rejQty || 0),
          paid_amount: Number(paidAmt || 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update challan');
      setReturnChallan(null);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, entity?: 'karigar') => {
    if (!confirm('Delete this record?')) return;
    const url = entity
      ? `/api/admin/erp/job-work?id=${encodeURIComponent(id)}&entity=karigar`
      : `/api/admin/erp/job-work?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else alert('Cannot delete (may be linked to existing challans)');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Wrench className="w-4 h-4" />
            <span>Outwork Contractors & Piece-Rate Payroll</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">
            Karigar & Job Work Challans
          </h1>
          <p className="text-xs text-muted">
            Issue cut bundles to master karigars or washing units, receive pieces back, and settle piece-rate wages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setKarigarModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#CFE0D5] text-xs font-bold text-text hover:border-primary"
          >
            <Users className="w-4 h-4" />
            <span>Add Karigar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setChallanModal(true);
            }}
            disabled={karigars.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Job Challan</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5]">
          <span className="text-3xs font-bold uppercase text-muted block">Open Challans</span>
          <p className="text-2xl font-black text-primary mt-1">{openChallans.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5]">
          <span className="text-3xs font-bold uppercase text-muted block">Registered Karigars</span>
          <p className="text-2xl font-black text-text mt-1">{karigars.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5]">
          <span className="text-3xs font-bold uppercase text-muted block">Total Wage Earned</span>
          <p className="text-2xl font-black text-text mt-1 font-mono">
            ₹{totalWageEarned.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#CFE0D5]">
          <span className="text-3xs font-bold uppercase text-muted block">Pending Wage Balance</span>
          <p className="text-2xl font-black text-amber-700 mt-1 font-mono">
            ₹{Math.max(0, totalWageEarned - totalWagePaid).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('challans')}
          className={`px-4 py-2 rounded-xl text-xs font-bold ${
            tab === 'challans' ? 'bg-primary text-white' : 'bg-white border border-[#CFE0D5] text-muted'
          }`}
        >
          Outwork Challans ({challans.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('karigars')}
          className={`px-4 py-2 rounded-xl text-xs font-bold ${
            tab === 'karigars' ? 'bg-primary text-white' : 'bg-white border border-[#CFE0D5] text-muted'
          }`}
        >
          Karigar Directory ({karigars.length})
        </button>
      </div>

      {tab === 'challans' ? (
        <div className="bg-white rounded-2xl border border-[#CFE0D5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase tracking-wider">
                  <th className="py-3 px-4">Challan # & Stage</th>
                  <th className="py-3 px-3">Karigar / Contractor</th>
                  <th className="py-3 px-3">Batch Ref</th>
                  <th className="py-3 px-3">Issued / Ret / Rej</th>
                  <th className="py-3 px-3">Rate & Wage Due</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CFE0D5]">
                {challans.length > 0 ? (
                  challans.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F0F7F2]/40">
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-primary block">{c.challan_no}</span>
                        <span className="text-3xs uppercase font-bold text-muted">{c.process_stage}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-text block">{c.karigar?.name}</span>
                        <span className="text-3xs text-muted">{c.karigar?.phone}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-text">
                        {c.production_order?.order_no || 'General Job'}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <strong>{c.qty_issued}</strong> out ·{' '}
                        <span className="text-emerald-700 font-bold">{c.qty_returned} in</span> ·{' '}
                        <span className="text-rose-600">{c.qty_rejected} rej</span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold block text-text">
                          ₹{Number(c.total_wage).toLocaleString('en-IN')} (@₹{c.rate_per_piece})
                        </span>
                        <span className="text-3xs text-muted">
                          Paid: ₹{Number(c.paid_amount).toLocaleString('en-IN')} ({c.payment_status})
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase ${
                            c.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'partial_return'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPrintChallan(c)}
                            className="p-1.5 rounded-lg border border-[#CFE0D5] hover:border-primary"
                            title="Print Job Work Challan"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openReturnModal(c)}
                            className="px-2.5 py-1 rounded-lg bg-[#14532D] text-white text-3xs font-bold"
                          >
                            Return & Wage
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-lg text-danger hover:bg-danger/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted text-xs">
                      No job-work challans issued yet. Add a karigar first, then issue a challan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#CFE0D5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase tracking-wider">
                  <th className="py-3 px-4">Karigar / Contractor</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Default Piece Rate</th>
                  <th className="py-3 px-3">Phone & Address</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CFE0D5]">
                {karigars.map((k) => (
                  <tr key={k.id} className="hover:bg-[#F0F7F2]/40">
                    <td className="py-3 px-4 font-bold text-text">{k.name}</td>
                    <td className="py-3 px-3 uppercase font-bold text-primary">{k.department}</td>
                    <td className="py-3 px-3 font-mono font-bold">₹{Number(k.rate_per_piece).toFixed(2)} / pc</td>
                    <td className="py-3 px-3 text-muted">
                      {k.phone || '-'} {k.address ? `• ${k.address}` : ''}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(k.id, 'karigar')}
                        className="p-1.5 rounded-lg text-danger hover:bg-danger/10"
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
      )}

      {/* Add Karigar Modal */}
      {karigarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setKarigarModal(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-4 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
              <h2 className="text-base font-black text-text">Register Karigar / Contractor</h2>
              <button type="button" onClick={() => setKarigarModal(false)} className="p-1 text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateKarigar} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Karigar / Workshop Name *"
                value={kName}
                onChange={(e) => setKName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5]"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={kDept}
                  onChange={(e) => setKDept(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#CFE0D5]"
                >
                  <option value="cutting">Cutting</option>
                  <option value="stitching">Stitching</option>
                  <option value="washing">Washing Plant</option>
                  <option value="embroidery">Embroidery</option>
                  <option value="finishing">Finishing</option>
                  <option value="packing">Packing</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Rate / Piece (₹)"
                  value={kRate}
                  onChange={(e) => setKRate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#CFE0D5] font-mono font-bold"
                />
              </div>
              <input
                type="text"
                placeholder="Phone Number"
                value={kPhone}
                onChange={(e) => setKPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5]"
              />
              <input
                type="text"
                placeholder="Unit / Village / Town Address"
                value={kAddress}
                onChange={(e) => setKAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5]"
              />
              <div className="flex justify-end gap-2 pt-3 border-t border-[#CFE0D5]">
                <button
                  type="button"
                  onClick={() => setKarigarModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#CFE0D5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold"
                >
                  Save Karigar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Challan Modal */}
      {challanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setChallanModal(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-4 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
              <h2 className="text-base font-black text-text">Issue Outwork Job-Work Challan</h2>
              <button type="button" onClick={() => setChallanModal(false)} className="p-1 text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && <div className="p-2 rounded bg-danger/10 text-danger text-xs">{error}</div>}
            <form onSubmit={handleCreateChallan} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Karigar *</label>
                <select
                  value={karigarId}
                  onChange={(e) => handleKarigarSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5]"
                >
                  {karigars.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.department} — ₹{k.rate_per_piece}/pc)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Linked Production Batch</label>
                <select
                  value={productionOrderId}
                  onChange={(e) => setProductionOrderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5]"
                >
                  <option value="">Standalone Lot</option>
                  {productionOrders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.order_no} ({p.product?.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold mb-1">Process</label>
                  <select
                    value={processStage}
                    onChange={(e) => setProcessStage(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[#CFE0D5]"
                  >
                    <option value="cutting">Cutting</option>
                    <option value="stitching">Stitching</option>
                    <option value="washing">Washing</option>
                    <option value="embroidery">Embroidery</option>
                    <option value="finishing">Finishing</option>
                    <option value="packing">Packing</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Pieces Issued</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qtyIssued}
                    onChange={(e) => setQtyIssued(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#CFE0D5] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Rate (₹/pc)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ratePerPiece}
                    onChange={(e) => setRatePerPiece(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#CFE0D5] font-mono font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#CFE0D5]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Instructions</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Stitching thread spec..."
                    className="w-full px-2.5 py-2 rounded-xl border border-[#CFE0D5]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#CFE0D5]">
                <button
                  type="button"
                  onClick={() => setChallanModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#CFE0D5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold"
                >
                  Issue Challan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return & Wage Settlement Modal */}
      {returnChallan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setReturnChallan(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-4 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
              <div>
                <span className="font-mono text-xs font-bold text-primary">
                  {returnChallan.challan_no}
                </span>
                <h2 className="text-base font-black text-text">Return Receipt & Piece-Rate Wage</h2>
              </div>
              <button type="button" onClick={() => setReturnChallan(null)} className="p-1 text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReturnSubmit} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F0F7F2] flex justify-between">
                <span>Issued Qty: {returnChallan.qty_issued} pcs</span>
                <span className="font-mono font-bold">
                  Rate: ₹{returnChallan.rate_per_piece}/pc
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Good Returned Qty</label>
                  <input
                    type="number"
                    min="0"
                    max={returnChallan.qty_issued}
                    value={retQty}
                    onChange={(e) => setRetQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Damaged / Shortfall</label>
                  <input
                    type="number"
                    min="0"
                    value={rejQty}
                    onChange={(e) => setRejQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] font-mono font-bold"
                  />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between font-bold text-emerald-900">
                <span>Earned Piece-Rate Wage:</span>
                <span className="font-mono">
                  ₹{(Number(retQty || 0) * Number(returnChallan.rate_per_piece || 0)).toFixed(2)}
                </span>
              </div>
              <div>
                <label className="block font-bold mb-1">Cumulative Wage Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmt}
                  onChange={(e) => setPaidAmt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] font-mono font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#CFE0D5]">
                <button
                  type="button"
                  onClick={() => setReturnChallan(null)}
                  className="px-4 py-2 rounded-xl border border-[#CFE0D5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold"
                >
                  Save & Settle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Job-Work Challan */}
      {printChallan && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto print:bg-white print:p-0">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl space-y-5 print:shadow-none print:max-w-full">
            <div className="flex justify-between items-center pb-3 border-b print:hidden">
              <span className="text-xs font-bold uppercase text-slate-600">
                Outwork Job-Work Gate Pass
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#14532D] text-white text-xs font-bold"
                >
                  Print Challan
                </button>
                <button type="button" onClick={() => setPrintChallan(null)} className="p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-black">TOLAND PRIVATE LIMITED</h2>
                <p className="text-xs text-slate-600">Job-Work Issue Challan &mdash; Barbigha Unit</p>
              </div>
              <div className="text-right">
                <div className="font-mono font-black text-lg text-[#14532D]">
                  {printChallan.challan_no}
                </div>
                <div className="text-xs text-slate-600">Date: {printChallan.issued_date}</div>
              </div>
            </div>
            <div className="text-xs space-y-1 bg-slate-50 p-4 rounded-xl border">
              <p>
                <strong>Karigar / Contractor:</strong> {printChallan.karigar?.name}
              </p>
              <p>
                <strong>Process:</strong> {printChallan.process_stage.toUpperCase()}
              </p>
              <p>
                <strong>Batch Ref:</strong>{' '}
                {printChallan.production_order?.order_no || 'General Production'}
              </p>
              <p>
                <strong>Qty Issued:</strong> {printChallan.qty_issued} pieces @ ₹
                {printChallan.rate_per_piece}/pc
              </p>
              {printChallan.notes && (
                <p>
                  <strong>Notes:</strong> {printChallan.notes}
                </p>
              )}
            </div>
            <div className="flex justify-between pt-8 text-xs font-bold text-slate-700">
              <span>Storekeeper Sign</span>
              <span>Karigar Receiver Sign</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
