'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlist, WishlistItem } from '@/context/wishlist-context';

interface QuickWishlistButtonProps {
  item: WishlistItem;
  className?: string;
  size?: 'sm' | 'md';
}

export function QuickWishlistButton({
  item,
  className = '',
  size = 'sm',
}: QuickWishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const saved = isInWishlist(item.productId);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(item);
  };

  const sizeClasses = size === 'md' ? 'w-9 h-9' : 'w-8 h-8';
  const iconClasses = size === 'md' ? 'w-4 h-4' : 'w-4 h-4';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? `Remove ${item.name} from wishlist` : `Save ${item.name} to wishlist`}
      aria-pressed={saved}
      title={saved ? 'Saved in Wishlist' : 'Save to Wishlist'}
      className={`${sizeClasses} rounded-full flex items-center justify-center border transition-all duration-200 active:scale-90 cursor-pointer shadow-sm ${
        saved
          ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100'
          : 'bg-white/95 border-slate-200/80 text-slate-600 hover:text-rose-500 hover:border-rose-200 hover:bg-white'
      } ${className}`}
    >
      <Heart
        className={`${iconClasses} transition-transform duration-200 ${
          saved ? 'fill-rose-500 text-rose-500 scale-110' : ''
        }`}
      />
    </button>
  );
}
