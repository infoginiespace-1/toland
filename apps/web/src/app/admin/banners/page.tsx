import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { BannersManager } from '@/components/admin/banners-manager';

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const supabase = createClient();

  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .order('sort', { ascending: true });

  return (
    <div className="space-y-6">
      <BannersManager banners={(banners || []) as any[]} />
    </div>
  );
}
