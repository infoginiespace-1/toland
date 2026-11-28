import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isStrictAdmin } from '@/lib/admin-auth';
import { isProtectedOwner, resolveUserRole } from '@/lib/rbac';
import { normalizeIndianPhone } from '@/lib/auth-helpers';
import { UsersManager, AdminUserItem } from '@/components/admin/users-manager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const supabase = createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser || !isStrictAdmin(currentUser)) {
    redirect('/admin');
  }

  const supabaseAdmin = createAdminClient();

  const authUsers: any[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) break;
    const batch = data?.users || [];
    authUsers.push(...batch);
    if (batch.length < 1000) break;
    page += 1;
  }

  const [profilesRes, ordersRes, allowlistRes] = await Promise.all([
    (supabaseAdmin as any)
      .from('profiles')
      .select('id, phone, name, email, role, created_at'),
    (supabaseAdmin as any)
      .from('orders')
      .select('user_id, total')
      .not('user_id', 'is', null),
    (supabaseAdmin as any)
      .from('admin_allowlist')
      .select('id, phone, email, role, notes, created_at')
      .order('created_at', { ascending: false }),
  ]);

  const profileMap = new Map<string, any>();
  for (const p of profilesRes.data || []) profileMap.set(p.id, p);

  const orderStats = new Map<string, { count: number; spent: number }>();
  for (const o of ordersRes.data || []) {
    if (!o.user_id) continue;
    const cur = orderStats.get(o.user_id) || { count: 0, spent: 0 };
    cur.count += 1;
    cur.spent += Number(o.total || 0);
    orderStats.set(o.user_id, cur);
  }

  const initialUsers: AdminUserItem[] = authUsers
    .map((u) => {
      const prof = profileMap.get(u.id);
      const rawEmail = u.email || prof?.email || null;
      const isSynthetic = Boolean(rawEmail && rawEmail.endsWith('@phone.toland.in'));
      const displayEmail = isSynthetic ? null : rawEmail;

      const rawPhone = prof?.phone || u.user_metadata?.phone || u.phone || null;
      const phoneNorm = rawPhone ? normalizeIndianPhone(rawPhone) : null;
      const displayPhone = phoneNorm?.valid ? phoneNorm.canonical : rawPhone;

      const role = resolveUserRole({
        email: rawEmail,
        app_metadata: u.app_metadata,
        user_metadata: {
          ...u.user_metadata,
          role: prof?.role || u.user_metadata?.role,
        },
      });

      const stats = orderStats.get(u.id) || { count: 0, spent: 0 };

      return {
        id: u.id,
        name:
          prof?.name ||
          u.user_metadata?.name ||
          (displayEmail ? displayEmail.split('@')[0] : displayPhone || 'User'),
        email: displayEmail,
        authEmail: rawEmail,
        phone: displayPhone,
        role,
        emailConfirmed: Boolean(u.email_confirmed_at),
        phoneConfirmed: Boolean(u.phone_confirmed_at),
        isProtected: isProtectedOwner(rawEmail, displayPhone),
        isSelf: u.id === currentUser.id,
        ordersCount: stats.count,
        totalSpent: stats.spent,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at || null,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <UsersManager
      initialUsers={initialUsers}
      initialAllowlist={allowlistRes.data || []}
    />
  );
}
