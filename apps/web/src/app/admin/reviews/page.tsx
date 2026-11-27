import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { ReviewsManager } from '@/components/admin/reviews-manager';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const supabase = createAdminClient();

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      product:products(id, name, slug)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <ReviewsManager initialReviews={(reviews || []) as any[]} />
    </div>
  );
}
