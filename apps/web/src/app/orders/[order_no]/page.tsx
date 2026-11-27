import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Layers,
  MapPin,
  Phone,
  ArrowLeft,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface OrderTrackingPageProps {
  params: {
    order_no: string;
  };
}

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const supabase = createClient();

  const { data: order } = (await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        variant:product_variants (
          size,
          fit,
          wash,
          product:products (
            name,
            slug,
            images:product_images (
              path,
              sort
            )
          )
        )
      ),
      history:order_status_history (*)
    `)
    .eq('order_no', params.order_no)
    .single()) as any;

  if (!order) {
    notFound();
  }

  const orderRecord = order as any;
  const address = orderRecord.address_snapshot || {};
  const items = orderRecord.order_items || [];
  const status = orderRecord.status || 'confirmed';

  // 5 Stages of fulfillment
  const stages = [
    { key: 'placed', label: 'Order Placed', desc: 'Received at facility' },
    { key: 'confirmed', label: 'Order Confirmed', desc: 'Stock allocated' },
    { key: 'packed', label: 'Factory Packed', desc: 'Inspected & sealed' },
    { key: 'shipped', label: 'Dispatched', desc: 'In-transit with courier' },
    { key: 'delivered', label: 'Delivered', desc: 'Handed to recipient' },
  ];

  const getStageIndex = (currentStatus: string) => {
    switch (currentStatus.toLowerCase()) {
      case 'pending':
        return 0;
      case 'confirmed':
        return 1;
      case 'packed':
      case 'processing':
        return 2;
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 1;
    }
  };

  const currentStageIndex = getStageIndex(status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top back navigation */}
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {/* Main Order Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-alt border border-border shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border gap-4">
          <div>
            <span className="text-3xs uppercase tracking-wider font-bold text-muted">Tracking Order</span>
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-primary mt-0.5">
              {orderRecord.order_no}
            </h1>
            <p className="text-xs text-muted mt-1">
              Placed on {new Date(orderRecord.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-success/15 text-success border border-success/30">
              Status: {status}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-surface border border-border text-muted">
              {orderRecord.payment_method?.toUpperCase()} · {orderRecord.payment_status}
            </span>
            <Link
              href={`/orders/${orderRecord.order_no}/invoice`}
              className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-white hover:bg-slate-50 text-slate-900 border border-border shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Tax Invoice (PDF)</span>
            </Link>
          </div>
        </div>

        {/* 5-Stage Status Timeline */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Fulfillment Journey</h2>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {stages.map((stage, idx) => {
              const isPast = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div
                  key={stage.key}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-surface border-primary ring-1 ring-primary shadow-xs'
                      : isPast
                      ? 'bg-surface-alt border-success/40'
                      : 'bg-surface/40 border-border/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-muted/40 text-3xs flex items-center justify-center font-mono">
                        {idx + 1}
                      </div>
                    )}
                    <span className={`text-xs font-bold ${isCurrent ? 'text-primary' : 'text-text'}`}>
                      {stage.label}
                    </span>
                  </div>
                  <p className="text-3xs text-muted">{stage.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Address & Order Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-border">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Delivery Address</span>
            </h3>
            <div className="p-4 rounded-xl bg-surface border border-border text-xs text-text space-y-1">
              <div className="font-bold">{address.name}</div>
              <div>{address.line1}</div>
              {address.line2 && <div>{address.line2}</div>}
              <div>
                {address.city}, {address.state} - <span className="font-mono font-semibold">{address.pincode}</span>
              </div>
              <div className="text-muted pt-1">Phone: +{address.phone}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-success" />
              <span>Live Updates & Support</span>
            </h3>
            <div className="p-4 rounded-xl bg-surface border border-border text-xs text-text space-y-3">
              <p className="text-muted leading-relaxed">
                Order status milestones and dispatch notifications are dispatched directly to your WhatsApp number.
              </p>
              <a
                href={`https://wa.me/918797186001?text=${encodeURIComponent(
                  `Hello TOLAND Support, I am tracking my order ${orderRecord.order_no}. Please provide an update.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-success hover:underline"
              >
                <span>Need assistance? Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="space-y-3 pt-6 border-t border-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Ordered Denim Items ({items.length})
          </h3>

          <div className="divide-y divide-border border border-border rounded-xl bg-surface overflow-hidden">
            {items.map((item: any) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-alt border border-border flex items-center justify-center text-primary shrink-0 overflow-hidden">
                    {item.variant?.product?.images?.[0]?.path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.variant.product.images[0].path}
                        alt={item.variant.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Layers className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-text">
                      {item.variant?.product?.name || 'TOLAND Denim Item'}
                    </div>
                    <div className="text-3xs text-muted font-mono">
                      Size: {item.variant?.size || 'N/A'} · Fit: {item.variant?.fit || 'Regular'} · Qty: {item.qty}
                    </div>
                  </div>
                </div>

                <div className="font-mono font-bold text-text">
                  ₹{item.price * item.qty}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Summary */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="text-muted">
            Includes GST and direct shipping from Sheikhpura, Bihar manufacturing warehouse.
          </div>
          <div className="text-right">
            <span className="text-muted text-xs mr-2">Total Amount:</span>
            <span className="text-2xl font-black font-mono text-text">₹{orderRecord.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
