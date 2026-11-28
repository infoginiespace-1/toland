'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CustomerCancelOrderButtonProps {
  orderNo: string;
  phone: string;
  status: string;
}

export function CustomerCancelOrderButton({
  orderNo,
  phone,
  status,
}: CustomerCancelOrderButtonProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState('Ordered incorrect waist size');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canCancel = ['pending', 'confirmed'].includes(status.toLowerCase());

  if (!canCancel) return null;

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_no: orderNo,
          phone,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order.');
      }

      setSuccess(true);
      setTimeout(() => {
        setModalOpen(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <XCircle className="w-3.5 h-3.5" />
        <span>Cancel Order</span>
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm border-b border-border pb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Cancel Order #{orderNo}</span>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {success ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Order cancelled successfully. Stock has been restored.</span>
              </div>
            ) : (
              <form onSubmit={handleCancelSubmit} className="space-y-4">
                <p className="text-xs text-muted leading-relaxed">
                  Your order is currently queued at our facility. You can cancel now to release reserved inventory.
                </p>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                    Cancellation Reason *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs font-medium text-text focus:outline-hidden focus:border-primary"
                  >
                    <option value="Ordered incorrect waist size">Ordered incorrect waist size</option>
                    <option value="Need to change delivery address">Need to change delivery address</option>
                    <option value="Found an alternate denim style">Found an alternate denim style</option>
                    <option value="Placed by mistake">Placed by mistake</option>
                    <option value="Other / Change of mind">Other / Change of mind</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted hover:text-text hover:bg-slate-50 transition-colors"
                  >
                    Never Mind
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Cancellation</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
