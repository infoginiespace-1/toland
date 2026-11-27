import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Layers,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { ProductsTableClient } from '@/components/admin/products-table-client';

export const dynamic = 'force-dynamic';

interface ProductsAdminPageProps {
  searchParams: {
    search?: string;
    categoryId?: string;
    status?: string;
  };
}

export default async function AdminProductsPage({ searchParams }: ProductsAdminPageProps) {
  const supabase = createClient();
  const search = searchParams.search || '';
  const categoryId = searchParams.categoryId || '';
  const status = searchParams.status || 'all';

  // Build products query
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      variants:product_variants(*),
      images:product_images(*)
    `)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (status === 'active') {
    query = query.eq('is_active', true);
  } else if (status === 'inactive') {
    query = query.eq('is_active', false);
  }

  // Fetch categories and products simultaneously in parallel
  const [categoriesRes, productsDataRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug')
      .order('sort', { ascending: true }),
    query,
  ]);

  const categories = categoriesRes.data || [];
  const products = (productsDataRes.data || []) as any[];

  // Calculate summary counts
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_active).length;
  const totalStockUnits = products.reduce((acc, p) => {
    const sum = (p.variants || []).reduce((vAcc: number, v: any) => vAcc + Number(v.stock_qty || 0), 0);
    return acc + sum;
  }, 0);
  const lowStockCount = products.filter((p) => {
    return (p.variants || []).some((v: any) => Number(v.stock_qty || 0) <= 5);
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Package className="w-4 h-4" />
            <span>Catalog Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">
            Manufactured Products
          </h1>
          <p className="text-xs text-muted">
            Manage factory models, pricing, Supabase Storage media, and stock levels.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs">
          <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">
            Total Styles
          </span>
          <div className="text-2xl font-black text-text mt-1">{totalProducts}</div>
          <span className="text-3xs text-primary font-bold">Catalog Models</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs">
          <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">
            Active Storefront
          </span>
          <div className="text-2xl font-black text-accent mt-1">{activeProducts}</div>
          <span className="text-3xs text-muted">Live for customers</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs">
          <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">
            Finished Stock
          </span>
          <div className="text-2xl font-black text-primary mt-1">{totalStockUnits}</div>
          <span className="text-3xs text-muted">Total units in Sheikhpura</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CFE0D5] shadow-xs">
          <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">
            Low Stock Alerts
          </span>
          <div className={`text-2xl font-black mt-1 ${lowStockCount > 0 ? 'text-danger' : 'text-text'}`}>
            {lowStockCount}
          </div>
          <span className="text-3xs text-muted">&le; 5 units remaining</span>
        </div>
      </div>

      {/* Interactive Products Table Component */}
      <ProductsTableClient
        products={products}
        categories={(categories || []) as any[]}
        initialSearch={search}
        initialCategoryId={categoryId}
        initialStatus={status}
      />
    </div>
  );
}
