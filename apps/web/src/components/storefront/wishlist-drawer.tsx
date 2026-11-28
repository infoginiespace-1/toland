'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Heart,
  X,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Share2,
  RotateCcw,
  Check,
  Sparkles,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useWishlist, WishlistItem } from '@/context/wishlist-context';
import { useCart } from '@/context/cart-context';
import { createClient } from '@/lib/supabase/client';

interface WishlistDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface VariantOption {
  id: string;
  product_id: string;
  size: string;
  fit: string | null;
  wash: string | null;
  sku: string | null;
  price: number | null;
  stock_qty: number | null;
  is_active: boolean;
}

interface DrawerBanner {
  type: 'moved' | 'removed';
  item: WishlistItem;
  size?: string;
}

function sortSizeValues(a: string, b: string) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
  const order: Record<string, number> = { XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6 };
  const ordA = order[a.toUpperCase()] ?? 99;
  const ordB = order[b.toUpperCase()] ?? 99;
  if (ordA !== ordB) return ordA - ordB;
  return a.localeCompare(b);
}

export function WishlistDrawer({ isOpen: propIsOpen, onClose: propOnClose }: WishlistDrawerProps) {
  const {
    items,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isDrawerOpen,
    closeDrawer,
  } = useWishlist();
  const { addToCart, itemCount: cartCount } = useCart();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isDrawerOpen;
  const onClose = propOnClose || closeDrawer;

  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [visible, setVisible] = useState(false);

  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, VariantOption[]>>({});
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string>>({});
  const [confirmClear, setConfirmClear] = useState(false);
  const [banner, setBanner] = useState<DrawerBanner | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smooth CSS mount/unmount transitions (Tailwind v3 compatible)
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setConfirmClear(false);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setBanner(null);
        setConfirmClear(false);
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Body scroll lock & ESC key close
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Fetch live product variants for size selection inside the drawer
  const productIdsKey = useMemo(
    () => items.map((i) => i.productId).sort().join(','),
    [items]
  );

  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    let cancelled = false;
    async function loadVariants() {
      setVariantsLoading(true);
      try {
        const supabase = createClient();
        const productIds = items.map((i) => i.productId);
        const { data, error } = await supabase
          .from('product_variants')
          .select('id, product_id, size, fit, wash, sku, price, stock_qty, is_active')
          .in('product_id', productIds)
          .eq('is_active', true);

        if (cancelled) return;
        if (!error && data) {
          const grouped: Record<string, VariantOption[]> = {};
          for (const v of data as VariantOption[]) {
            if (!grouped[v.product_id]) grouped[v.product_id] = [];
            grouped[v.product_id].push(v);
          }
          for (const pid of Object.keys(grouped)) {
            grouped[pid].sort((a, b) => sortSizeValues(a.size || '', b.size || ''));
          }
          setVariantsByProduct(grouped);

          setSelectedVariantByProduct((prev) => {
            const next = { ...prev };
            for (const pid of Object.keys(grouped)) {
              const list = grouped[pid];
              const existingStillValid = list.some((v) => v.id === next[pid] && (v.stock_qty ?? 0) > 0);
              if (!existingStillValid) {
                const firstInStock = list.find((v) => (v.stock_qty ?? 0) > 0) || list[0];
                if (firstInStock) next[pid] = firstInStock.id;
              }
            }
            return next;
          });
        }
      } catch (err) {
        console.error('Wishlist variants load error:', err);
      } finally {
        if (!cancelled) setVariantsLoading(false);
      }
    }

    loadVariants();
    return () => {
      cancelled = true;
    };
  }, [isOpen, productIdsKey, items]);

  const totals = useMemo(() => {
    let totalValue = 0;
    let totalSavings = 0;
    for (const item of items) {
      totalValue += Number(item.price || 0);
      if (item.mrp && item.mrp > item.price) {
        totalSavings += item.mrp - item.price;
      }
    }
    return { totalValue, totalSavings };
  }, [items]);

  const handleMoveToBag = (item: WishlistItem) => {
    const productVariants = variantsByProduct[item.productId] || [];
    const chosenId = selectedVariantByProduct[item.productId];
    const variant =
      productVariants.find((v) => v.id === chosenId) ||
      productVariants.find((v) => (v.stock_qty ?? 0) > 0);

    if (!variant || (variant.stock_qty ?? 0) <= 0) return;

    addToCart(
      {
        productId: item.productId,
        variantId: variant.id,
        name: item.name,
        slug: item.slug,
        sku: variant.sku || `SKU-${variant.size}`,
        size: variant.size,
        fit: variant.fit || 'Regular',
        wash: variant.wash || 'Indigo',
        price: Number(variant.price ?? item.price),
        mrp: Number(item.mrp ?? item.price),
        image: item.image || '',
        stockQty: variant.stock_qty ?? 10,
      },
      1
    );

    removeFromWishlist(item.productId, true);
    setBanner({ type: 'moved', item, size: variant.size });
  };

  const handleRemoveItem = (item: WishlistItem) => {
    removeFromWishlist(item.productId, true);
    setBanner({ type: 'removed', item });
  };

  const handleUndoBanner = () => {
    if (!banner) return;
    addToWishlist(banner.item);
    setBanner(null);
  };

  const handleShareWhatsApp = () => {
    if (items.length === 0) return;
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://toland-web.vercel.app';
    const lines = items.map(
      (item, idx) =>
        `${idx + 1}. *${item.name}* — ₹${Number(item.price).toLocaleString('en-IN')}\n${origin}/products/${item.slug || item.productId}`
    );
    const text = `Check out my saved TOLAND Denim shortlist:\n\n${lines.join('\n\n')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  if (!mounted || !shouldRender) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Saved Wishlist Drawer"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Panel */}
      <div
        className={`relative z-10 w-full max-w-[430px] h-[100dvh] bg-white border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shrink-0">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Saved Wishlist
                </h3>
                {items.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {items.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                {items.length > 0
                  ? `Estimated value: ₹${totals.totalValue.toLocaleString('en-IN')}`
                  : 'Shortlist your favorite TOLAND fits'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-alt border border-border flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Close Wishlist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inline Action / Undo Feedback Banner */}
        {banner && (
          <div className="mx-4 mt-3 px-3.5 py-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-2 text-xs shadow-sm shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate font-medium">
                {banner.type === 'moved'
                  ? `Moved ${banner.item.name}${banner.size ? ` (${banner.size})` : ''} to Bag`
                  : `Removed ${banner.item.name}`}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {banner.type === 'moved' && (
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:bg-emerald-400 transition-colors"
                >
                  View Bag
                </Link>
              )}
              <button
                type="button"
                onClick={handleUndoBanner}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            </div>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface-alt/60">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12 space-y-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-400 shadow-sm">
                  <Heart className="w-9 h-9" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-border shadow-sm flex items-center justify-center text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-xs">
                <h4 className="text-base font-extrabold text-slate-900">
                  {banner?.type === 'moved' ? 'Moved Everything to Your Bag' : 'Your Wishlist is Empty'}
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  {banner?.type === 'moved'
                    ? 'Ready to place your order? Head over to your shopping bag or keep exploring.'
                    : 'Tap the heart icon on any jeans, joggers, or jackets to compare styles and pick sizes anytime.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xs">
                {[
                  { label: 'Slim Fit', href: '/products?fit=Slim' },
                  { label: 'Straight Leg', href: '/products?fit=Regular' },
                  { label: 'Raw Denim', href: '/products?wash=Raw' },
                  { label: 'Jackets', href: '/products?category=casual-jackets-shirts' },
                ].map((tag) => (
                  <Link
                    key={tag.label}
                    href={tag.href}
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-full bg-white border border-border text-[11px] font-semibold text-slate-700 hover:border-primary hover:text-primary transition-colors"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>

              <div className="flex flex-col w-full max-w-xs gap-2 pt-1">
                {cartCount > 0 && (
                  <Link
                    href="/cart"
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Go to Shopping Bag ({cartCount})</span>
                  </Link>
                )}
                <Link
                  href="/products"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>Explore Denim Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            items.map((item) => {
              const discountPct =
                item.mrp && item.mrp > item.price
                  ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
                  : 0;
              const productVariants = variantsByProduct[item.productId] || [];
              const selectedVarId = selectedVariantByProduct[item.productId];
              const selectedVariant = productVariants.find((v) => v.id === selectedVarId);
              const totalStock = productVariants.reduce((sum, v) => sum + (v.stock_qty || 0), 0);
              const canQuickAdd = Boolean(selectedVariant && (selectedVariant.stock_qty ?? 0) > 0);

              return (
                <div
                  key={item.productId}
                  className="p-3.5 rounded-2xl bg-white border border-border hover:border-slate-300 shadow-subtle transition-all space-y-3"
                >
                  <div className="flex gap-3.5">
                    {/* Thumbnail */}
                    <Link
                      href={`/products/${item.slug || item.productId}`}
                      onClick={onClose}
                      className="w-20 h-24 rounded-xl bg-surface-alt border border-border overflow-hidden shrink-0 relative group block"
                    >
                      {discountPct > 0 && (
                        <span className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-md bg-danger text-white text-[9px] font-extrabold leading-none">
                          {discountPct}% OFF
                        </span>
                      )}
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted">
                          TOLAND
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/products/${item.slug || item.productId}`}
                            onClick={onClose}
                            className="text-xs font-bold text-slate-900 hover:text-primary transition-colors line-clamp-2 leading-snug"
                          >
                            {item.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item)}
                            className="p-1.5 -mt-1 -mr-1 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors shrink-0 cursor-pointer"
                            title="Remove from wishlist"
                            aria-label={`Remove ${item.name} from wishlist`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.category && (
                          <p className="text-[11px] text-muted mt-0.5 truncate">{item.category}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold font-mono text-slate-900">
                            ₹{Number(selectedVariant?.price ?? item.price).toLocaleString('en-IN')}
                          </span>
                          {item.mrp && item.mrp > item.price && (
                            <span className="text-[11px] text-muted line-through font-mono">
                              ₹{Number(item.mrp).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        {!variantsLoading && productVariants.length > 0 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              totalStock === 0
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : (selectedVariant?.stock_qty ?? 0) <= 3
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {totalStock === 0
                              ? 'Out of Stock'
                              : (selectedVariant?.stock_qty ?? 0) <= 3
                                ? `Only ${selectedVariant?.stock_qty} left`
                                : 'In Stock'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Size Picker + Move to Bag Row */}
                  <div className="pt-2.5 border-t border-border-subtle flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap min-w-0">
                      {variantsLoading && productVariants.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Loading sizes...</span>
                        </span>
                      ) : productVariants.length > 0 ? (
                        productVariants.slice(0, 5).map((variant) => {
                          const isOut = (variant.stock_qty ?? 0) <= 0;
                          const isSelected = selectedVarId === variant.id;
                          return (
                            <button
                              key={variant.id}
                              type="button"
                              disabled={isOut}
                              onClick={() =>
                                setSelectedVariantByProduct((prev) => ({
                                  ...prev,
                                  [item.productId]: variant.id,
                                }))
                              }
                              className={`h-7 min-w-[28px] px-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                                isOut
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed opacity-60'
                                  : isSelected
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                    : 'bg-surface-alt border-border text-slate-700 hover:border-slate-400'
                              }`}
                              title={isOut ? `Size ${variant.size} out of stock` : `Size ${variant.size}`}
                            >
                              {variant.size}
                            </button>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-muted">Multiple fits available</span>
                      )}
                    </div>

                    {canQuickAdd ? (
                      <button
                        type="button"
                        onClick={() => handleMoveToBag(item)}
                        className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-[11px] font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Bag</span>
                      </button>
                    ) : (
                      <Link
                        href={`/products/${item.slug || item.productId}`}
                        onClick={onClose}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <span>View Product</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Smart Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-border bg-white space-y-3 shrink-0">
            {/* Value & Savings Strip */}
            <div className="flex items-center justify-between text-xs px-1">
              <div>
                <span className="text-muted">Shortlist Total: </span>
                <strong className="font-mono text-slate-900">
                  ₹{totals.totalValue.toLocaleString('en-IN')}
                </strong>
              </div>
              {totals.totalSavings > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Save ₹{totals.totalSavings.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Primary CTA Buttons */}
            <div className="flex items-center gap-2">
              {cartCount > 0 ? (
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>View Bag ({cartCount})</span>
                </Link>
              ) : (
                <Link
                  href="/products"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Explore More</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3.5 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="Share Wishlist on WhatsApp"
                aria-label="Share Wishlist on WhatsApp"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>

            {/* Clear All Double Confirmation */}
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="w-full py-1 text-[11px] font-semibold text-muted hover:text-danger transition-colors text-center cursor-pointer"
              >
                Clear All Saved Items
              </button>
            ) : (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px]">
                <span className="font-semibold text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Remove all {items.length} items?</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      clearWishlist();
                      setConfirmClear(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-danger text-white font-bold cursor-pointer"
                  >
                    Yes, Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-border text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
