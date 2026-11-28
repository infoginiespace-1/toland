import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { HeroSlider } from '@/components/storefront/hero-slider';
import { TestimonialsSection } from '@/components/storefront/testimonials-section';
import { QuickWishlistButton } from '@/components/storefront/quick-wishlist-button';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Layers,
  PhoneCall,
  Percent,
} from 'lucide-react';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();

  // Fetch active categories, featured products, banners, and verified reviews in parallel
  const [categoriesRes, productsRes, bannersRes, reviewsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort', { ascending: true }),
    supabase
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        variants:product_variants(*),
        images:product_images(path, sort)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(8),
    supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort', { ascending: true }),
    supabase
      .from('reviews')
      .select('*')
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const categories = categoriesRes.data || [];
  const products = productsRes.data || [];
  const banners = (bannersRes.data || []) as any[];
  const reviews = (reviewsRes.data || []) as any[];

  return (
    <div className="flex flex-col">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-alt via-white to-white border-b border-border py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Direct From Sheikhpura Manufacturing Facility</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Heavyweight Denim. <br />
                <span className="text-primary">
                  Factory Direct Value.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-muted max-w-xl leading-relaxed">
                We cut, stitch, stone-wash, and finish 100% ring-spun cotton denim jeans at our factory in Sheikhpura,
                Barbigha (Bihar). Authentic manufacturer pricing with zero middleman markups.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/products"
                  className="px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 shadow-card hover:shadow-card-hover transition-all flex items-center gap-2"
                >
                  <span>Shop Denim Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/b2b"
                  className="px-6 py-3 rounded-xl bg-white border border-border text-slate-800 text-sm font-semibold hover:bg-surface-alt transition-colors flex items-center gap-2 shadow-subtle"
                >
                  <span>Wholesale &amp; B2B Tiers</span>
                </Link>
              </div>

              {/* Quick Guarantees */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-border text-xs font-medium text-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <span>13.5oz Ring-Spun Cotton</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <span>In-House Stone Wash</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <span>GST Invoicing Ready</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Showcase - Interactive Multi-Media Carousel */}
            <div className="lg:col-span-5 relative">
              <HeroSlider banners={banners} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES OVERVIEW */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Browse By Fit</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Denim Categories</h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-semibold text-primary hover:text-accent flex items-center gap-1 transition-colors uppercase tracking-wider"
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
                className="group relative p-5 rounded-2xl bg-gradient-to-br from-white to-surface-alt border border-border hover:border-primary/40 hover:shadow-card transition-all flex flex-col justify-between min-h-[164px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                      Sheikhpura Cut
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/70 text-xs font-semibold text-primary">
                  <span>Explore Fit</span>
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
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Signature Styles</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Featured Denim</h2>
            <p className="text-xs text-muted mt-1">Built to withstand years of hard wear. Factory direct pricing.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 w-fit">
            <Percent className="w-3.5 h-3.5" />
            <span>Up to 50% Off Retail Prices</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {products && products.length > 0 ? (
            products.map((product: any) => {
              const discountPercent = product.mrp
                ? Math.round(((product.mrp - product.base_price) / product.mrp) * 100)
                : 0;
              const variants = product.variants || [];
              const availableSizes = Array.from(new Set(variants.map((v: any) => v.size))).slice(0, 4);

              return (
                <div
                  key={product.id}
                  className="group rounded-2xl bg-white border border-border hover:border-slate-300 hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden shadow-2xs"
                >
                  {/* Image Visual Container */}
                  <div className="relative aspect-[3/4] sm:aspect-4/5 bg-surface-alt border-b border-border overflow-hidden">
                    {/* Badge */}
                    {discountPercent > 0 && (
                      <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase bg-danger text-white shadow-subtle pointer-events-none">
                        {discountPercent}% OFF
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
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20"
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
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-gradient-to-br from-surface-alt to-white">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2 sm:mb-3 group-hover:scale-105 transition-transform">
                            <Layers className="w-6 h-6 sm:w-8 sm:h-8" />
                          </div>
                          <span className="text-3xs sm:text-xs font-semibold text-text line-clamp-1">{product.name}</span>
                          <span className="text-[9px] sm:text-[11px] text-muted font-normal mt-0.5 sm:mt-1">100% Cotton</span>
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* Details */}
                  <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-primary block mb-0.5 truncate">
                        {product.category?.name || 'Denim'}
                      </span>
                      <Link href={`/products/${product.slug}`} className="block">
                        <h3 className="text-xs sm:text-sm font-semibold text-text line-clamp-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Sizes */}
                      <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                        {availableSizes.map((size: any) => (
                          <span
                            key={size}
                            className="px-1.5 py-0.5 rounded bg-surface-alt border border-border text-[9px] sm:text-[11px] font-mono font-medium text-muted"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 sm:pt-3 border-t border-border flex items-center justify-between gap-1">
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-bold text-slate-900 truncate">₹{product.base_price}</div>
                        {product.mrp && (
                          <div className="text-[10px] sm:text-xs text-muted line-through truncate">MRP ₹{product.mrp}</div>
                        )}
                      </div>

                      <Link
                        href={`/products/${product.slug}`}
                        className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-slate-900 text-white text-[10px] sm:text-xs font-medium hover:bg-slate-800 transition-colors shadow-subtle shrink-0"
                      >
                        View
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
      <section className="bg-surface-alt border-y border-border py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Vertical Manufacturing</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Sheikhpura In-House Production Process
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-2">
              Every pair of TOLAND jeans undergoes a strict 5-stage quality audit at our Bihar manufacturing unit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-border shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900">Pattern Cutting</h3>
              <p className="text-xs text-muted leading-relaxed">Precision computer-guided fabric cutting to avoid warp and bias twist.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-border shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900">Heavy Stitching</h3>
              <p className="text-xs text-muted leading-relaxed">Core-spun poly-cotton thread with reinforced double-needle chainstitch.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-border shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900">Stone Washing</h3>
              <p className="text-xs text-muted leading-relaxed">Natural pumice and eco-enzymes creating authentic vintage fades.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-border shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                4
              </div>
              <h3 className="text-sm font-bold text-slate-900">Hardware &amp; Rivets</h3>
              <p className="text-xs text-muted leading-relaxed">Solid brass shanks, heavy-duty zippers, and stress-point bar-tacks.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-border shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                5
              </div>
              <h3 className="text-sm font-bold text-slate-900">Final QC &amp; Dispatch</h3>
              <p className="text-xs text-muted leading-relaxed">100% individual inspection before boxed dispatch from our warehouse.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. VERIFIED CUSTOMER RATINGS & REVIEWS */}
      <TestimonialsSection reviews={reviews} />

      {/* 6. B2B WHOLESALE BANNER */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-primary-hover p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-2.5">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/10 text-white border border-white/20">
              For Retailers &amp; Wholesale Distributors
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Direct-from-Mill Wholesale Pricing
            </h2>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              Order bulk denim lots (50 to 5,000+ pieces) with tiered wholesale pricing, custom tags, and guaranteed
              dispatch timelines directly from our Sheikhpura factory.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/b2b"
              className="px-6 py-3 rounded-xl bg-white text-primary hover:bg-surface text-xs sm:text-sm font-bold shadow-md transition-colors text-center"
            >
              Calculate B2B Tier Pricing
            </Link>
            <a
              href="https://wa.me/918797186001?text=Hello%20TOLAND,%20I%20am%20interested%20in%20wholesale%20denim%20orders"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-white/15"
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
