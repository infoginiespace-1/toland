import { User } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['info.giniespace@gmail.com', 'dawoodhussain504@gmail.com'];

export function isAdminOrStaff(user: User | null): boolean {
  if (!user) return false;
  const role = user.app_metadata?.role || user.user_metadata?.role;
  const email = user.email?.toLowerCase() || '';
  return role === 'admin' || role === 'staff' || ADMIN_EMAILS.includes(email);
}

export function isStrictAdmin(user: User | null): boolean {
  if (!user) return false;
  const role = user.app_metadata?.role || user.user_metadata?.role;
  const email = user.email?.toLowerCase() || '';
  return role === 'admin' || ADMIN_EMAILS.includes(email);
}

export async function triggerBridgeEndpoint(path: '/trigger-queue' | '/resume' | '/pause'): Promise<void> {
  const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL || 'https://toland-whatsapp-bridge.onrender.com';
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
