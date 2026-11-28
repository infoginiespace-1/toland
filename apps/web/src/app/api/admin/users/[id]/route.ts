import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSoleSuperAdmin } from '@/lib/admin-auth';
import { normalizeIndianPhone } from '@/lib/auth-helpers';
import {
  ALL_ROLES,
  hasCustomPermissionOverride,
  isProtectedOwner,
  isTeamRole,
  normalizeRoleValue,
  resolveUserPermissions,
  sanitizePermissionList,
} from '@/lib/rbac';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser || !isSoleSuperAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Only Primary Super Admin can assign roles & permissions' },
        { status: 403 }
      );
    }

    const targetId = params.id;
    const body = await request.json();

    if (targetId === currentUser.id) {
      return NextResponse.json(
        { error: 'You cannot modify your own active Super Admin role.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const { data: userData, error: fetchErr } =
      await supabaseAdmin.auth.admin.getUserById(targetId);
    if (fetchErr || !userData?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = userData.user;
    const { data: profileRow } = await (supabaseAdmin as any)
      .from('profiles')
      .select('id, phone, email, name, role, permissions')
      .eq('id', targetId)
      .maybeSingle();

    const nextRoleRaw = String(
      body.role !== undefined ? body.role : profileRow?.role || targetUser.app_metadata?.role || 'customer'
    )
      .trim()
      .toLowerCase();

    if (!ALL_ROLES.includes(nextRoleRaw as any)) {
      return NextResponse.json(
        { error: `Invalid role. Allowed roles: ${ALL_ROLES.join(', ')}` },
        { status: 400 }
      );
    }
    const nextRole = normalizeRoleValue(nextRoleRaw);

    const realEmail =
      targetUser.email && !targetUser.email.endsWith('@phone.toland.in')
        ? targetUser.email.toLowerCase()
        : profileRow?.email && !profileRow.email.endsWith('@phone.toland.in')
          ? profileRow.email.toLowerCase()
          : null;

    const rawPhone =
      profileRow?.phone || targetUser.user_metadata?.phone || targetUser.phone || null;
    const phoneInfo = rawPhone ? normalizeIndianPhone(rawPhone) : null;
    const canonicalPhone = phoneInfo?.valid ? phoneInfo.canonical : null;

    if (isProtectedOwner(realEmail || targetUser.email, canonicalPhone || rawPhone)) {
      return NextResponse.json(
        { error: 'Primary Super Admin account is protected and cannot be modified.' },
        { status: 403 }
      );
    }

    // Determine stored custom permissions:
    // - Customer role always resets custom permissions to null
    // - Explicit array saves custom ticked tabs (or null if identical to role defaults)
    // - Explicit null (or quick role change without permissions field) resets to role defaults
    let permissionsToSave: string[] | null = null;
    if (isTeamRole(nextRole) && Array.isArray(body.permissions)) {
      const sanitized = sanitizePermissionList(body.permissions) || [];
      permissionsToSave = hasCustomPermissionOverride(nextRole, sanitized)
        ? sanitized
        : null;
    }

    // 1. Update auth.users app_metadata + user_metadata so JWT & Middleware update seamlessly
    const nextAppMeta: Record<string, any> = {
      ...(targetUser.app_metadata || {}),
      role: nextRole,
    };
    if (permissionsToSave !== null) {
      nextAppMeta.permissions = permissionsToSave;
    } else {
      delete nextAppMeta.permissions;
    }

    const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(
      targetId,
      {
        app_metadata: nextAppMeta,
        user_metadata: { ...(targetUser.user_metadata || {}), role: nextRole },
      }
    );
    if (updateAuthErr) throw updateAuthErr;

    // 2. Sync public.profiles
    const { error: profileErr } = await (supabaseAdmin as any)
      .from('profiles')
      .upsert(
        {
          id: targetId,
          email: targetUser.email || realEmail,
          phone: canonicalPhone,
          name:
            profileRow?.name ||
            targetUser.user_metadata?.name ||
            (realEmail ? realEmail.split('@')[0] : canonicalPhone || 'Customer'),
          role: nextRole,
          permissions: permissionsToSave,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    if (profileErr) throw profileErr;

    // 3. Sync public.admin_allowlist
    if (realEmail) {
      await (supabaseAdmin as any)
        .from('admin_allowlist')
        .delete()
        .ilike('email', realEmail);
    }
    if (phoneInfo?.valid) {
      await (supabaseAdmin as any)
        .from('admin_allowlist')
        .delete()
        .in('phone', [phoneInfo.canonical, phoneInfo.last10, phoneInfo.authDigits]);
    }

    if (isTeamRole(nextRole) && (realEmail || canonicalPhone)) {
      await (supabaseAdmin as any).from('admin_allowlist').insert({
        email: realEmail,
        phone: canonicalPhone,
        role: nextRole,
        permissions: permissionsToSave,
        notes: permissionsToSave !== null ? 'Custom permissions assigned via Admin Panel' : 'Assigned via Admin Panel',
      });
    }

    const effectivePermissions = resolveUserPermissions(
      { email: realEmail || targetUser.email, app_metadata: nextAppMeta },
      permissionsToSave
    );

    return NextResponse.json({
      success: true,
      role: nextRole,
      permissions: effectivePermissions,
      hasCustomPermissions: permissionsToSave !== null,
      message:
        permissionsToSave !== null
          ? `Role & ${effectivePermissions.length} custom module permissions saved.`
          : `Role updated to "${nextRole}" with default module permissions.`,
    });
  } catch (err: any) {
    console.error('PATCH /api/admin/users/[id] error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update user permissions' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser || !isSoleSuperAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Only Primary Super Admin can delete users' },
        { status: 403 }
      );
    }

    const targetId = params.id;

    if (targetId === currentUser.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own currently logged-in Super Admin account.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const { data: userData, error: fetchErr } =
      await supabaseAdmin.auth.admin.getUserById(targetId);

    if (fetchErr || !userData?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = userData.user;
    const { data: profileRow } = await (supabaseAdmin as any)
      .from('profiles')
      .select('phone, email')
      .eq('id', targetId)
      .maybeSingle();

    const rawEmail = targetUser.email || profileRow?.email || null;
    const rawPhone =
      profileRow?.phone || targetUser.user_metadata?.phone || targetUser.phone || null;

    if (isProtectedOwner(rawEmail, rawPhone)) {
      return NextResponse.json(
        { error: 'Primary Super Admin account is protected and cannot be deleted.' },
        { status: 403 }
      );
    }

    const phoneInfo = rawPhone ? normalizeIndianPhone(rawPhone) : null;

    if (rawEmail && !rawEmail.endsWith('@phone.toland.in')) {
      await (supabaseAdmin as any)
        .from('admin_allowlist')
        .delete()
        .ilike('email', rawEmail);
    }
    if (phoneInfo?.valid) {
      await (supabaseAdmin as any)
        .from('admin_allowlist')
        .delete()
        .in('phone', [phoneInfo.canonical, phoneInfo.last10, phoneInfo.authDigits]);

      await (supabaseAdmin as any)
        .from('phone_otps')
        .delete()
        .in('phone', [phoneInfo.canonical, phoneInfo.last10, phoneInfo.authDigits]);
    }

    await (supabaseAdmin as any)
      .from('customers_crm')
      .update({ profile_id: null, updated_at: new Date().toISOString() })
      .eq('profile_id', targetId);

    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(targetId);
    if (deleteErr) throw deleteErr;

    await (supabaseAdmin as any).from('profiles').delete().eq('id', targetId);

    return NextResponse.json({
      success: true,
      deletedId: targetId,
      message:
        'User deleted cleanly. Their email and mobile number are now free for fresh signup.',
    });
  } catch (err: any) {
    console.error('DELETE /api/admin/users/[id] error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete user account' },
      { status: 500 }
    );
  }
}
