import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import {
  AdminModule,
  AppRole,
  hasUserPermission,
  isPrimarySuperAdmin,
  resolveUserPermissions,
  resolveUserRole,
} from '@/lib/rbac';

export function getUserRole(user: User | null): AppRole {
  return resolveUserRole(user);
}

export function isAdminOrStaff(user: User | null): boolean {
  return resolveUserPermissions(user).length > 0;
}

export function isStrictAdmin(user: User | null): boolean {
  return resolveUserRole(user) === 'admin';
}

export function isSoleSuperAdmin(user: User | null): boolean {
  return isPrimarySuperAdmin(user);
}

export function hasAdminPermission(
  user: User | null,
  mod: AdminModule | AdminModule[]
): boolean {
  return hasUserPermission(user, mod);
}

/**
 * Live-verified API guard: checks Supabase user + live profiles.role & profiles.permissions
 * so permission edits by Super Admin take effect immediately without waiting for JWT refresh.
 */
export async function verifyApiPermission(
  required: AdminModule | AdminModule[]
): Promise<{
  allowed: boolean;
  user: User | null;
  status: 200 | 401 | 403;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, user: null, status: 401 };
  }

  if (isPrimarySuperAdmin(user)) {
    return { allowed: true, user, status: 200 };
  }

  const requiredList = Array.isArray(required) ? required : [required];
  if (requiredList.includes('users') && requiredList.length === 1) {
    return { allowed: false, user, status: 403 };
  }

  const { data: profileRow } = await (supabase as any)
    .from('profiles')
    .select('role, permissions')
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

  const allowed = hasUserPermission(effectiveAuth, required);
  return {
    allowed,
    user,
    status: allowed ? 200 : 403,
  };
}

export async function triggerBridgeEndpoint(
  path: '/trigger-queue' | '/resume' | '/pause'
): Promise<void> {
  const bridgeUrl =
    process.env.WHATSAPP_BRIDGE_URL || 'https://toland-whatsapp-bridge.onrender.com';
  const secret = process.env.WHATSAPP_BRIDGE_SECRET || 'toland_bridge_secret_dev';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    await fetch(`${bridgeUrl}${path}`, {
      method: 'POST',
      headers: { 'x-bridge-secret': secret },
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch {
    // Non-blocking best-effort wakeup
  }
}
