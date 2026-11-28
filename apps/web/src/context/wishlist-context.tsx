'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Heart, Check, ArrowRight, RotateCcw, X } from 'lucide-react';

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number;
  image?: string;
  category?: string;
}

interface ToastState {
  type: 'added' | 'removed';
  item: WishlistItem;
}

interface WishlistContextType {
  items: WishlistItem[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (item: WishlistItem) => boolean;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string, silent?: boolean) => void;
  clearWishlist: () => void;
  itemCount: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'toland_wishlist_v1';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [mounted, setMounted] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch (e) {
      console.error('Error loading wishlist from storage', e);
    } finally {
      setIsLoaded(true);
    }
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving wishlist to storage', e);
    }
  }, [items, isLoaded]);

  const showToast = useCallback((nextToast: ToastState) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(nextToast);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3600);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  const openDrawer = useCallback(() => {
    dismissToast();
    setDrawerOpen(true);
  }, [dismissToast]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  const addToWishlist = useCallback(
    (item: WishlistItem) => {
      setItems((prev) => {
        if (prev.some((i) => i.productId === item.productId)) return prev;
        return [item, ...prev];
      });
      showToast({ type: 'added', item });
    },
    [showToast]
  );

  const toggleWishlist = useCallback(
    (item: WishlistItem) => {
      const exists = items.some((i) => i.productId === item.productId);
      if (exists) {
        setItems((prev) => prev.filter((i) => i.productId !== item.productId));
        showToast({ type: 'removed', item });
        return false;
      } else {
        setItems((prev) => [item, ...prev]);
        showToast({ type: 'added', item });
        return true;
      }
    },
    [items, showToast]
  );

  const removeFromWishlist = useCallback(
    (productId: string, silent = false) => {
      const removed = items.find((i) => i.productId === productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      if (!silent && removed) {
        showToast({ type: 'removed', item: removed });
      }
    },
    [items, showToast]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const handleUndoRemove = useCallback(() => {
    if (!toast || toast.type !== 'removed') return;
    const itemToRestore = toast.item;
    setItems((prev) => {
      if (prev.some((i) => i.productId === itemToRestore.productId)) return prev;
      return [itemToRestore, ...prev];
    });
    dismissToast();
  }, [toast, dismissToast]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        isInWishlist,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        itemCount: items.length,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        setDrawerOpen,
      }}
    >
      {children}

      {mounted &&
        toast &&
        !isDrawerOpen &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto z-[70] md:w-[360px] bg-slate-900 text-white rounded-2xl shadow-2xl border border-white/10 p-3.5 flex items-center gap-3 transition-all duration-200"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === 'added'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-300 border border-white/10'
              }`}
            >
              {toast.type === 'added' ? (
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              ) : (
                <Check className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{toast.item.name}</p>
              <p className="text-[11px] text-slate-300">
                {toast.type === 'added' ? 'Saved to your Wishlist' : 'Removed from Wishlist'}
              </p>
            </div>

            {toast.type === 'added' ? (
              <button
                type="button"
                onClick={openDrawer}
                className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-[11px] font-bold hover:bg-slate-100 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUndoRemove}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}

            <button
              type="button"
              onClick={dismissToast}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>,
          document.body
        )}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
