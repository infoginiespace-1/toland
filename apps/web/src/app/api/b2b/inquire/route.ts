import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const b2bInquirySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid 10-digit WhatsApp phone required'),
  businessName: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  estimatedQty: z.string().min(1, 'Estimated quantity is required'),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = b2bInquirySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid inquiry data', details: parsed.error.format() }, { status: 400 });
    }

    const { name, phone, businessName, city, state, estimatedQty, notes } = parsed.data;

    const supabase = createAdminClient();

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12
      ? cleanPhone
      : `91${cleanPhone.slice(-10)}`;

    const fullNotes = `Business: ${businessName || 'Independent Retailer'}\nLocation: ${city}, ${state}\nEstimated Quantity: ${estimatedQty}\nNotes: ${notes || 'None'}`;

    // Insert into public.leads table
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        name,
        phone: formattedPhone,
        source: 'b2b_form',
        stage: 'new',
        value: 50000.00, // Estimated initial wholesale ticket
        next_followup_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      } as any)
      .select('id')
      .single();

    if (leadError) {
      console.error('[B2B API Error]:', leadError);
      return NextResponse.json({ error: 'Failed to record wholesale inquiry' }, { status: 500 });
    }

    // Insert activity note
    await supabase.from('activities').insert({
      lead_id: (lead as any)?.id,
      activity_type: 'inquiry',
      description: fullNotes,
    } as any);

    // Queue WhatsApp acknowledgement to buyer
    await supabase.from('wa_messages').insert({
      direction: 'outbound',
      phone: formattedPhone,
      body: `Namaste ${name}!\n\nThank you for reaching out to TOLAND Private Limited (Sheikhpura, Bihar).\n\nWe have received your wholesale / B2B inquiry for ${estimatedQty} pieces. Our sales and manufacturing team will connect with you on WhatsApp shortly with our trade catalog and bulk rate sheet.`,
      priority: 2,
      status: 'queued',
    } as any);

    return NextResponse.json({ success: true, message: 'Inquiry submitted successfully' });
  } catch (err: any) {
    console.error('[B2B Unhandled Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
