import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { findVerifiedUserByPhone, normalizeIndianPhone } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = String(body.phone || '').trim();
    const otp = String(body.otp || '').trim();

    if (!rawPhone || !otp) {
      return NextResponse.json({ error: 'Phone number and OTP are required' }, { status: 400 });
    }

    const phoneInfo = normalizeIndianPhone(rawPhone);
    if (!phoneInfo.valid) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number' },
        { status: 400 }
      );
    }

    const formattedPhone = phoneInfo.canonical;
    const last10 = phoneInfo.last10;
    const supabaseAdmin = createAdminClient();

    // 1. Verify OTP from phone_otps table
    const { data: otpRecords } = await (supabaseAdmin as any)
      .from('phone_otps')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('otp', otp)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    const isValidOtp = Boolean(otpRecords && otpRecords.length > 0);
    if (!isValidOtp) {
      return NextResponse.json(
        { error: 'Invalid or expired 6-digit OTP code. Please check and try again.' },
        { status: 401 }
      );
    }

    await (supabaseAdmin as any).from('phone_otps').delete().eq('id', otpRecords[0].id);

    // 2. Check if phone is in admin allowlist
    const { data: allowlistRows } = await (supabaseAdmin as any)
      .from('admin_allowlist')
      .select('role')
      .or(`phone.eq.${formattedPhone},phone.eq.${last10},phone.eq.${phoneInfo.authDigits}`);

    const isAllowlisted = Boolean(allowlistRows && allowlistRows.length > 0);
    const allowlistedRole = isAllowlisted ? allowlistRows[0].role || 'admin' : null;

    // 3. Look up ANY existing user owning this mobile number (email-signup OR phone-signup)
    let targetUser = await findVerifiedUserByPhone(formattedPhone);
    let targetEmail = targetUser?.email || `${last10}@phone.toland.in`;
    let assignedRole = allowlistedRole || targetUser?.role || 'customer';

    if (!targetUser) {
      // Create brand new single account for this phone (trigger creates profile & CRM row)
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: targetEmail,
        phone: formattedPhone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: {
          name: isAllowlisted ? 'TOLAND Admin' : 'Customer',
          phone: formattedPhone,
          role: assignedRole,
        },
        app_metadata: { role: assignedRole },
      });

      if (createErr || !newUser?.user) {
        console.error('Error creating phone user:', createErr);
        throw createErr || new Error('Failed to create user account');
      }

      targetUser = {
        id: newUser.user.id,
        email: targetEmail,
        phone: formattedPhone,
        role: assignedRole,
        name: isAllowlisted ? 'TOLAND Admin' : 'Customer',
      };
    } else {
      // Link & confirm phone on the existing single account (never create a duplicate)
      await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
        phone: formattedPhone,
        phone_confirm: true,
        app_metadata: { role: assignedRole },
        user_metadata: {
          name: targetUser.name,
          phone: formattedPhone,
          role: assignedRole,
        },
      });

      await (supabaseAdmin as any)
        .from('profiles')
        .upsert(
          {
            id: targetUser.id,
            phone: formattedPhone,
            name: targetUser.name,
            email: targetEmail,
            role: assignedRole,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
    }

    // 4. Generate magiclink token hash for the matched single account
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetEmail,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error('Error generating auth link:', linkErr);
      throw new Error(linkErr?.message || 'Failed to generate authentication token');
    }

    return NextResponse.json({
      success: true,
      token_hash: linkData.properties.hashed_token,
      role: assignedRole,
      redirectTo: assignedRole === 'admin' || assignedRole === 'staff' ? '/admin' : '/',
    });
  } catch (err: any) {
    console.error('Error in /api/auth/verify-otp:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error verifying OTP' },
      { status: 500 }
    );
  }
}
