import React, { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { QuickWishlistButton } from '@/components/storefront/quick-wishlist-button';
import {
  Filter,
  ArrowUpDown,
  Layers,
  Percent,
  Check,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ProductsPageProps {
  searchParams: {
    category?: string;
    size?: string;
    fit?: string;
    wash?: string;
    sort?: string;
    search?: string;
    q?: string;
    in_stock?: string;
    price_range?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const supabase = createClient();

  const selectedCategory = searchParams.category || '';
  const selectedSize = searchParams.size || '';
  const selectedFit = searchParams.fit || '';
  const selectedWash = searchParams.wash || '';
  const selectedSort = searchParams.sort || 'featured';
  const inStockOnly = searchParams.in_stock === 'true';
  const selectedPriceRange = searchParams.price_range || '';
  const searchQuery = (searchParams.search || searchParams.q || '').trim().toLowerCase();

  // 1. Prepare products query
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(name, slug),
      variants:product_variants(*),
      images:product_images(path, sort)
    `)
    .eq('is_active', true);

  // Sort ordering
  if (selectedSort === 'price_asc') {
    query = query.order('base_price', { ascending: true });
  } else if (selectedSort === 'price_desc') {
    query = query.order('base_price', { ascending: false });
  } else if (selectedSort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else {
    query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
  }

  // 2. Fetch categories and products simultaneously in parallel
  const [categoriesRes, productsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort', { ascending: true }),
    query,
  ]);

  const categories = categoriesRes.data || [];
  const rawProducts = (productsRes.data || []) as any[];

  // Filter category & search term in-memory with zero extra DB roundtrip
  const allProducts = rawProducts.filter((product: any) => {
    if (selectedCategory && product.category?.slug !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      const nameMatch = product.name?.toLowerCase().includes(searchQuery);
      const descMatch = product.description?.toLowerCase().includes(searchQuery);
      const catMatch = product.category?.name?.toLowerCase().includes(searchQuery);
      if (!nameMatch && !descMatch && !catMatch) return false;
    }
    return true;
  });

  // Filter in-memory for variant attributes (size, fit, wash)
  const filteredProducts = (allProducts || []).filter((product: any) => {
    const variants = product.variants || [];
    if (selectedSize && !variants.some((v: any) => v.size === selectedSize)) {
      return false;
    }
    if (selectedFit && !variants.some((v: any) => v.fit?.toLowerCase() === selectedFit.toLowerCase())) {
      return false;
    }
    if (selectedWash && !variants.some((v: any) => v.wash?.toLowerCase() === selectedWash.toLowerCase())) {
      return false;
    }
    if (inStockOnly && !variants.some((v: any) => Number(v.stock_qty || 0) > 0)) {
      return false;
    }
    const price = Number(product.base_price || 0);
    if (selectedPriceRange === 'under_1499' && price >= 1500) {
      return false;
    }
    if (selectedPriceRange === '1500_1999' && (price < 1500 || price > 1999)) {
      return false;
    }
    if (selectedPriceRange === '2000_plus' && price < 2000) {
      return false;
    }
    return true;
  });

  const SIZES = ['28', '30', '32', '34', '36', '38'];
  const FITS = ['Slim', 'Regular'];
  const WASHES = ['Raw', 'Medium', 'Dark'];
  const PRICE_RANGES = [
    { label: 'Under ₹1,499', val: 'under_1499' },
    { label: '₹1,500 – ₹1,999', val: '1500_1999' },
    { label: '₹2,000 & Above', val: '2000_plus' },
  ];

  // Helper to build URL query
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-muted">
        <Link href="/" className="hover:text-text">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-text font-bold">Denim Catalog</span>
        {selectedCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-primary font-bold capitalize">
              {(categories as any[])?.find((c: any) => c.slug === selectedCategory)?.name || selectedCategory}
            </span>
          </>
        )}
      </div>

      {/* Header & Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            TOLAND Denim Collection
          </h1>
          <p className="text-xs text-muted mt-1">
            Showing {filteredProducts.length} authentic factory-direct styles
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
          <span className="text-xs font-semibold text-muted">Sort By:</span>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { label: 'Featured', val: 'featured' },
              { label: 'Price: Low to High', val: 'price_asc' },
              { label: 'Price: High to Low', val: 'price_desc' },
              { label: 'Newest', val: 'newest' },
            ].map((s) => {
              const active = selectedSort === s.val;
              return (
                <Link
                  key={s.val}
                  href={createFilterUrl('sort', s.val)}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    active
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-surface-alt border border-border text-muted hover:text-text'
                  }`}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search Query Active Tag */}
      {searchQuery && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text">Showing search results for:</span>
            <span className="font-bold text-primary bg-white px-2.5 py-0.5 rounded-lg border border-primary/20">
              &quot;{searchQuery}&quot;
            </span>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>Clear Search</span>
            <X className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Quick Category & Fit Pills (Mobile & Tablet only, sidebar handles Desktop) */}
      <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        <Link
          href="/products"
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors border ${
            !selectedCategory && !selectedFit && !selectedWash && !searchQuery
              ? 'bg-primary text-white border-primary shadow-xs'
              : 'bg-surface-alt border-border text-muted hover:text-text'
          }`}
        >
          All Items ({rawProducts.length})
        </Link>
        {(categories as any[])?.map((cat: any) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <Link
              key={cat.id}
              href={createFilterUrl('category', cat.slug)}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors border ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface-alt border-border text-muted hover:text-text'
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
        {FITS.map((fit) => {
          const isSelected = selectedFit.toLowerCase() === fit.toLowerCase();
          return (
            <Link
              key={fit}
              href={createFilterUrl('fit', fit)}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors border ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface-alt border-border text-muted hover:text-text'
              }`}
            >
              {fit} Fit
            </Link>
          );
        })}
      </div>

      {/* Layout Grid: Filters Sidebar + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="space-y-6 bg-surface-alt border border-border p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-text">Refine Filters</h2>
            </div>
            {(selectedCategory || selectedSize || selectedFit || selectedWash || inStockOnly || selectedPriceRange) && (
              <Link
                href="/products"
                className="text-xs font-bold text-danger hover:underline"
              >
                Reset All
              </Link>
            )}
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Category</h3>
            <div className="space-y-1">
              <Link
                href={createFilterUrl('category', '')}
                className={`block text-xs py-1.5 px-2.5 rounded-lg font-semibold transition-colors ${
                  !selectedCategory ? 'bg-primary text-white' : 'text-muted hover:bg-surface'
                }`}
              >
                All Categories
              </Link>
              {(categories as any[])?.map((cat: any) => {
                const isSelected = selectedCategory === cat.slug;
                return (
                  <Link
                    key={cat.id}
                    href={createFilterUrl('category', cat.slug)}
                    className={`block text-xs py-1.5 px-2.5 rounded-lg font-semibold transition-colors ${
                      isSelected ? 'bg-primary text-white' : 'text-muted hover:bg-surface'
                    }`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Availability (In-Stock Only) */}
          <div className="pt-4 border-t border-border">
            <Link
              href={createFilterUrl('in_stock', inStockOnly ? '' : 'true')}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                inStockOnly
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface border-border text-text hover:border-primary/50'
              }`}
            >
              <span>In-Stock Only</span>
              <span className={`text-3xs px-2 py-0.5 rounded-full ${inStockOnly ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                Fast Dispatch
              </span>
            </Link>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2 pt-4 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Price Range</h3>
            <div className="space-y-1">
              <Link
                href={createFilterUrl('price_range', '')}
                className={`block text-xs py-1.5 px-2.5 rounded-lg font-semibold transition-colors ${
                  !selectedPriceRange ? 'bg-primary text-white' : 'text-muted hover:bg-surface'
                }`}
              >
                All Prices
              </Link>
              {PRICE_RANGES.map((pr) => {
                const isSelected = selectedPriceRange === pr.val;
                return (
                  <Link
                    key={pr.val}
                    href={createFilterUrl('price_range', pr.val)}
                    className={`block text-xs py-1.5 px-2.5 rounded-lg font-semibold transition-colors ${
                      isSelected ? 'bg-primary text-white' : 'text-muted hover:bg-surface'
                    }`}
                  >
                    {pr.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Waist Size Filter */}
          <div className="space-y-2 pt-4 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Waist Size</h3>
            <div className="grid grid-cols-3 gap-2">
              {SIZES.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <Link
                    key={size}
                    href={createFilterUrl('size', size)}
                    className={`text-center py-2 rounded-lg text-xs font-mono font-bold transition-colors border ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface border-border text-muted hover:border-primary/50'
                    }`}
                  >
                    {size}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Fit Filter */}
          <div className="space-y-2 pt-4 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Denim Fit</h3>
            <div className="flex flex-wrap gap-2">
              {FITS.map((fit) => {
                const isSelected = selectedFit.toLowerCase() === fit.toLowerCase();
                return (
                  <Link
                    key={fit}
                    href={createFilterUrl('fit', fit.toLowerCase())}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface border-border text-muted hover:border-primary/50'
                    }`}
                  >
                    {fit}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Wash Filter */}
          <div className="space-y-2 pt-4 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Wash Style</h3>
            <div className="flex flex-wrap gap-2">
              {WASHES.map((wash) => {
                const isSelected = selectedWash.toLowerCase() === wash.toLowerCase();
                return (
                  <Link
                    key={wash}
                    href={createFilterUrl('wash', wash.toLowerCase())}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface border-border text-muted hover:border-primary/50'
                    }`}
                  >
                    {wash}
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product: any) => {
                const discount = product.mrp
                  ? Math.round(((product.mrp - product.base_price) / product.mrp) * 100)
                  : 0;
                const variants = product.variants || [];
                const sizes = Array.from(new Set(variants.map((v: any) => v.size))).slice(0, 6);

                return (
                  <div
                    key={product.id}
                    className="group rounded-2xl bg-surface-alt border border-border hover:border-primary/70 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
                  >
                    {/* Visual Container */}
                    <div className="relative aspect-4/5 bg-surface border-b border-border overflow-hidden">
                      {discount > 0 && (
                        <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase bg-danger text-white shadow-sm pointer-events-none">
                          {discount}% OFF
                        </span>
                      )}

                      <QuickWishlistButton
                        item={{
                          productId: product.id,
                          name: product.name,
                          slug: product.slug,
                          price: Number(product.base_price),
                          mrp: product.mrp ? Number(product.mrp) : undefined,
                          image: product.images?.[0]?.path,
                          category: product.category?.name,
                        }}
                        className="absolute top-3 right-3 z-20"
                      />

                      <Link
                        href={`/products/${product.slug}`}
                        className="block w-full h-full"
                      >
                        {product.images && product.images.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].path}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-surface to-surface-alt">
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform">
                              <Layers className="w-10 h-10" />
                            </div>
                            <span className="text-xs font-bold text-text line-clamp-1">{product.name}</span>
                            <span className="text-3xs text-muted font-medium mt-1">100% Ring-Spun Cotton</span>
                          </div>
                        )}
                      </Link>
                    </div>

                    {/* Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                          {product.category?.name || 'Denim'}
                        </span>
                        <Link href={`/products/${product.slug}`} className="block">
                          <h3 className="text-sm font-bold text-text line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Sizes Pill list */}
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {sizes.map((sz: any) => (
                            <span
                              key={sz}
                              className="px-2 py-0.5 rounded bg-surface border border-border text-3xs font-mono font-semibold text-muted"
                            >
                              {sz}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-between">
                        <div>
                          <div className="text-base font-black text-text">₹{product.base_price}</div>
                          {product.mrp && (
                            <div className="text-3xs text-muted line-through">MRP ₹{product.mrp}</div>
                          )}
                        </div>

                        <Link
                          href={`/products/${product.slug}`}
                          className="px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-2xs transition-colors"
                        >
                          View & Buy
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-surface-alt border border-border space-y-3">
              <Layers className="w-10 h-10 text-muted mx-auto" />
              <h3 className="text-base font-bold text-text">No Products Match This Selection</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Try loosening your filters or resetting size and fit parameters to see available factory inventory.
              </p>
              <Link
                href="/products"
                className="inline-block px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold"
              >
                View All Products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
