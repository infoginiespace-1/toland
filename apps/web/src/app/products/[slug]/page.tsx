import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProductDetailView } from '@/components/storefront/product-detail-view';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

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
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const supabase = createClient();

  const { data: product } = (await supabase
    .from('products')
    .select(`
      *,
      category:categories(name, slug),
      variants:product_variants(*),
      images:product_images(path, sort)
    `)
    .eq('slug', params.slug)
    .single()) as any;

  if (!product) {
    notFound();
  }

  const variants = product.variants || [];
  const images = (product.images || []).sort((a: any, b: any) => (a.sort || 0) - (b.sort || 0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
      <ProductDetailView product={product} variants={variants} images={images} />
    </div>
  );
}
