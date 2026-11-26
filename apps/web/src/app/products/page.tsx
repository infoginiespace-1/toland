import React, { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Filter,
  ArrowUpDown,
  Layers,
  Percent,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ProductsPageProps {
  searchParams: {
    category?: string;
    size?: string;
    fit?: string;
    wash?: string;
    sort?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const supabase = createClient();

  const selectedCategory = searchParams.category || '';
  const selectedSize = searchParams.size || '';
  const selectedFit = searchParams.fit || '';
  const selectedWash = searchParams.wash || '';
  const selectedSort = searchParams.sort || 'featured';

  // 1. Fetch Categories for filter sidebar
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort', { ascending: true });

  // 2. Fetch products with filter criteria
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(name, slug),
      variants:product_variants(*),
      images:product_images(path, sort)
    `)
    .eq('is_active', true);

  if (selectedCategory) {
    const { data: catRow } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', selectedCategory)
      .single();
    if ((catRow as any)?.id) {
      query = query.eq('category_id', (catRow as any).id);
    }
  }

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

  const { data: allProducts } = await query;

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
    return true;
  });

  const SIZES = ['28', '30', '32', '34', '36', '38'];
  const FITS = ['Slim', 'Regular'];
  const WASHES = ['Raw', 'Medium', 'Dark'];

  // Helper to build URL query
  const createFilterUrl = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedSize) params.set('size', selectedSize);
    if (selectedFit) params.set('fit', selectedFit);
    if (selectedWash) params.set('wash', selectedWash);
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
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">
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

      {/* Layout Grid: Filters Sidebar + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="space-y-6 bg-surface-alt border border-border p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-text">Refine Filters</h2>
            </div>
            {(selectedCategory || selectedSize || selectedFit || selectedWash) && (
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
                    <Link
                      href={`/products/${product.slug}`}
                      className="relative aspect-4/5 bg-surface border-b border-border overflow-hidden block"
                    >
                      {discount > 0 && (
                        <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded text-3xs font-extrabold uppercase bg-danger text-white shadow-xs">
                          {discount}% OFF
                        </span>
                      )}

                      <span className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded text-3xs font-bold uppercase bg-surface/90 backdrop-blur-xs text-text border border-border">
                        {product.category?.name || 'Denim'}
                      </span>

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

                    {/* Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-text line-clamp-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>

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
