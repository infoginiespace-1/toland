'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Heart, X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '@/context/wishlist-context';
import { useCart } from '@/context/cart-context';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-surface-alt">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text">My Saved Wishlist</h3>
                <p className="text-2xs text-muted">
                  {items.length} {items.length === 1 ? 'item' : 'items'} saved
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-text hover:bg-slate-200 transition-colors"
              aria-label="Close Wishlist"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-300">
                  <Heart className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-text">Your Wishlist is Empty</h4>
                  <p className="text-xs text-muted max-w-xs">
                    Tap the heart icon on any jeans or jacket to save your favorites for later.
                  </p>
                </div>
                <Link
                  href="/products"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover shadow-xs transition-colors"
                >
                  <span>Explore Denim Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-surface-alt border border-border group hover:border-primary/50 transition-all"
                  >
                    <Link
                      href={`/products/${item.slug || item.productId}`}
                      onClick={onClose}
                      className="w-16 h-20 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-border relative block"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xs font-bold text-muted">
                          TOLAND
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0 space-y-1">
                      <Link
                        href={`/products/${item.slug || item.productId}`}
                        onClick={onClose}
                        className="text-xs font-bold text-text hover:text-primary transition-colors truncate block"
                      >
                        {item.name}
                      </Link>
                      {item.category && (
                        <p className="text-[11px] text-muted truncate">{item.category}</p>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-mono font-bold text-primary">
                          ₹{item.price}
                        </span>
                        {item.mrp && item.mrp > item.price && (
                          <span className="text-[10px] text-muted line-through font-mono">
                            ₹{item.mrp}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <Link
                        href={`/products/${item.slug || item.productId}`}
                        onClick={onClose}
                        className="p-2 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors text-3xs font-bold flex items-center justify-center"
                        title="View Options"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => removeFromWishlist(item.productId)}
                        className="p-2 rounded-xl text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {items.length > 0 && (
            <div className="p-4 border-t border-border bg-surface-alt space-y-2">
              <Link
                href="/products"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={clearWishlist}
                className="w-full py-2 text-2xs font-semibold text-muted hover:text-danger transition-colors text-center"
              >
                Clear All Saved Items
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
