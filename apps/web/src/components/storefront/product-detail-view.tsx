'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import {
  ShoppingBag,
  Zap,
  Phone,
  Ruler,
  CheckCircle2,
  Truck,
  RotateCcw,
  ShieldCheck,
  Layers,
  ChevronRight,
  X,
  Share2,
} from 'lucide-react';

interface ProductDetailViewProps {
  product: any;
  variants: any[];
}

export function ProductDetailView({ product, variants }: ProductDetailViewProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];
  const discountPercent = product.mrp
    ? Math.round(((product.mrp - (selectedVariant?.price || product.base_price)) / product.mrp) * 100)
    : 0;

  const currentPrice = selectedVariant?.price || product.base_price;
  const isOutOfStock = (selectedVariant?.stock_qty || 0) <= 0;

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addToCart(
      {
        productId: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        slug: product.slug,
        sku: selectedVariant.sku,
        size: selectedVariant.size,
        fit: selectedVariant.fit || 'Regular',
        wash: selectedVariant.wash || 'Standard',
        price: currentPrice,
        mrp: product.mrp || currentPrice,
        image: '',
        stockQty: selectedVariant.stock_qty || 50,
      },
      quantity
    );

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  // WhatsApp Inquiry URL
  const waInquiryUrl = `https://wa.me/919876543210?text=${encodeURIComponent(
    `Hello TOLAND team, I would like to inquire about ${product.name} (SKU: ${selectedVariant?.sku || 'general'}, Size: ${selectedVariant?.size || 'any'}).`
  )}`;

  return (
    <div className="space-y-12">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-primary text-white shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-5 h-5 text-accent" />
          <div>
            <div className="text-xs font-bold">Added to Your Cart!</div>
            <div className="text-2xs text-white/80">{product.name} (Size {selectedVariant?.size})</div>
          </div>
          <Link
            href="/cart"
            className="ml-2 px-3 py-1 rounded-lg bg-white text-primary text-xs font-black uppercase tracking-wider hover:bg-surface"
          >
            View Cart
          </Link>
        </div>
      )}

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left: Product Imagery / Visual Showcase */}
        <div className="space-y-4">
          <div className="relative aspect-4/5 rounded-3xl bg-gradient-to-br from-surface to-surface-alt border border-border p-8 flex flex-col items-center justify-center text-center shadow-xs overflow-hidden">
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-danger text-white shadow-sm">
                {discountPercent}% OFF
              </span>
            )}

            <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase bg-surface text-muted border border-border">
              {product.category?.name || 'Denim'}
            </span>

            <div className="w-32 h-32 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
              <Layers className="w-16 h-16" />
            </div>

            <h2 className="text-lg font-black text-text max-w-sm">{product.name}</h2>
            <p className="text-xs text-muted mt-1">Authentic Sheikhpura In-House Wash</p>
          </div>

          {/* Value Highlights */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted">
            <div className="p-3 rounded-xl bg-surface-alt border border-border">
              <Truck className="w-4 h-4 mx-auto text-primary mb-1" />
              <span className="font-semibold text-text">Free Shipping</span>
              <div className="text-3xs">Orders &gt; ₹999</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-alt border border-border">
              <RotateCcw className="w-4 h-4 mx-auto text-primary mb-1" />
              <span className="font-semibold text-text">7-Day Exchange</span>
              <div className="text-3xs">Doorstep pickup</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-alt border border-border">
              <ShieldCheck className="w-4 h-4 mx-auto text-primary mb-1" />
              <span className="font-semibold text-text">Direct Factory</span>
              <div className="text-3xs">100% Cotton</div>
            </div>
          </div>
        </div>

        {/* Right: Specifications, Variant Selectors & Buying Actions */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                {selectedVariant?.fit || 'Regular'} Fit · {selectedVariant?.wash || 'Raw'} Wash
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">
              {product.name}
            </h1>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-xl bg-surface-alt border border-border flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-black text-text">₹{currentPrice}</div>
              {product.mrp && (
                <div className="text-sm text-muted line-through">MRP ₹{product.mrp}</div>
              )}
            </div>
            <div className="text-right">
              <span className="text-2xs uppercase tracking-wider font-bold text-success bg-success/15 px-2.5 py-1 rounded-full border border-success/30">
                GST Included (12%)
              </span>
              <div className="text-3xs text-muted mt-1">HSN Code: {product.hsn_code || '620342'}</div>
            </div>
          </div>

          {/* Size Selector & Size Chart Trigger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text">Select Waist Size</span>
              <button
                type="button"
                onClick={() => setSizeChartOpen(true)}
                className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors underline"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size Chart & Measurements</span>
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {variants.map((v) => {
                const isSelected = v.id === selectedVariantId;
                const isAvailable = (v.stock_qty || 0) > 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`py-3 rounded-xl text-center font-mono font-bold text-sm transition-all border ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm scale-102'
                        : isAvailable
                        ? 'bg-surface-alt border-border text-text hover:border-primary/50'
                        : 'bg-surface border-border/40 text-muted/40 cursor-not-allowed line-through'
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>

            {/* Live Stock Indicator */}
            <div className="text-xs font-semibold flex items-center gap-2 pt-1">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <span className="text-text">
                {selectedVariant?.stock_qty > 10
                  ? `In Stock (${selectedVariant.stock_qty} pieces ready at Sheikhpura warehouse)`
                  : selectedVariant?.stock_qty > 0
                  ? `Only ${selectedVariant.stock_qty} pieces remaining in stock`
                  : 'Out of Stock for this size'}
              </span>
            </div>
          </div>

          {/* Quantity Stepper & Buy Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Quantity:</span>
              <div className="flex items-center border border-border rounded-lg bg-surface">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-text hover:bg-surface-alt font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-bold font-mono">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(selectedVariant?.stock_qty || 10, quantity + 1))}
                  className="px-3 py-1.5 text-text hover:bg-surface-alt font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full py-4 rounded-xl bg-surface border-2 border-primary text-primary hover:bg-surface-alt text-sm font-black uppercase tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full py-4 rounded-xl bg-primary text-white hover:bg-primary-hover text-sm font-black uppercase tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-accent" />
                <span>Buy Now (Express)</span>
              </button>
            </div>

            {/* Direct WhatsApp Inquiry */}
            <a
              href={waInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-surface-alt border border-border text-text hover:border-success/50 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-success" />
              <span>Have a question? Inquire via WhatsApp</span>
            </a>
          </div>

          {/* Technical Specifications Table */}
          <div className="pt-6 border-t border-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Manufacturing Details
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-surface-alt rounded-lg border border-border">
                <span className="text-muted block text-2xs uppercase">Fabric Weight</span>
                <span className="font-bold text-text">13.5oz Ring-Spun Denim</span>
              </div>
              <div className="p-3 bg-surface-alt rounded-lg border border-border">
                <span className="text-muted block text-2xs uppercase">Composition</span>
                <span className="font-bold text-text">100% Pure Cotton</span>
              </div>
              <div className="p-3 bg-surface-alt rounded-lg border border-border">
                <span className="text-muted block text-2xs uppercase">Closure</span>
                <span className="font-bold text-text">Heavy-Duty Brass Shank & Zipper</span>
              </div>
              <div className="p-3 bg-surface-alt rounded-lg border border-border">
                <span className="text-muted block text-2xs uppercase">Origin</span>
                <span className="font-bold text-text">Sheikhpura, Bihar (India)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SIZE CHART MODAL */}
      {sizeChartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-alt border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-black text-text">TOLAND Denim Size Guide</h3>
                <p className="text-xs text-muted">Accurate garment measurements in inches.</p>
              </div>
              <button
                onClick={() => setSizeChartOpen(false)}
                className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface border-b border-border text-muted uppercase font-bold">
                    <th className="py-2.5 px-3">Size (Waist)</th>
                    <th className="py-2.5 px-3">Waist (in)</th>
                    <th className="py-2.5 px-3">Inseam / Length</th>
                    <th className="py-2.5 px-3">Thigh</th>
                    <th className="py-2.5 px-3">Front Rise</th>
                    <th className="py-2.5 px-3">Leg Opening</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text font-mono">
                  <tr>
                    <td className="py-2.5 px-3 font-bold">28</td>
                    <td className="py-2.5 px-3">28.5&quot;</td>
                    <td className="py-2.5 px-3">31.0&quot;</td>
                    <td className="py-2.5 px-3">21.5&quot;</td>
                    <td className="py-2.5 px-3">10.0&quot;</td>
                    <td className="py-2.5 px-3">13.5&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold">30</td>
                    <td className="py-2.5 px-3">30.5&quot;</td>
                    <td className="py-2.5 px-3">31.5&quot;</td>
                    <td className="py-2.5 px-3">22.5&quot;</td>
                    <td className="py-2.5 px-3">10.5&quot;</td>
                    <td className="py-2.5 px-3">14.0&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold">32</td>
                    <td className="py-2.5 px-3">32.5&quot;</td>
                    <td className="py-2.5 px-3">32.0&quot;</td>
                    <td className="py-2.5 px-3">23.5&quot;</td>
                    <td className="py-2.5 px-3">11.0&quot;</td>
                    <td className="py-2.5 px-3">14.5&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold">34</td>
                    <td className="py-2.5 px-3">34.5&quot;</td>
                    <td className="py-2.5 px-3">32.0&quot;</td>
                    <td className="py-2.5 px-3">24.5&quot;</td>
                    <td className="py-2.5 px-3">11.5&quot;</td>
                    <td className="py-2.5 px-3">15.0&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold">36</td>
                    <td className="py-2.5 px-3">36.5&quot;</td>
                    <td className="py-2.5 px-3">32.5&quot;</td>
                    <td className="py-2.5 px-3">25.5&quot;</td>
                    <td className="py-2.5 px-3">12.0&quot;</td>
                    <td className="py-2.5 px-3">15.5&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold">38</td>
                    <td className="py-2.5 px-3">38.5&quot;</td>
                    <td className="py-2.5 px-3">32.5&quot;</td>
                    <td className="py-2.5 px-3">26.5&quot;</td>
                    <td className="py-2.5 px-3">12.5&quot;</td>
                    <td className="py-2.5 px-3">16.0&quot;</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-surface rounded-xl border border-border text-xs text-muted">
              <span className="font-bold text-text">Pro-Tip for Raw Denim:</span> Raw/unwashed denim shrinks approximately 2–3% on first warm water wash. Order true to size or one size up if you prefer a relaxed break.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
