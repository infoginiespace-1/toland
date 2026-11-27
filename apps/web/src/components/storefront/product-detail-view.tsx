'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { FitFinderModal } from '@/components/storefront/fit-finder-modal';
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
  Star,
  Play,
  MessageSquare,
  Sparkles,
  Loader2,
  Quote,
  MapPin,
  Heart,
} from 'lucide-react';

interface ProductDetailViewProps {
  product: any;
  variants: any[];
  images?: any[];
  reviews?: any[];
}

export function ProductDetailView({
  product,
  variants,
  images = [],
  reviews: initialReviews = [],
}: ProductDetailViewProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [fitFinderOpen, setFitFinderOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  // Reviews State
  const [reviewsList, setReviewsList] = useState<any[]>(initialReviews);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Pincode & Delivery Estimation State
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<{
    checked: boolean;
    valid: boolean;
    city?: string;
    estimate?: string;
    days?: string;
    cod: boolean;
    freeShipping: boolean;
    message?: string;
  } | null>(null);

  // Review Form Fields
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImageUrl, setReviewImageUrl] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];
  const discountPercent = product.mrp
    ? Math.round(((product.mrp - (selectedVariant?.price || product.base_price)) / product.mrp) * 100)
    : 0;

  const currentPrice = selectedVariant?.price || product.base_price;

  const verifyPincode = (pin: string) => {
    const clean = pin.trim();
    if (!/^[1-9][0-9]{5}$/.test(clean)) {
      setPincodeStatus({
        checked: true,
        valid: false,
        cod: false,
        freeShipping: false,
        message: 'Please enter a valid 6-digit Indian PIN code.',
      });
      return;
    }

    try {
      localStorage.setItem('toland_pincode', clean);
    } catch (e) {}

    const prefix = clean.substring(0, 2);
    let days = '3-5 business days';
    let region = 'Rest of India';
    let daysToAdd = 4;

    if (prefix >= '80' && prefix <= '85') {
      days = '24-48 hours (Factory Express)';
      region = 'Bihar & Neighboring Hubs';
      daysToAdd = 2;
    } else if (['11', '12', '20', '40', '56', '70', '50', '60'].includes(prefix)) {
      days = '2-3 business days';
      region = 'Metro Express Transit';
      daysToAdd = 3;
    }

    const estDate = new Date();
    estDate.setDate(estDate.getDate() + daysToAdd);
    const formattedDate = estDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    setPincodeStatus({
      checked: true,
      valid: true,
      city: region,
      estimate: formattedDate,
      days,
      cod: true,
      freeShipping: currentPrice >= 999,
    });
  };

  React.useEffect(() => {
    try {
      const savedPin = localStorage.getItem('toland_pincode');
      if (savedPin && /^[1-9][0-9]{5}$/.test(savedPin)) {
        setPincode(savedPin);
        verifyPincode(savedPin);
      }
    } catch (e) {}
  }, []);
  const isOutOfStock = (selectedVariant?.stock_qty || 0) <= 0;
  const currentImgObj = images[activeImageIndex] || images[0];
  const currentImage = currentImgObj?.path || '';

  const isVideoUrl = (path: string, mediaType?: string) => {
    if (mediaType === 'video') return true;
    const lower = (path || '').toLowerCase();
    return (
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.mov') ||
      lower.includes('/video/')
    );
  };

  const isCurrentVideo = isVideoUrl(currentImage, currentImgObj?.media_type);

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
        image: currentImage,
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
  const waInquiryUrl = `https://wa.me/918797186001?text=${encodeURIComponent(
    `Hello TOLAND team, I would like to inquire about ${product.name} (SKU: ${selectedVariant?.sku || 'general'}, Size: ${selectedVariant?.size || 'any'}).`
  )}`;

  // Submit Review Handler
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      setReviewError('Please enter your name and review feedback.');
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError(null);

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          customer_name: reviewName,
          customer_email: reviewEmail,
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment,
          image_url: reviewImageUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      if (data.review) {
        setReviewsList((prev) => [data.review, ...prev]);
      }

      setReviewSuccess(true);
      setTimeout(() => {
        setReviewSuccess(false);
        setReviewModalOpen(false);
        setReviewName('');
        setReviewEmail('');
        setReviewTitle('');
        setReviewComment('');
        setReviewImageUrl('');
      }, 2000);
    } catch (err: any) {
      setReviewError(err?.message || 'Server error. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Review Summary Metrics
  const totalReviewsCount = reviewsList.length;
  const avgScore =
    totalReviewsCount > 0
      ? (
          reviewsList.reduce((acc, r) => acc + (r.rating || 5), 0) /
          totalReviewsCount
        ).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-12">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-primary text-white shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-5 h-5 text-accent" />
          <div>
            <div className="text-xs font-bold">Added to Your Cart!</div>
            <div className="text-2xs text-white/80">
              {product.name} (Size {selectedVariant?.size})
            </div>
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
          {/* Main Visual Display (Supports High-Res Images, GIFs, & Autoplay Videos) */}
          <div className="relative aspect-4/5 rounded-3xl bg-surface border border-border shadow-md overflow-hidden group">
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-danger text-white shadow-sm">
                {discountPercent}% OFF
              </span>
            )}

            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-surface/90 backdrop-blur-xs text-text border border-border">
                {product.category?.name || 'Denim'}
              </span>
              <button
                type="button"
                onClick={() =>
                  toggleWishlist({
                    productId: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: currentPrice,
                    mrp: product.mrp,
                    image: currentImage,
                    category: product.category?.name,
                  })
                }
                className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs border border-border flex items-center justify-center text-text hover:text-rose-500 shadow-sm transition-transform active:scale-90 cursor-pointer"
                aria-label="Save to Wishlist"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isInWishlist(product.id)
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-slate-600'
                  }`}
                />
              </button>
            </div>

            {currentImage ? (
              isCurrentVideo ? (
                <video
                  src={currentImage}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )
            ) : (
              <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-surface to-surface-alt">
                <div className="w-32 h-32 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
                  <Layers className="w-16 h-16" />
                </div>
                <h2 className="text-lg font-black text-text max-w-sm">{product.name}</h2>
                <p className="text-xs text-muted mt-1">Authentic Sheikhpura In-House Wash</p>
              </div>
            )}
          </div>

          {/* Interactive Thumbnails Gallery */}
          {images && images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img: any, idx: number) => {
                const isActive = idx === activeImageIndex;
                const isThumbVideo = isVideoUrl(img.path, img.media_type);
                const isThumbGif = (img.path || '').toLowerCase().endsWith('.gif');

                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-primary ring-2 ring-primary/20 shadow-sm scale-102'
                        : 'border-border hover:border-primary/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.path}
                      alt={`${product.name} angle ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Video Demo Badge Overlay */}
                    {isThumbVideo && (
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-white/95 text-primary flex items-center justify-center shadow-md">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* GIF Tag */}
                    {isThumbGif && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-purple-700 text-white text-[9px] font-bold uppercase tracking-wider">
                        GIF
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Value Highlights */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted">
            <div className="p-3 rounded-xl bg-surface-alt border border-border">
              <Truck className="w-4 h-4 mx-auto text-primary mb-1" />
              <span className="font-semibold text-text">Free Shipping</span>
              <div className="text-[11px] text-muted">Orders &gt; ₹999</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-alt border border-border">
              <RotateCcw className="w-4 h-4 mx-auto text-primary mb-1" />
              <span className="font-semibold text-text">7-Day Exchange</span>
              <div className="text-[11px] text-muted">Doorstep pickup</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-alt border border-border">
              <ShieldCheck className="w-4 h-4 mx-auto text-primary mb-1" />
              <span className="font-semibold text-text">Direct Factory</span>
              <div className="text-[11px] text-muted">100% Cotton</div>
            </div>
          </div>
        </div>

        {/* Right: Specifications, Variant Selectors & Buying Actions */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                {selectedVariant?.fit || 'Regular'} Fit · {selectedVariant?.wash || 'Raw'} Wash
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
              {product.name}
            </h1>

            {/* Star Rating Badge - Click to Scroll to Reviews */}
            <a
              href="#customer-reviews"
              className="inline-flex items-center gap-2 text-xs font-semibold hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-0.5 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-text">{avgScore}</span>
              <span className="text-muted">
                ({totalReviewsCount} Verified {totalReviewsCount === 1 ? 'Review' : 'Reviews'})
              </span>
            </a>

            <p className="text-xs sm:text-sm text-muted leading-relaxed pt-1">
              {product.description}
            </p>

            {/* Live Social Proof & Scarcity Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                <span>🔥</span>
                <span>19 pairs ordered in last 24h</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                <span>👁️</span>
                <span>28 people viewing right now</span>
              </span>
              {(selectedVariant?.stock_qty || 0) <= 5 && (selectedVariant?.stock_qty || 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  <span>⚡</span>
                  <span>Hurry, only {selectedVariant.stock_qty} left in Waist {selectedVariant.size}!</span>
                </span>
              )}
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-xl bg-surface-alt border border-border flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-bold text-slate-900">₹{currentPrice}</div>
              {product.mrp && (
                <div className="text-sm text-muted line-through">MRP ₹{product.mrp}</div>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-success bg-success/15 px-2.5 py-1 rounded-full border border-success/30">
                GST Included (12%)
              </span>
              <div className="text-[11px] text-muted mt-1">HSN Code: {product.hsn_code || '620342'}</div>
            </div>
          </div>

          {/* Size Selector & Size Chart Trigger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text">
                Select Waist Size:
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFitFinderOpen(true)}
                  className="text-xs font-bold text-accent hover:text-accent/80 flex items-center gap-1 cursor-pointer bg-accent/10 hover:bg-accent/15 px-2.5 py-1 rounded-lg border border-accent/25 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Find My Fit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSizeChartOpen(true)}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Chart</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {variants.map((v) => {
                const isSelected = v.id === selectedVariantId;
                const isVariantOos = (v.stock_qty || 0) <= 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    disabled={isVariantOos}
                    className={`min-w-[48px] h-11 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : isVariantOos
                        ? 'border-border bg-surface-alt text-muted/40 cursor-not-allowed line-through'
                        : 'border-border bg-white text-text hover:border-primary/50'
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-text">Quantity:</span>
            <div className="flex items-center border border-border rounded-xl bg-surface-alt p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-text hover:bg-white transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="w-10 text-center text-xs font-bold font-mono">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-text hover:bg-white transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions: Add to Cart & Buy Now */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full py-3.5 px-4 rounded-xl border border-border bg-white text-text text-xs font-bold uppercase tracking-wider hover:bg-surface-alt transition-colors shadow-subtle flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4 text-primary" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full py-3.5 px-4 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>Buy It Now</span>
              </button>
            </div>

            {/* WhatsApp Inquiry Button */}
            <a
              href={waInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl border border-success/30 bg-success/10 text-success text-xs font-bold transition-colors flex items-center justify-center gap-2 hover:bg-success/20"
            >
              <Phone className="w-4 h-4" />
              <span>Inquire via WhatsApp Desk</span>
            </a>
          </div>

          {/* Pincode & Delivery Date Checker */}
          <div className="p-4 rounded-2xl bg-surface-alt border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>Delivery & COD Availability</span>
              </span>
              {pincodeStatus?.valid && (
                <button
                  type="button"
                  onClick={() => {
                    setPincodeStatus(null);
                    setPincode('');
                    try {
                      localStorage.removeItem('toland_pincode');
                    } catch (e) {}
                  }}
                  className="text-2xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Change Pincode
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPincode(val);
                    if (val.length === 6) verifyPincode(val);
                  }}
                  placeholder="Enter 6-digit Pincode (e.g. 811101, 110001)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-xs font-mono font-bold text-text placeholder:text-muted focus:outline-none focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => verifyPincode(pincode)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Check
              </button>
            </div>

            {/* Verification Result */}
            {pincodeStatus?.checked && (
              <div className="pt-2 border-t border-slate-200/60 space-y-2 animate-in fade-in duration-150">
                {pincodeStatus.valid ? (
                  <>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                      <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Delivery by <strong className="underline">{pincodeStatus.estimate}</strong> ({pincodeStatus.days})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs font-medium text-slate-700 pt-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Cash on Delivery (COD) Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{pincodeStatus.freeShipping ? 'Free Factory Express Shipping' : 'Standard Shipping ₹99'}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-danger font-semibold flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>{pincodeStatus.message || 'Invalid postal code'}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Manufacturing Specifications */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text">
              Direct-From-Mill Specifications
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

      {/* CUSTOMER REVIEWS & RATINGS SECTION */}
      <section id="customer-reviews" className="pt-10 border-t border-border space-y-8 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Customer Feedback</span>
            </div>
            <h2 className="text-2xl font-extrabold text-text tracking-tight">
              Customer Reviews ({totalReviewsCount})
            </h2>
            <p className="text-xs text-muted mt-1">
              Genuine feedback from customers wearing authentic TOLAND denim.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setReviewModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Star className="w-4 h-4 fill-white" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Reviews List */}
        {reviewsList.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-border bg-surface-alt text-center space-y-3">
            <MessageSquare className="w-8 h-8 mx-auto text-muted" />
            <h3 className="text-sm font-bold text-text">Be the first to review this denim</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Share your fit, wash, and comfort experience with fellow denim enthusiasts.
            </p>
            <button
              type="button"
              onClick={() => setReviewModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer"
            >
              Write First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviewsList.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-white border border-border shadow-card flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < (rev.rating || 5)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    {rev.is_verified_buyer !== false && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  {rev.title && (
                    <h4 className="text-xs font-bold text-text leading-snug">{rev.title}</h4>
                  )}

                  <p className="text-xs text-muted leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>

                  {rev.image_url && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-border max-h-48 bg-slate-50 relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={rev.image_url}
                        alt={rev.title || 'Customer fit photo'}
                        className="w-full h-40 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-bold tracking-wider uppercase">
                        Fit Photo
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-3xs text-muted">
                  <span className="font-bold text-text">{rev.customer_name}</span>
                  <span>
                    {rev.created_at
                      ? new Date(rev.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Verified Buyer'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* WRITE A REVIEW MODAL */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-text">Rate & Review Your Experience</h3>
                <p className="text-xs text-muted">{product.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-text cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-text">Review Submitted Successfully!</h4>
                <p className="text-xs text-muted">
                  Thank you for your valuable feedback. Your review is now live on TOLAND.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                {/* Star Picker */}
                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Overall Rating *
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-amber-400 hover:scale-115 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (hoverRating || reviewRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-bold text-text text-sm">
                      {hoverRating || reviewRating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface-alt text-xs focus:outline-none focus:border-primary font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                      Email or Mobile (Optional)
                    </label>
                    <input
                      type="text"
                      value={reviewEmail}
                      onChange={(e) => setReviewEmail(e.target.value)}
                      placeholder="e.g. ramesh@gmail.com"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface-alt text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Review Headline / Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Authentic denim weight, fits true to waist"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-alt text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Your Review & Experience *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about the fabric feel, stitching quality, stone-washing fade, and overall fit..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-alt text-xs focus:outline-none focus:border-primary leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Fit Photo / Wearer Photo URL (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="url"
                      value={reviewImageUrl}
                      onChange={(e) => setReviewImageUrl(e.target.value)}
                      placeholder="https://... (e.g. Imgur, Cloudinary image link)"
                      className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface-alt text-xs focus:outline-none focus:border-primary"
                    />
                    {reviewImageUrl.trim() && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0 bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={reviewImageUrl}
                          alt="Fit Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted mt-1">
                    Add a picture wearing this denim to showcase real fit and styling to buyers.
                  </p>
                </div>

                {reviewError && (
                  <p className="text-xs text-danger font-semibold">{reviewError}</p>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    disabled={submittingReview}
                    className="px-4 py-2 rounded-xl border border-border font-bold text-muted hover:text-text hover:bg-surface-alt cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary-hover shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit Verified Review</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
                className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface cursor-pointer"
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

      {/* Interactive Find My Fit Size Recommendation Modal */}
      <FitFinderModal
        isOpen={fitFinderOpen}
        onClose={() => setFitFinderOpen(false)}
        availableSizes={variants.map((v) => v.size)}
        onSelectSize={(size) => {
          const matching = variants.find((v) => v.size === size);
          if (matching) setSelectedVariantId(matching.id);
        }}
      />
    </div>
  );
}
