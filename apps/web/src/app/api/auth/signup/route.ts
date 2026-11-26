import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 1. Check if user already exists
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existing = userList?.users?.find((u) => u.email?.toLowerCase() === email);

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    // 2. Format phone if provided
    let formattedPhone: string | undefined = undefined;
    if (phone) {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) formattedPhone = `+91${cleaned}`;
      else if (cleaned.startsWith('91') && cleaned.length === 12) formattedPhone = `+${cleaned}`;
      else if (cleaned.length > 5) formattedPhone = `+91${cleaned.slice(-10)}`;
    }

    // 3. Create confirmed user directly via Supabase Admin (bypasses email confirmation SMTP issues)
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: fullName || email.split('@')[0],
        phone: formattedPhone,
        role: 'customer',
      },
      app_metadata: {
        role: 'customer',
      },
    });

    if (createErr) {
      console.error('Error creating user via admin:', createErr);
      return NextResponse.json(
        { error: createErr.message || 'Failed to create user account' },
        { status: 500 }
      );
    }

    const userId = newUser.user.id;

    // 4. Ensure profile row exists in public.profiles
    await (supabaseAdmin as any).from('profiles').upsert({
      id: userId,
      email,
      name: fullName || email.split('@')[0],
      phone: formattedPhone || null,
      role: 'customer',
      updated_at: new Date().toISOString(),
    });

    // 5. Ensure customer CRM row exists
    try {
      await (supabaseAdmin as any).from('customers_crm').upsert({
        phone: formattedPhone || null,
        email,
        name: fullName || email.split('@')[0],
        total_orders: 0,
        total_spent: 0,
        status: 'active',
        tier: 'bronze',
        updated_at: new Date().toISOString(),
      });
    } catch (crmErr) {
      console.warn('CRM upsert notice:', crmErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: userId,
        email,
        name: fullName,
      },
    });
  } catch (err: any) {
    console.error('Sign up route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
