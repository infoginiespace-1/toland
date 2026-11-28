import { createAdminClient } from '@/lib/supabase/admin';

export interface NormalizedPhone {
  valid: boolean;
  canonical: string;   // +919876543210
  authDigits: string;  // 919876543210
  last10: string;      // 9876543210
}

export function normalizeIndianPhone(input: string): NormalizedPhone {
  const digits = String(input || '').replace(/\D/g, '');
  let last10 = '';

  if (digits.length === 10) {
    last10 = digits;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    last10 = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    last10 = digits.slice(1);
  } else if (digits.length > 10) {
    last10 = digits.slice(-10);
  }

  const canonical = last10 ? `+91${last10}` : '';
  const authDigits = last10 ? `91${last10}` : '';
  const valid = /^\+91[6-9]\d{9}$/.test(canonical);

  return { valid, canonical, authDigits, last10 };
}

export function isValidEmail(input: string): boolean {
  const email = String(input || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export interface IdentityAvailability {
  email_taken: boolean;
  phone_taken: boolean;
  phone_owner_is_synthetic: boolean;
  unconfirmed_user_id: string | null;
}

export async function checkIdentityAvailability(
  email: string,
  phone: string
): Promise<IdentityAvailability> {
  const supabaseAdmin = createAdminClient();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = normalizeIndianPhone(phone).canonical;

  const { data, error } = await (supabaseAdmin as any).rpc('check_identity_availability', {
    p_email: normalizedEmail || null,
    p_phone: normalizedPhone || null,
  });

  if (!error && data) {
    return {
      email_taken: Boolean(data.email_taken),
      phone_taken: Boolean(data.phone_taken),
      phone_owner_is_synthetic: Boolean(data.phone_owner_is_synthetic),
      unconfirmed_user_id: data.unconfirmed_user_id || null,
    };
  }

  if (error) {
    console.warn('[auth-helpers] check_identity_availability RPC fallback:', error.message);
  }

  // Fallback query against profiles in case RPC cache hasn't reloaded yet
  let emailTaken = false;
  let phoneTaken = false;

  if (normalizedEmail) {
    const { data: emailProfiles } = await (supabaseAdmin as any)
      .from('profiles')
      .select('id')
      .ilike('email', normalizedEmail)
      .limit(1);
    emailTaken = Boolean(emailProfiles && emailProfiles.length > 0);
  }

  if (normalizedPhone) {
    const { last10, authDigits } = normalizeIndianPhone(phone);
    const { data: phoneProfiles } = await (supabaseAdmin as any)
      .from('profiles')
      .select('id')
      .in('phone', [normalizedPhone, last10, authDigits])
      .limit(1);
    phoneTaken = Boolean(phoneProfiles && phoneProfiles.length > 0);
  }

  return {
    email_taken: emailTaken,
    phone_taken: phoneTaken,
    phone_owner_is_synthetic: false,
    unconfirmed_user_id: null,
  };
}

export interface VerifiedPhoneUser {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  name: string;
}

export async function findVerifiedUserByPhone(phone: string): Promise<VerifiedPhoneUser | null> {
  const supabaseAdmin = createAdminClient();
  const normalized = normalizeIndianPhone(phone);
  if (!normalized.last10) return null;

  const { data, error } = await (supabaseAdmin as any).rpc('find_verified_user_by_phone', {
    p_phone: normalized.canonical,
  });

  if (!error && data && data.id) {
    return {
      id: data.id,
      email: data.email,
      phone: data.phone || normalized.canonical,
      role: data.role || 'customer',
      name: data.name || 'Customer',
    };
  }

  if (error) {
    console.warn('[auth-helpers] find_verified_user_by_phone RPC fallback:', error.message);
  }

  // Fallback via profiles table if needed
  const { data: profileRow } = await (supabaseAdmin as any)
    .from('profiles')
    .select('id, email, phone, role, name')
    .in('phone', [normalized.canonical, normalized.last10, normalized.authDigits])
    .limit(1)
    .maybeSingle();

  if (profileRow?.id && profileRow?.email) {
    return {
      id: profileRow.id,
      email: profileRow.email,
      phone: profileRow.phone,
      role: profileRow.role || 'customer',
      name: profileRow.name || 'Customer',
    };
  }

  return null;
}
