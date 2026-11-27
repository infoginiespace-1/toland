'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Phone,
  Search,
  Package,
  Truck,
  Loader2,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

function ReturnsContent() {
  const searchParams = useSearchParams();
  const initialOrderNo = searchParams.get('order_no') || searchParams.get('order') || '';

  const [activeTab, setActiveTab] = useState<'request' | 'policy'>('request');
  const [orderNo, setOrderNo] = useState(initialOrderNo);
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [orderFound, setOrderFound] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Form State
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [actionType, setActionType] = useState<'exchange' | 'return'>('exchange');
  const [reason, setReason] = useState<string>('Waist too tight, need larger size');
  const [replacementSize, setReplacementSize] = useState<string>('32');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNo.trim()) return;

    try {
      setSearching(true);
      setSearchError(null);
      setOrderFound(null);

      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(orderNo.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.orders || data.orders.length === 0) {
        throw new Error(data.message || 'Order not found. Please verify your Order Number.');
      }

      const ord = data.orders[0];
      setOrderFound(ord);
      const items = ord.order_items || [];
      if (items.length > 0) {
        setSelectedItem(
          `${items[0]?.variant?.product?.name || 'TOLAND Denim'} (Size ${items[0]?.variant?.size || 'Standard'})`
        );
      }
      if (ord.address_snapshot?.phone) {
        setPhone(ord.address_snapshot.phone.replace(/\D/g, '').slice(-10));
      }
    } catch (err: any) {
      setSearchError(err?.message || 'Failed to locate order.');
      setOrderFound(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderFound) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const payload = {
        orderNo: orderFound.order_no,
        phone: phone.trim() || orderFound.address_snapshot?.phone,
        actionType,
        reason,
        replacementSize: actionType === 'exchange' ? replacementSize : undefined,
        itemDetails: selectedItem,
        notes,
      };

      const res = await fetch('/api/returns/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit exchange request.');
      }

      setSubmitSuccess(data);
    } catch (err: any) {
      setSubmitError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center text-xs text-muted font-medium space-x-2">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <span className="text-primary font-semibold">Returns & Exchanges</span>
      </nav>

      {/* Top Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border shadow-card space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
          <RotateCcw className="w-4 h-4 text-accent" />
          <span>TOLAND 7-Day Doorstep Replacement Guarantee</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">
          Doorstep Exchanges & Easy Returns
        </h1>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Need a different size or fit? We provide hassle-free doorstep reverse pickup across India within 48 hours.
        </p>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('request')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'request'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-alt border border-border text-muted hover:text-text'
            }`}
          >
            Submit Exchange / Return Request
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'policy'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-alt border border-border text-muted hover:text-text'
            }`}
          >
            Policy & Eligibility Guidelines
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE REQUEST FORM */}
      {activeTab === 'request' && (
        <div className="space-y-6">
          {submitSuccess ? (
            /* Success Card */
            <div className="p-8 rounded-3xl bg-white border border-emerald-300 shadow-xl text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                Ticket Registered: {submitSuccess.ticketId}
              </span>
              <h2 className="text-2xl font-black text-text">
                Your {submitSuccess.actionLabel} Request is Confirmed!
              </h2>
              <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
                Our Sheikhpura dispatch team has scheduled a reverse courier pickup. A WhatsApp confirmation with reverse pickup instructions has been dispatched to your phone.
              </p>

              <div className="p-4 rounded-2xl bg-surface-alt border border-border max-w-sm mx-auto text-left text-xs space-y-1.5">
                <div className="font-bold text-text">Reverse Pickup Guidelines:</div>
                <ul className="text-3xs text-muted list-disc pl-4 space-y-1">
                  <li>Keep unworn jeans packed with original brand tags attached.</li>
                  <li>Courier executive will verify tags before issuing handover OTP.</li>
                  <li>Replacement package will dispatch upon pickup verification.</li>
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  href="/track-order"
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-colors"
                >
                  Track Live Orders
                </Link>
                <a
                  href="https://wa.me/918797186001?text=Hello%20TOLAND,%20I%20have%20submitted%20an%20exchange%20ticket"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp Helpdesk</span>
                </a>
              </div>
            </div>
          ) : !orderFound ? (
            /* Step 1: Order Lookup */
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border shadow-card space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-text">Step 1: Enter Your Order Information</h2>
                <p className="text-xs text-muted">
                  Enter your Order ID (from your invoice or WhatsApp confirmation) to locate your items.
                </p>
              </div>

              <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={orderNo}
                    onChange={(e) => setOrderNo(e.target.value)}
                    placeholder="e.g. TLD-2026-49201"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-surface-alt text-xs font-mono font-bold text-text focus:outline-none focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={searching}
                  className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Find My Order</span>
                </button>
              </form>

              {searchError && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Fill Exchange Form */
            <form onSubmit={handleSubmitRequest} className="p-6 sm:p-8 rounded-3xl bg-white border border-border shadow-card space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <span className="text-3xs uppercase tracking-wider font-bold text-muted">Found Order</span>
                  <div className="font-mono text-base font-extrabold text-primary">{orderFound.order_no}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOrderFound(null);
                    setOrderNo('');
                  }}
                  className="text-xs font-bold text-muted hover:text-danger underline"
                >
                  Change Order
                </button>
              </div>

              {/* Action Type: Exchange vs Return */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text block">I want to:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActionType('exchange')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      actionType === 'exchange'
                        ? 'border-primary bg-primary/5 text-primary font-bold shadow-xs'
                        : 'border-border bg-surface-alt text-muted'
                    }`}
                  >
                    <div className="text-xs font-bold text-text">Exchange for Different Size</div>
                    <div className="text-3xs text-muted mt-0.5">Free doorstep replacement pickup</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('return')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      actionType === 'return'
                        ? 'border-primary bg-primary/5 text-primary font-bold shadow-xs'
                        : 'border-border bg-surface-alt text-muted'
                    }`}
                  >
                    <div className="text-xs font-bold text-text">Return & Get Refund</div>
                    <div className="text-3xs text-muted mt-0.5">Refund to source bank/UPI</div>
                  </button>
                </div>
              </div>

              {/* Select Item */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text block">Select Item to Exchange / Return:</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-alt text-xs font-medium text-text focus:outline-none focus:border-primary"
                >
                  {(orderFound.order_items || []).map((item: any, idx: number) => {
                    const desc = `${item.variant?.product?.name || 'TOLAND Denim'} (Size ${item.variant?.size || 'Standard'}) - ₹${item.price}`;
                    return (
                      <option key={idx} value={desc}>
                        {desc}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text block">Primary Reason:</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-alt text-xs font-medium text-text focus:outline-none focus:border-primary"
                >
                  <option value="Waist too tight, need larger size">Waist too tight, need larger size</option>
                  <option value="Waist too loose, need smaller size">Waist too loose, need smaller size</option>
                  <option value="Need different fit (Slim vs Straight)">Need different fit (Slim vs Straight)</option>
                  <option value="Fabric color or wash tone mismatch">Fabric color or wash tone mismatch</option>
                  <option value="Manufacturing defect or stitch flaw">Manufacturing defect or stitch flaw</option>
                  <option value="Changed my mind">Changed my mind</option>
                </select>
              </div>

              {/* Target Replacement Size (If Exchange) */}
              {actionType === 'exchange' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text block">
                    Choose New Replacement Waist Size:
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {['28', '30', '32', '34', '36', '38'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReplacementSize(s)}
                        className={`py-2 rounded-xl text-xs font-bold font-mono border transition-all ${
                          replacementSize === s
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-surface-alt border-border text-muted hover:text-text'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text block">WhatsApp Phone for Pickup Verification:</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-alt text-xs font-mono font-bold text-text focus:outline-none focus:border-primary"
                />
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text block">Additional Remarks (Optional):</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific delivery instructions or fit notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-alt text-xs text-text focus:outline-none focus:border-primary"
                />
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-bold">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>Schedule Doorstep {actionType === 'exchange' ? 'Exchange' : 'Return'} Pickup</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: POLICY & ELIGIBILITY GUIDELINES */}
      {activeTab === 'policy' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 3 Step Process */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                1
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-text">Raise in 7 Days</h3>
              <p className="text-2xs text-muted leading-relaxed">
                Submit request on this portal or ping our Sheikhpura WhatsApp desk within 7 calendar days of package arrival.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                2
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-text">Doorstep Reverse Pickup</h3>
              <p className="text-2xs text-muted leading-relaxed">
                Our logistics executive arrives at your doorstep to inspect tags and collect the unworn denim.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                3
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-text">Replacement / Refund</h3>
              <p className="text-2xs text-muted leading-relaxed">
                Replacement size dispatches immediately from Sheikhpura. Refunds credit directly to your UPI/Bank within 3–5 days.
              </p>
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-card space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <h4 className="font-bold text-xs text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Eligible for Full Doorstep Exchange</span>
                </h4>
                <ul className="text-2xs text-emerald-900/80 space-y-1 pl-5 list-disc">
                  <li>Waist or inseam length sizing adjustments.</li>
                  <li>Original TOLAND paper tags and washcare labels intact.</li>
                  <li>Unworn, unwashed denim free of perfume or stains.</li>
                  <li>Manufacturing weave or rivet flaw.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                <h4 className="font-bold text-xs text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Non-Eligible Items</span>
                </h4>
                <ul className="text-2xs text-rose-900/80 space-y-1 pl-5 list-disc">
                  <li>Jeans altered or hemmed by local tailors.</li>
                  <li>Garments showing signs of wash, fragrance, or wear.</li>
                  <li>Custom promotional B2B merchandise batches.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-muted">
              <span>Have immediate questions?</span>
              <a
                href="https://wa.me/918797186001?text=Hello%20TOLAND,%20I%20have%20questions%20about%20exchange%20policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>WhatsApp Factory Desk (+91 87971 86001)</span>
                <Phone className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReturnsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      }
    >
      <ReturnsContent />
    </Suspense>
  );
}
