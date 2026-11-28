import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/admin/product-form';

export const dynamic = 'force-dynamic';

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const supabase = createClient();

  const [{ data: categories }, { data: productData }, { data: bomsData }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug')
      .order('sort', { ascending: true }),
    supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq('id', params.id)
      .single(),
    supabase
      .from('boms')
      .select('*, raw_material:raw_materials(*)')
      .eq('product_id', params.id),
  ]);

  if (!productData) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ProductForm
        initialData={productData}
        categories={(categories || []) as any[]}
        bomsData={(bomsData || []) as any[]}
        isEdit={true}
      />
    </div>
  );
}
