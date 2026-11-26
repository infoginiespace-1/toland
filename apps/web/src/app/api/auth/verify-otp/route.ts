import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = String(body.phone || '').trim();
    const otp = String(body.otp || '').trim();

    if (!rawPhone || !otp) {
      return NextResponse.json({ error: 'Phone number and OTP are required' }, { status: 400 });
    }

    // Standardize Indian phone number format
    const cleaned = rawPhone.replace(/\D/g, '');
    let formattedPhone = '';
    if (cleaned.length === 10) {
      formattedPhone = `+91${cleaned}`;
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      formattedPhone = `+${cleaned}`;
    } else {
      formattedPhone = `+91${cleaned.slice(-10)}`;
    }

    const supabaseAdmin = createAdminClient();

    // 1. Verify OTP from phone_otps table
    const { data: otpRecords, error: otpError } = await (supabaseAdmin as any)
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

    // Delete used OTP
    if (otpRecords && otpRecords.length > 0) {
      await (supabaseAdmin as any).from('phone_otps').delete().eq('id', otpRecords[0].id);
    }

    // 2. Check if user is in admin allowlist
    const last10 = cleaned.slice(-10);
    const { data: allowlistRows } = await (supabaseAdmin as any)
      .from('admin_allowlist')
      .select('role')
      .or(`phone.eq.${formattedPhone},phone.eq.${last10},phone.eq.+91${last10}`);

    const isAllowlisted = allowlistRows && allowlistRows.length > 0;
    const assignedRole = isAllowlisted ? allowlistRows[0].role || 'admin' : 'customer';

    // 3. Ensure user exists in Supabase Auth
    const userEmail = `${last10}@phone.toland.in`;
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    let user = userList?.users?.find(
      (u) => u.email === userEmail || u.phone === formattedPhone
    );

    if (!user) {
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        phone: formattedPhone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { phone: formattedPhone, role: assignedRole },
        app_metadata: { role: assignedRole },
      });

      if (createErr) {
        console.error('Error creating user:', createErr);
        throw createErr;
      }
      user = newUser.user;
    } else {
      // Update app_metadata with latest assigned role
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: { role: assignedRole },
        user_metadata: { phone: formattedPhone, role: assignedRole },
      });
    }

    // 4. Ensure profile row exists in public.profiles
    await (supabaseAdmin as any).from('profiles').upsert(
      {
        id: user.id,
        phone: formattedPhone,
        name: isAllowlisted ? 'TOLAND Admin' : 'Customer',
        email: userEmail,
        role: assignedRole,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // 5. Generate secure token hash for client session establishment
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
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
