import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { CategoriesManager } from '@/components/admin/categories-manager';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort', { ascending: true });

  return (
    <div className="space-y-6">
      <CategoriesManager categories={(categories || []) as any[]} />
    </div>
  );
}
