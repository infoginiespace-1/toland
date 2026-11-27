'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  Send,
  Scissors,
  Calculator,
  TrendingUp,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function B2BWholesalePage() {
  const [calcQty, setCalcQty] = useState(250);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessName: '',
    city: '',
    state: 'Bihar',
    estimatedQty: '100 - 300 pieces',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getTierDetails = (qty: number) => {
    if (qty < 100) {
      return { rate: 599, tier: 'Tier 1: Starter Batch', leadTime: '3–5 Days', margin: '60%' };
    } else if (qty < 300) {
      return { rate: 499, tier: 'Tier 2: Trade Lot', leadTime: '5–8 Days', margin: '67%' };
    } else if (qty < 600) {
      return { rate: 449, tier: 'Tier 2+: Regional Batch', leadTime: '8–12 Days', margin: '70%' };
    } else {
      return { rate: 399, tier: 'Tier 3: Mill Direct Private Label', leadTime: '12–16 Days', margin: '73%' };
    }
  };

  const currentTier = getTierDetails(calcQty);
  const subtotal = calcQty * currentTier.rate;
  const gst = Math.round(subtotal * 0.12);
  const totalWithGst = subtotal + gst;
  const projectedRetailRevenue = calcQty * 1499;
  const projectedProfit = projectedRetailRevenue - subtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/b2b/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Manufacturer Direct Wholesale</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-text tracking-tight">
          Partner with TOLAND for Factory-Direct Denim Supply
        </h1>
        <p className="text-sm sm:text-base text-muted leading-relaxed">
          We manufacture premium ring-spun denim for retail chains, distributors, and independent boutique owners
          across India. Enjoy custom labeling, reliable delivery schedules, and substantial wholesale margins.
        </p>
      </div>

      {/* 3 Tier Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">Tier 1: Starter Batch</div>
          <div className="text-2xl font-black text-text">50 – 199 Pcs</div>
          <p className="text-xs text-muted">
            Ideal for independent boutique stores testing fit and response. Assorted sizes and core washes.
          </p>
          <ul className="space-y-2 text-xs text-text border-t border-border pt-4">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>~25% Off Storefront Base Price</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Full Size Assortment (28 to 38)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Dispatch in 3–5 Business Days</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-surface-alt border-2 border-primary space-y-4 relative shadow-sm">
          <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-primary text-white">
            Most Popular
          </span>
          <div className="text-xs font-bold uppercase tracking-wider text-primary">Tier 2: Trade Lot</div>
          <div className="text-2xl font-black text-text">200 – 499 Pcs</div>
          <p className="text-xs text-muted">
            For regional apparel distributors and multi-outlet stores requiring regular restocking.
          </p>
          <ul className="space-y-2 text-xs text-text border-t border-border pt-4">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>~35% Off Storefront Base Price</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Customized In-House Wash Options</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Dedicated Account Manager on WhatsApp</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">Tier 3: Mill Production</div>
          <div className="text-2xl font-black text-text">500+ Pcs</div>
          <p className="text-xs text-muted">
            Large-scale private label manufacturing with complete custom hardware, back patches, and wash specs.
          </p>
          <ul className="space-y-2 text-xs text-text border-t border-border pt-4">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Maximum Mill Direct Pricing</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Custom Brand Patches & Buttons</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Priority Floor Production in Bihar</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Interactive Live Bulk Tier Calculator */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
              <Calculator className="w-3.5 h-3.5" />
              <span>Real-Time Wholesale Rate Estimator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2">
              Calculate Your Bulk Manufacturing Lot
            </h2>
            <p className="text-xs text-white/70 mt-1">
              Move the slider to estimate wholesale per-piece rates, production turnaround, and retail margins.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-3xs uppercase tracking-wider text-emerald-400 font-bold block">Active Rate Tier</span>
            <span className="text-base font-extrabold text-white">{currentTier.tier}</span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80">Batch Order Quantity:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black font-mono text-emerald-400">{calcQty}</span>
              <span className="text-xs text-white/60 font-semibold">pieces</span>
            </div>
          </div>

          <input
            type="range"
            min={50}
            max={2000}
            step={25}
            value={calcQty}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCalcQty(val);
              setFormData((prev) => ({ ...prev, estimatedQty: `${val} pieces` }));
            }}
            className="w-full accent-emerald-500 h-2.5 bg-white/20 rounded-lg cursor-pointer"
          />

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-2xs text-white/60 self-center mr-1">Quick Select:</span>
            {[50, 100, 250, 500, 1000, 2000].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setCalcQty(q);
                  setFormData((prev) => ({ ...prev, estimatedQty: `${q} pieces` }));
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  calcQty === q
                    ? 'bg-emerald-500 text-slate-900 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {q} pcs
              </button>
            ))}
          </div>
        </div>

        {/* Live Financial Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white/5 border border-white/10">
          <div>
            <span className="text-3xs uppercase tracking-wider font-bold text-white/60 block">Factory Rate</span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">₹{currentTier.rate}<span className="text-xs font-normal text-white/60">/pc</span></div>
            <span className="text-3xs text-emerald-400 font-bold">~{currentTier.margin} Retail Margin</span>
          </div>

          <div>
            <span className="text-3xs uppercase tracking-wider font-bold text-white/60 block">Subtotal (Pre-Tax)</span>
            <div className="text-xl font-black text-white font-mono mt-0.5">₹{subtotal.toLocaleString('en-IN')}</div>
            <span className="text-3xs text-white/60">100% Combed Cotton</span>
          </div>

          <div>
            <span className="text-3xs uppercase tracking-wider font-bold text-white/60 block">Estimated GST (12%)</span>
            <div className="text-xl font-black text-white font-mono mt-0.5">₹{gst.toLocaleString('en-IN')}</div>
            <span className="text-3xs text-white/60">Input Tax Credit Eligible</span>
          </div>

          <div>
            <span className="text-3xs uppercase tracking-wider font-bold text-emerald-400 block">Est. Invoice Total</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">₹{totalWithGst.toLocaleString('en-IN')}</div>
            <span className="text-3xs text-white/60">Turnaround: {currentTier.leadTime}</span>
          </div>
        </div>

        {/* Retail Profit Potential Banner */}
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Projected Boutique Resale Profit:</div>
              <div className="text-2xs text-white/70">
                At standard retail MRP (₹1,499/pc), your store earns approximately <strong className="text-emerald-400 font-mono">₹{projectedProfit.toLocaleString('en-IN')}</strong> gross margin on this batch.
              </div>
            </div>
          </div>

          <a
            href={`https://wa.me/918797186001?text=Namaste%20TOLAND,%20I%20am%20interested%20in%20a%20B2B%20Wholesale%20Order%20of%20${calcQty}%20pcs%20at%20₹${currentTier.rate}/pc%20(Estimated%20Invoice:%20₹${totalWithGst.toLocaleString('en-IN')}).%20Please%20share%20catalog%20and%20GST%20quotation.`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>Lock In This Quote on WhatsApp &rarr;</span>
          </a>
        </div>
      </div>

      {/* Inquiry Form & WhatsApp Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form Container */}
        <div className="lg:col-span-2 p-8 rounded-3xl bg-surface-alt border border-border shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-text">Request Wholesale Catalog & Rate Card</h2>
            <p className="text-xs text-muted">
              Submit your trade requirements. We typically respond within 2 business hours on WhatsApp.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 rounded-2xl bg-success/10 border border-success/30 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-text">Inquiry Received!</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Namaste! We have received your wholesale request. Our B2B coordinator has sent an acknowledgement to your WhatsApp and will share the catalog shortly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Amit Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                    WhatsApp Number *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-border bg-surface text-xs font-mono font-bold text-muted">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 rounded-r-xl bg-surface border border-border text-xs font-mono text-text focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                    Shop / Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Kumar Garments"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                    Estimated Lot Quantity *
                  </label>
                  <select
                    value={formData.estimatedQty}
                    onChange={(e) => setFormData({ ...formData, estimatedQty: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-primary"
                  >
                    <option value="50 - 199 pieces">50 – 199 pieces (Tier 1)</option>
                    <option value="200 - 499 pieces">200 – 499 pieces (Tier 2)</option>
                    <option value="500+ pieces">500+ pieces (Tier 3)</option>
                    <option value="Custom OEM Manufacturing">Custom OEM / Private Label</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                    Additional Requirement Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Mention preferred fits (Slim, Regular), wash styles, or target delivery timeline..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-primary text-white hover:bg-primary-hover text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending Request...' : 'Submit Wholesale Inquiry'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Info Box */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-primary" />
              <span>Factory Showroom & Visits</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Wholesale buyers are welcome to visit our physical showroom and production floor to inspect denim rolls, sample fits, and discuss custom production runs.
            </p>
            <div className="p-3 bg-surface rounded-xl border border-border text-xs font-mono text-text">
              TOLAND Private Limited<br />
              Sheikhpura, Barbigha, Khetalpura 811101 (Bihar)
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-success" />
              <span>Instant WhatsApp Desk</span>
            </h3>
            <p className="text-xs text-muted">
              Prefer chatting directly? Message our wholesale sales lead on WhatsApp.
            </p>
            <a
              href="https://wa.me/918797186001?text=Hello%20TOLAND,%20I%20want%20to%20discuss%20a%20B2B%20wholesale%20denim%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success text-white text-xs font-bold hover:bg-success/90 transition-colors shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Chat with B2B Sales</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
