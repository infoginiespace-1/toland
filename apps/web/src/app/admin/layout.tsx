import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { isPrimarySuperAdmin, isTeamRole, resolveUserRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/admin');
  }

  const role = resolveUserRole(user);
  if (!isTeamRole(role)) {
    redirect('/');
  }

  const displayName = user.user_metadata?.name || user.email || user.phone || 'Admin';
  const superAdmin = isPrimarySuperAdmin(user);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans text-slate-900">
      <AdminSidebar userPhone={displayName} userRole={role} isSuperAdmin={superAdmin} />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
