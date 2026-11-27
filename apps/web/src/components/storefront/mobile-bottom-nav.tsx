'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';

interface MobileBottomNavProps {
  onOpenSearch: () => void;
  onOpenWishlist: () => void;
}

export function MobileBottomNav({ onOpenSearch, onOpenWishlist }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isHome = pathname === '/';
  const isCatalog = pathname.startsWith('/products');
  const isCart = pathname === '/cart';
  const isAccount = pathname.startsWith('/account');

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border shadow-lg px-2 py-1 flex items-center justify-around pb-[calc(env(safe-area-inset-bottom)+4px)]">
      {/* 1. Home */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors ${
          isHome ? 'text-primary' : 'text-muted hover:text-text'
        }`}
      >
        <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] font-bold mt-0.5">Home</span>
      </Link>

      {/* 2. Catalog */}
      <Link
        href="/products"
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors ${
          isCatalog ? 'text-primary' : 'text-muted hover:text-text'
        }`}
      >
        <Layers className={`w-5 h-5 ${isCatalog ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] font-bold mt-0.5">Catalog</span>
      </Link>

      {/* 3. Search Trigger */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center p-1.5 rounded-xl text-muted hover:text-text transition-colors cursor-pointer"
        aria-label="Search"
      >
        <Search className="w-5 h-5 stroke-2" />
        <span className="text-[10px] font-bold mt-0.5">Search</span>
      </button>

      {/* 4. Wishlist Trigger */}
      <button
        type="button"
        onClick={onOpenWishlist}
        className="relative flex flex-col items-center justify-center p-1.5 rounded-xl text-muted hover:text-text transition-colors cursor-pointer"
        aria-label="Wishlist"
      >
        <div className="relative">
          <Heart className="w-5 h-5 stroke-2 text-rose-500" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
              {wishlistCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold mt-0.5">Wishlist</span>
      </button>

      {/* 5. Cart Bag */}
      <Link
        href="/cart"
        className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors ${
          isCart ? 'text-primary' : 'text-muted hover:text-text'
        }`}
      >
        <div className="relative">
          <ShoppingBag className={`w-5 h-5 ${isCart ? 'stroke-[2.5]' : 'stroke-2'}`} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-accent text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold mt-0.5">Bag</span>
      </Link>

      {/* 6. Account */}
      <Link
        href="/account"
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors ${
          isAccount ? 'text-primary' : 'text-muted hover:text-text'
        }`}
      >
        <User className={`w-5 h-5 ${isAccount ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] font-bold mt-0.5">Account</span>
      </Link>
    </div>
  );
}
