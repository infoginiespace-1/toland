import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Scissors,
  CheckCircle2,
  Package,
  Layers,
  PhoneCall,
  Percent,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();

  // Fetch active categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort', { ascending: true });

  // Fetch featured products with variants
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name, slug),
      variants:product_variants(*)
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(8);

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-alt via-surface to-surface border-b border-border py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/25 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Direct From Sheikhpura Manufacturing Facility</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-text leading-[1.08]">
              Heavyweight Denim. <br />
              <span className="text-primary underline decoration-accent decoration-wavy decoration-2">
                Factory Direct Value.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
              We cut, stitch, stone-wash, and finish 100% ring-spun cotton denim jeans at our factory in Sheikhpura,
              Barbigha (Bihar). Authentic manufacturer pricing with zero middleman markups.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/products"
                className="px-6 py-3.5 rounded-xl bg-primary text-white text-sm font-extrabold uppercase tracking-wide hover:bg-primary-hover shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>Shop Denim Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/b2b"
                className="px-6 py-3.5 rounded-xl bg-surface border border-border text-text text-sm font-bold hover:bg-surface-alt hover:border-primary transition-colors flex items-center gap-2"
              >
                <span>Wholesale & B2B Tiers</span>
              </Link>
            </div>

            {/* Quick Guarantees */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-8 border-t border-border/60 text-xs font-semibold text-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>13.5oz Ring-Spun Cotton</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>In-House Enzyme Stone Wash</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>GST Invoicing Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES OVERVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Browse By Fit</span>
            <h2 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">Denim Categories</h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors uppercase tracking-wider"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {(categories as any[]) && (categories as any[]).length > 0 ? (
            (categories as any[]).map((category: any) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative p-6 rounded-2xl bg-surface-alt border border-border hover:border-primary hover:shadow-md transition-all flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-1">
                  <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">
                    Sheikhpura Factory
                  </span>
                  <h3 className="text-lg font-black text-text group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs font-bold text-primary">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-sm text-muted">Loading categories...</div>
          )}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Signature Styles</span>
            <h2 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">Featured Denim</h2>
            <p className="text-xs text-muted mt-1">Built to withstand years of hard wear. Factory direct pricing.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <Percent className="w-3.5 h-3.5" />
            <span>Up to 50% Off Retail Prices</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products && products.length > 0 ? (
            products.map((product: any) => {
              const discountPercent = product.mrp
                ? Math.round(((product.mrp - product.base_price) / product.mrp) * 100)
                : 0;
              const variants = product.variants || [];
              const availableSizes = Array.from(new Set(variants.map((v: any) => v.size))).slice(0, 5);

              return (
                <div
                  key={product.id}
                  className="group rounded-2xl bg-surface-alt border border-border hover:border-primary/60 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
                >
                  {/* Image Placeholder / Visual Container */}
                  <div className="relative aspect-4/5 bg-gradient-to-br from-surface-alt to-surface border-b border-border flex flex-col items-center justify-center p-6 text-center">
                    {/* Badge */}
                    {discountPercent > 0 && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-3xs font-extrabold uppercase bg-danger text-white shadow-xs">
                        {discountPercent}% OFF
                      </span>
                    )}
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-3xs font-bold uppercase bg-surface text-muted border border-border">
                      {product.category?.name || 'Denim'}
                    </span>

                    <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform">
                      <Layers className="w-10 h-10" />
                    </div>
                    <span className="text-xs font-bold text-text line-clamp-1">{product.name}</span>
                    <span className="text-3xs text-muted font-medium mt-1">100% Ring-Spun Cotton</span>
                  </div>

                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-text line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>

                      {/* Sizes */}
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {availableSizes.map((size: any) => (
                          <span
                            key={size}
                            className="px-2 py-0.5 rounded bg-surface border border-border text-3xs font-mono font-semibold text-muted"
                          >
                            {size}
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
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-2xs"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-muted">
              Loading featured denim products...
            </div>
          )}
        </div>
      </section>

      {/* 4. MANUFACTURING FACILITY SPOTLIGHT */}
      <section className="bg-surface-alt border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Vertical Manufacturing</span>
            <h2 className="text-3xl font-black text-text tracking-tight mt-1">
              Sheikhpura In-House Production Process
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-2">
              Every pair of TOLAND jeans undergoes a strict 5-stage quality audit at our Bihar manufacturing unit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-xl bg-surface border border-border space-y-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                1
              </div>
              <h3 className="text-sm font-bold text-text">Pattern Cutting</h3>
              <p className="text-xs text-muted">Precision computer-guided fabric cutting to avoid warp and bias twist.</p>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border space-y-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                2
              </div>
              <h3 className="text-sm font-bold text-text">Heavy Stitching</h3>
              <p className="text-xs text-muted">Core-spun poly-cotton thread with reinforced double-needle chainstitch.</p>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border space-y-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                3
              </div>
              <h3 className="text-sm font-bold text-text">Stone Washing</h3>
              <p className="text-xs text-muted">Natural pumice and eco-enzymes creating authentic vintage fades.</p>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border space-y-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                4
              </div>
              <h3 className="text-sm font-bold text-text">Hardware & Rivets</h3>
              <p className="text-xs text-muted">Solid brass shanks, heavy-duty zippers, and stress-point bar-tacks.</p>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border space-y-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                5
              </div>
              <h3 className="text-sm font-bold text-text">Final QC & Dispatch</h3>
              <p className="text-xs text-muted">100% individual inspection before boxed dispatch from our warehouse.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. B2B WHOLESALE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-primary-hover p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20">
              For Retailers & Wholesale Distributors
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Direct-from-Mill Wholesale Pricing
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Order bulk denim lots (50 to 5,000+ pieces) with tiered wholesale pricing, custom tags, and guaranteed
              dispatch timelines directly from our Sheikhpura factory.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              href="/b2b"
              className="px-6 py-3.5 rounded-xl bg-white text-primary hover:bg-surface text-sm font-black uppercase tracking-wide shadow-md transition-colors text-center"
            >
              Request B2B Catalog
            </Link>
            <a
              href="https://wa.me/918797186001?text=Hello%20TOLAND,%20I%20am%20interested%20in%20wholesale%20denim%20orders"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-success text-white hover:bg-success/90 text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>WhatsApp Inquiries</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
