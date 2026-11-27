'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  category?: { name: string; slug: string } | null;
  images?: { path: string }[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            slug,
            base_price,
            category:categories(name, slug),
            images:product_images(path)
          `)
          .eq('is_active', true)
          .ilike('name', `%${query.trim()}%`)
          .limit(8);

        if (!error && data) {
          setResults(data as any[]);
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, supabase]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && query.trim()) {
      onClose();
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  if (!isOpen) return null;

  const popularSearches = [
    { label: 'Slim Fit', href: '/products?category=slim-fit-denim' },
    { label: 'Straight Leg', href: '/products?category=regular-straight' },
    { label: 'Trucker Jackets', href: '/products?category=casual-jackets-shirts' },
    { label: 'Size 32', href: '/products?size=32' },
    { label: 'Raw Denim', href: '/products?wash=Raw' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-border overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-surface-alt">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search jeans, fits, jackets, styles (e.g. Slim, Raw, 32)..."
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-text placeholder:text-muted focus:outline-none"
          />
          {loading ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
          ) : query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-muted hover:text-text hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-slate-200 transition-colors text-xs font-bold"
          >
            ESC
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[65vh] overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Active Search Results */}
          {query.trim() ? (
            <div>
              <div className="text-2xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center justify-between">
                <span>Products matching &quot;{query}&quot;</span>
                {results.length > 0 && (
                  <span className="text-text font-mono">{results.length} results</span>
                )}
              </div>

              {results.length === 0 && !loading ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-sm font-semibold text-text">No matching products found</p>
                  <p className="text-xs text-muted">
                    Try searching for &quot;Slim&quot;, &quot;Regular&quot;, &quot;Raw&quot;, or browse our catalog.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/products"
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                    >
                      <span>Explore Entire Catalog</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.map((product) => {
                    const firstImage = product.images?.[0]?.path;
                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug || product.id}`}
                        onClick={onClose}
                        className="group flex items-center gap-3 p-3 rounded-2xl bg-surface-alt border border-border hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-border">
                          {firstImage ? (
                            <img
                              src={firstImage}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xs text-muted font-bold">
                              TOLAND
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          {product.category?.name && (
                            <p className="text-[11px] text-muted truncate">
                              {product.category.name}
                            </p>
                          )}
                          <div className="text-xs font-mono font-bold text-primary mt-0.5">
                            ₹{product.base_price}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Quick Picks & Popular Searches */
            <div className="space-y-4">
              <div>
                <div className="text-2xs font-bold uppercase tracking-wider text-muted mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Popular Searches & Categories</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-xl bg-surface-alt border border-border hover:border-primary hover:bg-primary/5 text-xs font-bold text-text transition-colors flex items-center gap-1.5"
                    >
                      <Tag className="w-3 h-3 text-muted" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted">Looking for a specific placed order?</span>
                <Link
                  href="/track-order"
                  onClick={onClose}
                  className="font-bold text-primary hover:underline"
                >
                  Track Order Portal →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
