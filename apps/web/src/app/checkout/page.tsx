'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import {
  CreditCard,
  Banknote,
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Layers,
  Phone,
  Lock,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, discount, shipping, total, coupon, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Bihar',
    pincode: '',
    paymentMethod: 'cod' as 'cod' | 'razorpay',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const indianStates = [
    'Bihar',
    'Jharkhand',
    'West Bengal',
    'Uttar Pradesh',
    'Delhi',
    'Maharashtra',
    'Karnataka',
    'Gujarat',
    'Rajasthan',
    'Punjab',
    'Haryana',
    'Madhya Pradesh',
    'Tamil Nadu',
    'Odisha',
    'Assam',
    'Other States / UTs',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage('Your bag is empty.');
      return;
    }

    if (!formData.customerName || !formData.phone || !formData.addressLine1 || !formData.city || !formData.pincode) {
      setErrorMessage('Please fill in all mandatory delivery details.');
      return;
    }

    const cleanPin = formData.pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit WhatsApp phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: formData.customerName.trim(),
        phone: cleanPhone,
        email: formData.email.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim(),
        city: formData.city.trim(),
        state: formData.state,
        pincode: cleanPin,
        paymentMethod: formData.paymentMethod,
        couponCode: coupon?.code,
        items: items.map((i) => ({
          variantId: i.variantId,
          productId: i.productId,
          name: i.name,
          size: i.size,
          price: i.price,
          qty: i.qty,
        })),
      };

      const res = await fetch('/api/checkout/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process order.');
      }

      // Order created successfully!
      clearCart();
      router.push(`/orders/success?order_no=${data.order_no}`);
    } catch (err: any) {
      console.error('[Checkout error]', err);
      setErrorMessage(err?.message || 'Something went wrong while placing your order. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <h1 className="text-2xl font-black text-text">No items to checkout</h1>
        <p className="text-xs text-muted">Please add denim items to your cart before proceeding.</p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">Express Checkout</h1>
          <p className="text-xs text-muted mt-1">Direct from Sheikhpura manufacturing facility</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <Lock className="w-3.5 h-3.5 text-success" />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Shipping Details & Payment Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Contact & Shipping Address Card */}
          <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Truck className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-text">1. Delivery Address</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                  WhatsApp Phone Number *
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
                <span className="text-3xs text-muted block mt-1">Live order updates will be sent via WhatsApp.</span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                  Street Address / Flat / Building *
                </label>
                <input
                  type="text"
                  required
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  placeholder="House No, Street, Colony or Landmark"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                  Area / Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  placeholder="Near Post Office or Landmark"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-primary"
                />
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
                  placeholder="e.g. Sheikhpura or Patna"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                  State *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-primary"
                >
                  {indianStates.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                  6-Digit PIN Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="811101"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-text focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* 2. Payment Method Card */}
          <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <CreditCard className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-text">2. Payment Method</h2>
            </div>

            <div className="space-y-3">
              {/* Cash On Delivery */}
              <label
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  formData.paymentMethod === 'cod'
                    ? 'bg-surface border-primary shadow-xs ring-1 ring-primary'
                    : 'bg-surface/50 border-border hover:bg-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                    className="accent-primary w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-bold text-text flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-primary" />
                      <span>Cash on Delivery (COD)</span>
                    </div>
                    <div className="text-3xs text-muted mt-0.5">Pay in cash or UPI when your parcel arrives.</div>
                  </div>
                </div>
                <span className="text-2xs font-bold uppercase text-success bg-success/10 px-2 py-0.5 rounded">
                  No Extra Charge
                </span>
              </label>

              {/* Online Payment via Razorpay */}
              <label
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  formData.paymentMethod === 'razorpay'
                    ? 'bg-surface border-primary shadow-xs ring-1 ring-primary'
                    : 'bg-surface/50 border-border hover:bg-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={formData.paymentMethod === 'razorpay'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'razorpay' })}
                    className="accent-primary w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-bold text-text flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span>Online Payment (UPI, Cards, Netbanking)</span>
                    </div>
                    <div className="text-3xs text-muted mt-0.5">Pay instantly via Google Pay, PhonePe, Paytm or Card.</div>
                  </div>
                </div>
                <span className="text-2xs font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">
                  Instant Dispatch
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Items Overview & Order Finalization */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Order Review</h2>

            {/* Item list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-border/60">
              {items.map((item) => (
                <div key={item.variantId} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-primary shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-text truncate">{item.name}</div>
                      <div className="text-3xs text-muted font-mono">
                        Size: {item.size} · Qty: {item.qty}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-text shrink-0">
                    ₹{item.price * item.qty}
                  </div>
                </div>
              ))}
            </div>

            {/* Financials */}
            <div className="space-y-2 pt-4 border-t border-border text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="font-mono text-text">₹{subtotal}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-success font-semibold">
                  <span>Discount ({coupon?.code})</span>
                  <span className="font-mono">- ₹{discount}</span>
                </div>
              )}

              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span className="font-mono text-text">
                  {shipping === 0 ? <span className="text-success font-bold">FREE</span> : `₹${shipping}`}
                </span>
              </div>

              <div className="flex justify-between text-muted text-3xs">
                <span>12% GST</span>
                <span>Included</span>
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="font-bold text-text">Total Amount</span>
                <span className="text-2xl font-black text-text font-mono">₹{total}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-primary text-white hover:bg-primary-hover text-sm font-black uppercase tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Placing Your Order...</span>
              ) : (
                <>
                  <span>Confirm & Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center text-3xs text-muted space-y-1 pt-1">
              <div className="flex items-center justify-center gap-1 text-success font-semibold">
                <Phone className="w-3 h-3" />
                <span>Instant WhatsApp order receipt sent on placement.</span>
              </div>
              <div>Ships from TOLAND, Sheikhpura, Barbigha (Bihar).</div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
