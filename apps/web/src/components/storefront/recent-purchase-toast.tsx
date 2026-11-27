'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldCheck, X, ShoppingBag } from 'lucide-react';

interface PurchaseEvent {
  name: string;
  city: string;
  state: string;
  item: string;
  timeAgo: string;
  size: string;
}

const SAMPLE_PURCHASES: PurchaseEvent[] = [
  { name: 'Aditya K.', city: 'Patna', state: 'Bihar', item: 'TOLAND Slim Fit Raw Denim', size: '32', timeAgo: '4 mins ago' },
  { name: 'Rahul S.', city: 'Muzaffarpur', state: 'Bihar', item: 'Regular Straight Classic Denim', size: '34', timeAgo: '9 mins ago' },
  { name: 'Sameer V.', city: 'Delhi NCR', state: 'Delhi', item: 'Heavyweight Trucker Jacket', size: 'L', timeAgo: '16 mins ago' },
  { name: 'Deepak M.', city: 'Gaya', state: 'Bihar', item: 'Heavy Stonewash Slim Fit', size: '30', timeAgo: '22 mins ago' },
  { name: 'Kunal R.', city: 'Ranchi', state: 'Jharkhand', item: 'Deep Indigo Selvedge Finish', size: '32', timeAgo: '31 mins ago' },
  { name: 'Praveen T.', city: 'Kolkata', state: 'West Bengal', item: 'TOLAND Slim Fit Raw Denim', size: '36', timeAgo: '39 mins ago' },
];

export function RecentPurchaseToast() {
  const pathname = usePathname();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    // Show initial toast after 4 seconds
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 4000);

    // Loop interval: visible for 6s, hidden for 25s
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % SAMPLE_PURCHASES.length);
        setVisible(true);
      }, 1000);
    }, 28000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissed]);

  if (pathname.startsWith('/admin') || dismissed || !visible) return null;

  const current = SAMPLE_PURCHASES[currentIdx];

  return (
    <div className="hidden sm:flex fixed bottom-6 left-6 z-30 max-w-sm bg-white/95 backdrop-blur-md rounded-2xl border border-border shadow-2xl p-3 items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
        <ShoppingBag className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5 text-2xs text-muted">
          <span className="font-bold text-text truncate">{current.name}</span>
          <span>from {current.city}</span>
          <span className="text-3xs text-emerald-600 font-bold flex items-center gap-0.5">
            <ShieldCheck className="w-2.5 h-2.5" /> Verified
          </span>
        </div>
        <p className="text-xs font-bold text-text truncate">
          Purchased {current.item}
        </p>
        <div className="flex items-center gap-2 text-3xs text-muted font-medium mt-0.5">
          <span>Waist {current.size}</span>
          <span>·</span>
          <span>{current.timeAgo}</span>
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg text-muted hover:text-text hover:bg-slate-100 transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
