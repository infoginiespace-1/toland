'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Percent,
  Calendar,
} from 'lucide-react';

interface CouponItem {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_amount: number;
  usage_limit?: number | null;
  valid_from: string;
  valid_to?: string | null;
  is_active: boolean;
}

interface CouponsManagerProps {
  coupons: CouponItem[];
}

export function CouponsManager({ coupons }: CouponsManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [minAmount, setMinAmount] = useState('0');
  const [usageLimit, setUsageLimit] = useState('');
  const [validTo, setValidTo] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setType('percentage');
    setValue('10');
    setMinAmount('999');
    setUsageLimit('');
    setValidTo('');
    setIsActive(true);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (c: CouponItem) => {
    setEditingCoupon(c);
    setCode(c.code);
    setType(c.type);
    setValue(c.value.toString());
    setMinAmount(c.min_amount.toString());
    setUsageLimit(c.usage_limit?.toString() || '');
    setValidTo(c.valid_to ? c.valid_to.split('T')[0] : '');
    setIsActive(c.is_active);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value || Number(value) <= 0) {
      setError('Please provide a valid coupon code and discount value');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        id: editingCoupon?.id,
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        min_amount: Number(minAmount || 0),
        usage_limit: usageLimit ? Number(usageLimit) : null,
        valid_to: validTo ? new Date(validTo).toISOString() : null,
        is_active: isActive,
      };

      const res = await fetch('/api/admin/coupons', {
        method: editingCoupon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save coupon');
      }

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (c: CouponItem) => {
    if (!confirm(`Delete coupon code "${c.code}"?`)) return;

    try {
      setDeletingId(c.id);
      const res = await fetch(`/api/admin/coupons?id=${c.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      router.refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Tag className="w-4 h-4" />
            <span>Discounts & Promotions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">
            Coupons & Vouchers ({coupons.length})
          </h1>
          <p className="text-xs text-muted">
            Create percentage discounts or flat rupee vouchers with min cart limits.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase tracking-wider">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-3">Discount</th>
                <th className="py-3 px-3">Min Order</th>
                <th className="py-3 px-3">Expiry</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CFE0D5]">
              {coupons.map((c) => {
                const isExpired = c.valid_to && new Date(c.valid_to) < new Date();

                return (
                  <tr key={c.id} className="hover:bg-[#F0F7F2]/40 transition-colors">
                    {/* Code Badge */}
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E3EFE7] border border-[#CFE0D5] text-primary font-mono font-black text-xs tracking-wider">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{c.code}</span>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="py-3 px-3 font-bold text-text">
                      {c.type === 'percentage' ? (
                        <span className="text-accent">{c.value}% OFF</span>
                      ) : (
                        <span className="text-primary font-mono">₹{c.value} FLAT</span>
                      )}
                    </td>

                    {/* Min Cart Threshold */}
                    <td className="py-3 px-3 font-mono text-muted">
                      {c.min_amount > 0 ? `₹${c.min_amount}` : 'No Minimum'}
                    </td>

                    {/* Expiry */}
                    <td className="py-3 px-3 text-muted">
                      {c.valid_to ? (
                        <span className={isExpired ? 'text-danger font-bold' : ''}>
                          {new Date(c.valid_to).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="text-3xs font-mono">Never Expires</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-danger/15 text-danger border border-danger/20">
                          Expired
                        </span>
                      ) : c.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-success/15 text-success border border-success/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-muted/15 text-muted border border-border">
                          Disabled
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg text-primary hover:bg-[#E3EFE7] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          disabled={deletingId === c.id}
                          className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                        >
                          {deletingId === c.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => !loading && setModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-5 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
              <h2 className="text-base font-black text-text">
                {editingCoupon ? `Edit: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
              </h2>
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

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="DENIM20"
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono font-bold text-text focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Discount Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-text focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={type === 'percentage' ? '15' : '250'}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono font-bold text-text focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="999"
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono text-text focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-text">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-primary rounded accent-primary"
                    />
                    <span>Active for Checkout</span>
                  </label>
                </div>
              </div>

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
                  <span>Save Coupon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
