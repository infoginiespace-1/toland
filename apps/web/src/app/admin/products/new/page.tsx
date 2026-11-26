import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/admin/product-form';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('sort', { ascending: true });

  return (
    <div className="space-y-6">
      <ProductForm categories={(categories || []) as any[]} isEdit={false} />
    </div>
  );
}
