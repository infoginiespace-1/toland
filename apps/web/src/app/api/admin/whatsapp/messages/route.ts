import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminOrStaff, isStrictAdmin, triggerBridgeEndpoint } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!isAdminOrStaff(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminDb = createAdminClient();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    let query = adminDb
      .from('wa_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(150);

    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      query = query.like('phone', `%${cleanPhone}%`);
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, messages: messages || [] });
  } catch (err: any) {
    console.error('[Admin WhatsApp Messages GET Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!isStrictAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, message, template_key, priority = 2 } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: 'Recipient phone number and message body are required' }, { status: 400 });
    }

    const digits = String(phone).replace(/\D/g, '');
    if (digits.length < 10) {
      return NextResponse.json({ error: 'Enter a valid 10-digit WhatsApp number' }, { status: 400 });
    }
    const normalizedPhone = digits.length === 10 ? `91${digits}` : digits;

    const adminDb = createAdminClient();
    const { data: queuedMsg, error } = await (adminDb.from('wa_messages') as any)
      .insert({
        direction: 'outbound',
        phone: normalizedPhone,
        body: message,
        priority: Number(priority) || 2,
        template_key: template_key || null,
        status: 'queued',
      })
      .select('*')
      .single();

    if (error) throw error;

    // Wake bridge worker immediately so admin reply delivers quickly
    await triggerBridgeEndpoint('/trigger-queue');

    return NextResponse.json({ success: true, message: queuedMsg });
  } catch (err: any) {
    console.error('[Admin WhatsApp Messages POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
