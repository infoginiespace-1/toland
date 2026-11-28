'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Filter,
  X,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface PriceRangeItem {
  label: string;
  val: string;
}

interface MobileFilterDrawerProps {
  categories: CategoryItem[];
  selectedCategory: string;
  selectedSize: string;
  selectedFit: string;
  selectedWash: string;
  inStockOnly: boolean;
  selectedPriceRange: string;
  selectedSort: string;
  searchQuery: string;
  totalCount: number;
  filteredCount: number;
  sizes: string[];
  fits: string[];
  washes: string[];
  priceRanges: PriceRangeItem[];
}

export function MobileFilterDrawer({
  categories,
  selectedCategory,
  selectedSize,
  selectedFit,
  selectedWash,
  inStockOnly,
  selectedPriceRange,
  selectedSort,
  searchQuery,
  totalCount,
  filteredCount,
  sizes,
  fits,
  washes,
  priceRanges,
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Lock body scroll when drawer is open
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

  const activeFiltersCount = [
    Boolean(selectedCategory),
    Boolean(selectedSize),
    Boolean(selectedFit),
    Boolean(selectedWash),
    inStockOnly,
    Boolean(selectedPriceRange),
  ].filter(Boolean).length;

  const createFilterUrl = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedSize) params.set('size', selectedSize);
    if (selectedFit) params.set('fit', selectedFit);
    if (selectedWash) params.set('wash', selectedWash);
    if (inStockOnly) params.set('in_stock', 'true');
    if (selectedPriceRange) params.set('price_range', selectedPriceRange);
    if (searchQuery) params.set('search', searchQuery);
    if (selectedSort && selectedSort !== 'featured') params.set('sort', selectedSort);

    if (!value || params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const queryStr = params.toString();
    return `/products${queryStr ? `?${queryStr}` : ''}`;
  };

  const handleApplyFilter = (key: string, value: string) => {
    const url = createFilterUrl(key, value);
    router.push(url);
  };

  return (
    <>
      {/* Mobile Filter Button (Trigger) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-surface-alt border border-border text-xs font-bold text-text hover:border-primary/50 transition-colors shadow-2xs active:scale-95 cursor-pointer"
        aria-label="Open Filters"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
        <span>Filters</span>
        {activeFiltersCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Slide-over / Bottom-sheet Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative z-10 w-full max-h-[85vh] bg-surface rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 shrink-0" />

            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <h2 className="text-base font-extrabold text-text">Refine Denim</h2>
                {activeFiltersCount > 0 && (
                  <span className="text-xs font-bold text-muted">
                    ({activeFiltersCount} active)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Link
                    href="/products"
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-bold text-danger hover:underline mr-2"
                  >
                    Reset All
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-muted hover:text-text hover:bg-surface-alt transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Filters Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* 1. Fast Dispatch / In-Stock Only */}
              <div className="p-3 rounded-2xl bg-surface-alt border border-border">
                <button
                  type="button"
                  onClick={() => handleApplyFilter('in_stock', inStockOnly ? '' : 'true')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    inStockOnly
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface border-border text-text hover:border-primary/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>Ready In-Stock Only</span>
                  </span>
                  <span
                    className={`text-3xs px-2 py-0.5 rounded-full ${
                      inStockOnly ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Dispatch in 24h
                  </span>
                </button>
              </div>

              {/* 2. Category */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted block">
                  Category
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyFilter('category', '')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors border text-left flex items-center justify-between ${
                      !selectedCategory
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-alt border-border text-muted hover:text-text'
                    }`}
                  >
                    <span>All Denim</span>
                    {!selectedCategory && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.slug;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleApplyFilter('category', cat.slug)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors border text-left flex items-center justify-between truncate ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-surface-alt border-border text-muted hover:text-text'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Waist Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-muted">
                    Waist Size (Inches)
                  </span>
                  {selectedSize && (
                    <button
                      type="button"
                      onClick={() => handleApplyFilter('size', '')}
                      className="text-3xs font-bold text-primary hover:underline"
                    >
                      Clear Size
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {sizes.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleApplyFilter('size', size)}
                        className={`py-2.5 rounded-xl text-xs font-mono font-bold transition-colors border text-center ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-surface-alt border-border text-slate-700 hover:border-primary/50'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Price Range */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted block">
                  Price Range
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyFilter('price_range', '')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors border text-left flex items-center justify-between ${
                      !selectedPriceRange
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-alt border-border text-muted hover:text-text'
                    }`}
                  >
                    <span>All Prices</span>
                    {!selectedPriceRange && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {priceRanges.map((pr) => {
                    const isSelected = selectedPriceRange === pr.val;
                    return (
                      <button
                        key={pr.val}
                        type="button"
                        onClick={() => handleApplyFilter('price_range', pr.val)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors border text-left flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-surface-alt border-border text-muted hover:text-text'
                        }`}
                      >
                        <span>{pr.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Denim Fit */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted block">
                  Denim Fit
                </span>
                <div className="flex flex-wrap gap-2">
                  {fits.map((fit) => {
                    const isSelected = selectedFit.toLowerCase() === fit.toLowerCase();
                    return (
                      <button
                        key={fit}
                        type="button"
                        onClick={() => handleApplyFilter('fit', fit.toLowerCase())}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-surface-alt border-border text-slate-700 hover:border-primary/50'
                        }`}
                      >
                        {fit} Fit
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Wash Style */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted block">
                  Wash Style
                </span>
                <div className="flex flex-wrap gap-2">
                  {washes.map((wash) => {
                    const isSelected = selectedWash.toLowerCase() === wash.toLowerCase();
                    return (
                      <button
                        key={wash}
                        type="button"
                        onClick={() => handleApplyFilter('wash', wash.toLowerCase())}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-surface-alt border-border text-slate-700 hover:border-primary/50'
                        }`}
                      >
                        {wash} Wash
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="p-4 border-t border-border bg-surface shrink-0 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white text-sm font-extrabold text-center hover:bg-primary-hover transition-colors shadow-sm active:scale-98"
              >
                View {filteredCount} Styles
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
