import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || (user.app_metadata?.role !== 'admin' && user.app_metadata?.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    let query = supabase
      .from('wa_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
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

    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, message, template_key } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: 'Recipient phone number and message body are required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Insert into wa_messages queue
    const { data: queuedMsg, error } = await (supabase.from('wa_messages') as any)
      .insert({
        direction: 'outbound',
        phone: cleanPhone,
        body: message,
        template_key: template_key || null,
        status: 'queued',
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: queuedMsg });
  } catch (err: any) {
    console.error('[Admin WhatsApp Messages POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
