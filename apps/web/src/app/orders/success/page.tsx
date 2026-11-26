import React, { Suspense } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Package,
  Phone,
  ArrowRight,
  ShieldCheck,
  Truck,
} from 'lucide-react';

interface OrderSuccessContentProps {
  orderNo?: string;
}

function OrderSuccessContent({ orderNo }: OrderSuccessContentProps) {
  const displayOrderNo = orderNo || 'TLD-2026-CONFIRMED';

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8">
      {/* Success Badge */}
      <div className="w-20 h-20 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto text-success animate-in zoom-in-75 duration-300">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-accent">
          TOLAND Manufacturing Facility (Bihar)
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight">
          Thank You! Your Order is Confirmed.
        </h1>
        <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
          Your denim apparel has been routed to our Sheikhpura factory floor for final inspection and packing.
        </p>
      </div>

      {/* Order Reference Box */}
      <div className="p-6 rounded-2xl bg-surface-alt border border-border max-w-md mx-auto space-y-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-3xs uppercase tracking-wider font-bold text-muted">Order Reference Number</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-primary tracking-wider">
            {displayOrderNo}
          </div>
        </div>

        <div className="p-3 bg-surface rounded-xl border border-border/60 text-xs text-text flex items-center gap-2.5 text-left">
          <Phone className="w-4 h-4 text-success shrink-0" />
          <span>
            A detailed confirmation and tracking link have been queued to your WhatsApp number.
          </span>
        </div>

        <div className="pt-2">
          <Link
            href={`/orders/${displayOrderNo}`}
            className="w-full py-3 rounded-xl bg-primary text-white text-xs font-extrabold uppercase tracking-wide hover:bg-primary-hover shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            <span>Track Order Status</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Dispatch Guarantees */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left text-xs">
        <div className="p-4 rounded-xl bg-surface-alt border border-border space-y-1">
          <div className="font-bold text-text flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-primary" />
            <span>Fast Dispatch</span>
          </div>
          <p className="text-3xs text-muted">Orders dispatch within 24-48 business hours from Sheikhpura.</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-alt border border-border space-y-1">
          <div className="font-bold text-text flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Factory Inspected</span>
          </div>
          <p className="text-3xs text-muted">Every pair passes a 5-stage individual quality review.</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-alt border border-border space-y-1">
          <div className="font-bold text-text flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-primary" />
            <span>Secure Packaging</span>
          </div>
          <p className="text-3xs text-muted">Tamper-proof waterproof heavy boxed packaging.</p>
        </div>
      </div>

      <div className="pt-4">
        <Link
          href="/products"
          className="text-xs font-bold text-muted hover:text-text transition-colors"
        >
          &larr; Return to Storefront Catalog
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { order_no?: string };
}) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-muted">Loading order confirmation...</div>}>
      <OrderSuccessContent orderNo={searchParams.order_no} />
    </Suspense>
  );
}
