import { User } from '@supabase/supabase-js';
import {
  AdminModule,
  AppRole,
  hasModuleAccess,
  isTeamRole,
  resolveUserRole,
} from '@/lib/rbac';

export function getUserRole(user: User | null): AppRole {
  return resolveUserRole(user);
}

export function isAdminOrStaff(user: User | null): boolean {
  return isTeamRole(resolveUserRole(user));
}

export function isStrictAdmin(user: User | null): boolean {
  return resolveUserRole(user) === 'admin';
}

export function hasAdminPermission(user: User | null, mod: AdminModule): boolean {
  return hasModuleAccess(resolveUserRole(user), mod);
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
