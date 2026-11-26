// Supabase Auth Send SMS Hook for TOLAND
// Routes phone authentication OTP to WhatsApp Baileys Bridge
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface SendSmsPayload {
  user: {
    id: string;
    phone: string;
  };
  sms: {
    otp: string;
  };
}

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload: SendSmsPayload = await req.json();
    const phone = payload.user?.phone;
    const otp = payload.sms?.otp;

    if (!phone || !otp) {
      return new Response(JSON.stringify({ error: 'phone and otp are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bridgeUrl = Deno.env.get('WHATSAPP_BRIDGE_URL') || 'http://localhost:8080';
    const bridgeSecret = Deno.env.get('WHATSAPP_BRIDGE_SECRET') || 'toland_bridge_secret_dev';

    console.log(`[send-sms-hook] Forwarding OTP for ${phone} to WhatsApp bridge at ${bridgeUrl}`);

    const bridgeResponse = await fetch(`${bridgeUrl}/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bridge-secret': bridgeSecret,
      },
      body: JSON.stringify({
        phone,
        otp,
      }),
    });

    if (!bridgeResponse.ok) {
      const errText = await bridgeResponse.text();
      console.error(`[send-sms-hook] Bridge error (${bridgeResponse.status}):`, errText);
      // Even if bridge is momentarily queueing, return success so Supabase OTP record is generated
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[send-sms-hook] Unhandled exception:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
