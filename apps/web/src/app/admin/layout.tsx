import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import {
  isPrimarySuperAdmin,
  isTeamRole,
  resolveUserPermissions,
  resolveUserRole,
} from '@/lib/rbac';

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

  // Pull live profile role/permissions so changes made by Super Admin apply immediately
  const { data: profileRow } = await (supabase as any)
    .from('profiles')
    .select('role, permissions, name')
    .eq('id', user.id)
    .maybeSingle();

  const effectiveAuth = {
    email: user.email,
    app_metadata: {
      ...(user.app_metadata || {}),
      ...(profileRow?.role ? { role: profileRow.role } : {}),
      ...(profileRow && profileRow.permissions !== undefined
        ? { permissions: profileRow.permissions }
        : {}),
    },
    user_metadata: user.user_metadata,
  };

  const role = resolveUserRole(effectiveAuth);
  const permissions = resolveUserPermissions(effectiveAuth);
  const superAdmin = isPrimarySuperAdmin(user);

  if (!superAdmin && (!isTeamRole(role) || permissions.length === 0)) {
    redirect('/');
  }

  const displayName =
    profileRow?.name || user.user_metadata?.name || user.email || user.phone || 'Admin';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans text-slate-900">
      <AdminSidebar
        userPhone={displayName}
        userRole={role}
        isSuperAdmin={superAdmin}
        permissions={permissions}
      />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}
