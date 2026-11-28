import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  checkIdentityAvailability,
  isValidEmail,
  normalizeIndianPhone,
} from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.name || '').trim();
    const rawPhone = String(body.phone || '').trim();

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { error: 'Please enter your full name (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (email.endsWith('@phone.toland.in')) {
      return NextResponse.json(
        { error: 'Please enter your personal email address.' },
        { status: 400 }
      );
    }

    const phoneInfo = normalizeIndianPhone(rawPhone);
    if (!phoneInfo.valid) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // 1. Strict global uniqueness check across ALL auth users & profiles (email + mobile)
    const availability = await checkIdentityAvailability(email, phoneInfo.canonical);

    if (availability.email_taken) {
      return NextResponse.json(
        {
          error: 'An account with this email address already exists. Please Sign In instead.',
          field: 'email',
        },
        { status: 409 }
      );
    }

    if (availability.phone_taken) {
      return NextResponse.json(
        {
          error: availability.phone_owner_is_synthetic
            ? 'This mobile number is already registered with WhatsApp Login. Please sign in using WhatsApp Phone.'
            : 'This mobile number is already registered with another account. Duplicate accounts are not allowed.',
          field: 'phone',
        },
        { status: 409 }
      );
    }

    // 2. If there is an abandoned unconfirmed signup for this same email, clean it up first
    // so the user can re-trigger Supabase Auth Email OTP cleanly.
    if (availability.unconfirmed_user_id) {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.auth.admin.deleteUser(availability.unconfirmed_user_id);
    }

    // Never create a confirmed account here — client will now invoke supabase.auth.signUp()
    // so Supabase Auth sends the real verification OTP and DB trigger activates profile ONLY after OTP verification.
    return NextResponse.json({
      success: true,
      allowed: true,
      email,
      phone: phoneInfo.canonical,
      name: fullName,
    });
  } catch (err: any) {
    console.error('Sign up pre-check route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error validating registration details' },
      { status: 500 }
    );
  }
}
