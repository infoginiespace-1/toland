import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSoleSuperAdmin } from '@/lib/admin-auth';
import { normalizeIndianPhone, isValidEmail } from '@/lib/auth-helpers';
import {
  ALL_ROLES,
  AppRole,
  TEAM_ROLES,
  hasCustomPermissionOverride,
  isProtectedOwner,
  normalizeRoleValue,
  resolveUserPermissions,
  resolveUserRole,
  sanitizePermissionList,
} from '@/lib/rbac';

export const dynamic = 'force-dynamic';

async function listAllAuthUsers(supabaseAdmin: ReturnType<typeof createAdminClient>) {
  const users: any[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
}

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser || !isSoleSuperAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Only Primary Super Admin can manage users and permissions' },
        { status: 403 }
      );
    }

    const supabaseAdmin = createAdminClient();

    const [authUsers, profilesRes, ordersRes, allowlistRes] = await Promise.all([
      listAllAuthUsers(supabaseAdmin),
      (supabaseAdmin as any)
        .from('profiles')
        .select('id, phone, name, email, role, permissions, created_at, updated_at'),
      (supabaseAdmin as any)
        .from('orders')
        .select('user_id, total')
        .not('user_id', 'is', null),
      (supabaseAdmin as any)
        .from('admin_allowlist')
        .select('id, phone, email, role, permissions, notes, created_at')
        .order('created_at', { ascending: false }),
    ]);

    const profileMap = new Map<string, any>();
    for (const p of profilesRes.data || []) {
      profileMap.set(p.id, p);
    }

    const orderStats = new Map<string, { count: number; spent: number }>();
    for (const o of ordersRes.data || []) {
      if (!o.user_id) continue;
      const cur = orderStats.get(o.user_id) || { count: 0, spent: 0 };
      cur.count += 1;
      cur.spent += Number(o.total || 0);
      orderStats.set(o.user_id, cur);
    }

    const users = authUsers
      .map((u) => {
        const prof = profileMap.get(u.id);
        const rawEmail = u.email || prof?.email || null;
        const isSyntheticEmail = Boolean(rawEmail && rawEmail.endsWith('@phone.toland.in'));
        const displayEmail = isSyntheticEmail ? null : rawEmail;

        const rawPhone =
          prof?.phone || u.user_metadata?.phone || u.phone || null;
        const phoneNorm = rawPhone ? normalizeIndianPhone(rawPhone) : null;
        const displayPhone = phoneNorm?.valid ? phoneNorm.canonical : rawPhone;

        const authLike = {
          email: rawEmail,
          app_metadata: u.app_metadata,
          user_metadata: {
            ...u.user_metadata,
            role: prof?.role || u.user_metadata?.role,
          },
        };

        const resolvedRole: AppRole = resolveUserRole(authLike);
        const explicitCustom = prof?.permissions ?? u.app_metadata?.permissions;
        const permissions = resolveUserPermissions(authLike, explicitCustom);
        const isProt = isProtectedOwner(rawEmail, displayPhone);
        const hasCustomPermissions =
          !isProt &&
          explicitCustom !== null &&
          explicitCustom !== undefined &&
          hasCustomPermissionOverride(resolvedRole, permissions);

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
          role: resolvedRole,
          permissions,
          hasCustomPermissions,
          emailConfirmed: Boolean(u.email_confirmed_at),
          phoneConfirmed: Boolean(u.phone_confirmed_at),
          isProtected: isProt,
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

    return NextResponse.json({
      success: true,
      users,
      allowlist: allowlistRes.data || [],
    });
  } catch (err: any) {
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to load user directory' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser || !isSoleSuperAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Only Primary Super Admin can assign team roles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const rawPhone = String(body.phone || '').trim();
    const role = normalizeRoleValue(body.role);
    const notes = String(body.notes || '').trim();
    const customPerms =
      body.permissions !== undefined ? sanitizePermissionList(body.permissions) : null;

    if (!TEAM_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Please select a valid team role (${TEAM_ROLES.join(', ')})` },
        { status: 400 }
      );
    }

    if (!email && !rawPhone) {
      return NextResponse.json(
        { error: 'Please provide an email address or 10-digit mobile number' },
        { status: 400 }
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    let canonicalPhone: string | null = null;
    if (rawPhone) {
      const phoneInfo = normalizeIndianPhone(rawPhone);
      if (!phoneInfo.valid) {
        return NextResponse.json(
          { error: 'Please enter a valid 10-digit Indian mobile number' },
          { status: 400 }
        );
      }
      canonicalPhone = phoneInfo.canonical;
    }

    const supabaseAdmin = createAdminClient();

    if (email) {
      await (supabaseAdmin as any)
        .from('admin_allowlist')
        .delete()
        .ilike('email', email);
    }
    if (canonicalPhone) {
      const phoneInfo = normalizeIndianPhone(canonicalPhone);
      await (supabaseAdmin as any)
        .from('admin_allowlist')
        .delete()
        .in('phone', [phoneInfo.canonical, phoneInfo.last10, phoneInfo.authDigits]);
    }

    const permissionsToSave =
      customPerms && hasCustomPermissionOverride(role, customPerms)
        ? customPerms
        : customPerms !== null
          ? customPerms
          : null;

    const { error: insertErr } = await (supabaseAdmin as any)
      .from('admin_allowlist')
      .insert({
        email: email || null,
        phone: canonicalPhone,
        role,
        permissions: permissionsToSave,
        notes: notes || 'Pre-assigned via Admin Panel',
      });

    if (insertErr) throw insertErr;

    const allUsers = await listAllAuthUsers(supabaseAdmin);
    const matchingUser = allUsers.find((u) => {
      const uEmail = (u.email || '').toLowerCase();
      const uDigits = String(u.phone || u.user_metadata?.phone || '')
        .replace(/\D/g, '')
        .slice(-10);
      const targetDigits = canonicalPhone ? canonicalPhone.slice(-10) : '';
      return (email && uEmail === email) || (targetDigits && uDigits === targetDigits);
    });

    if (matchingUser && !isProtectedOwner(matchingUser.email, matchingUser.phone)) {
      const nextAppMeta = { ...(matchingUser.app_metadata || {}), role };
      if (permissionsToSave !== null) {
        nextAppMeta.permissions = permissionsToSave;
      } else {
        delete nextAppMeta.permissions;
      }

      await supabaseAdmin.auth.admin.updateUserById(matchingUser.id, {
        app_metadata: nextAppMeta,
        user_metadata: { ...(matchingUser.user_metadata || {}), role },
      });
      await (supabaseAdmin as any)
        .from('profiles')
        .update({
          role,
          permissions: permissionsToSave,
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchingUser.id);
    }

    return NextResponse.json({
      success: true,
      message: matchingUser
        ? `Role "${role}" & permissions assigned to existing user.`
        : `Role "${role}" & module access pre-authorized for next login.`,
      validRoles: ALL_ROLES,
    });
  } catch (err: any) {
    console.error('POST /api/admin/users error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to pre-assign team role' },
      { status: 500 }
    );
  }
}
