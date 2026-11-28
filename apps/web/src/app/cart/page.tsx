'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  Tag,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowLeft,
} from 'lucide-react';

export default function CartPage() {
  const {
    items,
    updateQty,
    removeItem,
    clearCart,
    coupon,
    applyCoupon,
    removeCoupon,
    subtotal,
    discount,
    shipping,
    total,
    itemCount,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = codeToApply || couponCode;
    setIsApplying(true);
    setCouponMessage(null);
    const res = await applyCoupon(code);
    setIsApplying(false);
    if (res.success) {
      setCouponMessage({ type: 'success', text: res.message });
      setCouponCode('');
    } else {
      setCouponMessage({ type: 'error', text: res.message });
    }
  };

  const freeShippingThreshold = 999;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-surface-alt border border-border flex items-center justify-center mx-auto text-muted">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-text">Your Denim Bag is Empty</h1>
          <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto">
            Discover our heavyweight ring-spun cotton denim styles crafted directly in Sheikhpura, Bihar.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white text-xs font-extrabold uppercase tracking-wide hover:bg-primary-hover shadow-md transition-all"
        >
          <span>Explore Denim Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 w-full max-w-full overflow-x-clip min-w-0">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">Shopping Bag</h1>
          <p className="text-xs text-muted mt-1">{itemCount} items ready for factory dispatch</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-danger hover:underline"
        >
          Clear Cart
        </button>
      </div>

      {/* Free Shipping Progress Ribbon */}
      <div className="p-4 rounded-2xl bg-surface-alt border border-border space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2 text-text">
            <Truck className="w-4 h-4 text-primary" />
            {amountNeededForFreeShipping > 0 ? (
              <span>
                Add <span className="text-primary font-black">₹{amountNeededForFreeShipping}</span> more to unlock FREE Express Delivery!
              </span>
            ) : (
              <span className="text-success font-black flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> You unlocked FREE Express Delivery!
              </span>
            )}
          </div>
          <span className="text-3xs text-muted font-mono">{freeShippingProgress}%</span>
        </div>
        <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border/50">
          <div
            className="bg-accent h-full transition-all duration-300"
            style={{ width: `${freeShippingProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Main Cart Grid: Items + Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Cart Line Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="p-3.5 sm:p-5 rounded-2xl bg-surface-alt border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-2xs"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
                <div className="w-16 h-20 rounded-xl bg-surface border border-border flex items-center justify-center text-primary shrink-0 overflow-hidden">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Layers className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <Link
                    href={`/products/${item.slug}`}
                    className="text-xs sm:text-sm font-bold text-text hover:text-primary transition-colors line-clamp-1"
                  >
                    {item.name}
                  </Link>

                  <div className="flex flex-wrap gap-1.5 text-4xs sm:text-3xs font-mono font-semibold text-muted">
                    <span className="px-1.5 py-0.5 rounded bg-surface border border-border">
                      Size: {item.size}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-surface border border-border">
                      Fit: {item.fit}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-surface border border-border">
                      SKU: {item.sku}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-sm font-black text-text font-mono">₹{item.price}</span>
                    {item.mrp && item.mrp > item.price && (
                      <span className="text-3xs text-muted line-through font-mono">MRP ₹{item.mrp}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls: Stepper & Remove */}
              <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-border">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-border rounded-lg bg-surface">
                  <button
                    type="button"
                    onClick={() => updateQty(item.variantId, item.qty - 1)}
                    className="px-2.5 py-1 text-xs font-bold text-muted hover:text-text hover:bg-surface-alt"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold font-mono">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.variantId, item.qty + 1)}
                    className="px-2.5 py-1 text-xs font-bold text-muted hover:text-text hover:bg-surface-alt"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <div className="text-sm font-black text-text">₹{item.price * item.qty}</div>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  title="Remove from bag"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Right Col: Coupon & Order Summary */}
        <div className="space-y-6">
          {/* Coupon Box */}
          <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-text">Apply Coupon</h2>
            </div>

            {coupon ? (
              <div className="p-3 rounded-xl bg-success/10 border border-success/30 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-success font-mono">{coupon.code}</span>
                  <span className="text-muted block text-2xs">
                    {coupon.type === 'percentage' ? `${coupon.value}% Discount` : `₹${coupon.value} Flat Off`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-2xs font-bold text-danger hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code (e.g. TOLAND10)"
                    className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-xs font-mono uppercase focus:outline-hidden focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    disabled={isApplying}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>

                {couponMessage && (
                  <div
                    className={`text-2xs font-semibold flex items-center gap-1 ${
                      couponMessage.type === 'success' ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {couponMessage.type === 'success' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    <span>{couponMessage.text}</span>
                  </div>
                )}

                {/* Available Quick Coupons */}
                <div className="pt-2 flex flex-wrap gap-1.5 text-3xs">
                  <span className="text-muted self-center">Try:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon('TOLAND10')}
                    className="px-2 py-0.5 rounded bg-surface border border-border font-mono font-bold text-text hover:border-primary"
                  >
                    TOLAND10 (10% Off)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon('FLAT200')}
                    className="px-2 py-0.5 rounded bg-surface border border-border font-mono font-bold text-text hover:border-primary"
                  >
                    FLAT200 (₹200 Off)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Order Summary</h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-mono text-text font-bold">₹{subtotal}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-success font-semibold">
                  <span>Coupon Savings ({coupon?.code})</span>
                  <span className="font-mono">- ₹{discount}</span>
                </div>
              )}

              <div className="flex justify-between text-muted">
                <span>Express Shipping</span>
                <span className="font-mono text-text">
                  {shipping === 0 ? <span className="text-success font-bold">FREE</span> : `₹${shipping}`}
                </span>
              </div>

              <div className="flex justify-between text-muted text-3xs">
                <span>Estimated Taxes (12% GST)</span>
                <span>Included in Price</span>
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-baseline text-sm">
                <span className="font-bold text-text">Total Payable</span>
                <span className="text-xl font-black text-text font-mono">₹{total}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full py-4 rounded-xl bg-primary text-white hover:bg-primary-hover text-sm font-black uppercase tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="pt-2 text-center text-3xs text-muted flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span>Direct factory dispatch · Cash on Delivery & Razorpay UPI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
