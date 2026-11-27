import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProductDetailView } from '@/components/storefront/product-detail-view';
import { ChevronRight } from 'lucide-react';

export const revalidate = 60;

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: product } = (await supabase
    .from('products')
    .select('name, description, meta_title, meta_description')
    .eq('slug', params.slug)
    .single()) as any;

  if (!product) {
    return {
      title: 'Product Not Found | TOLAND',
    };
  }

  return {
    title: product.meta_title || `${product.name} | TOLAND Denim`,
    description:
      product.meta_description ||
      product.description ||
      'Direct factory denim manufactured in Sheikhpura, Bihar.',
    openGraph: {
      title: product.meta_title || `${product.name} | TOLAND Denim`,
      description:
        product.meta_description ||
        product.description ||
        'Direct factory denim manufactured in Sheikhpura, Bihar.',
      url: `https://toland-web.vercel.app/products/${params.slug}`,
      siteName: 'TOLAND Denim',
      locale: 'en_IN',
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const supabase = createClient();

  const [productRes, reviewsRes] = await Promise.all([
    supabase
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        variants:product_variants(*),
        images:product_images(path, sort, media_type)
      `)
      .eq('slug', params.slug)
      .single(),
    supabase
      .from('reviews')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
  ]);

  const product = productRes.data as any;

  if (!product) {
    notFound();
  }

  const variants = product.variants || [];
  const images = (product.images || []).sort((a: any, b: any) => (a.sort || 0) - (b.sort || 0));
  const allApprovedReviews = (reviewsRes.data || []) as any[];

  // Prioritize product-specific reviews, then include verified brand reviews
  const productReviews = allApprovedReviews.filter(
    (r) => r.product_id === product.id || !r.product_id
  );

  const avgScore = productReviews.length > 0
    ? (productReviews.reduce((sum: number, r: any) => sum + (r.rating || 5), 0) / productReviews.length).toFixed(1)
    : '4.9';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images.map((img: any) => img.path),
    description: product.description || 'Authentic direct-to-consumer factory denim manufactured in Sheikhpura, Bihar.',
    sku: variants[0]?.sku || product.slug,
    brand: {
      '@type': 'Brand',
      name: 'TOLAND',
    },
    offers: {
      '@type': 'Offer',
      url: `https://toland-web.vercel.app/products/${product.slug}`,
      priceCurrency: 'INR',
      price: product.base_price,
      priceValidUntil: '2028-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: variants.some((v: any) => (v.stock_qty || 0) > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Toland Private Limited',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avgScore,
      reviewCount: Math.max(1, productReviews.length),
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Schema.org Product Structured Data for Google Shopping */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-muted">
        <Link href="/" className="hover:text-text transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-text transition-colors">
          Denim Catalog
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-text transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-text font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Product Detail View */}
      <ProductDetailView product={product} variants={variants} images={images} reviews={productReviews} />
    </div>
  );
}
