import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from './db/pool';
import { whatsappService } from './services/whatsapp';
import { queueWorker } from './services/queue';

export const router = Router();

// 1. GET /health (unauthenticated health check for Docker/VPS monitoring)
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// 2. GET /status (Bridge & WhatsApp Connection status)
router.get('/status', async (req: Request, res: Response) => {
  try {
    const sessionRes = await query('SELECT * FROM public.wa_sessions LIMIT 1');
    const settingsRes = await query('SELECT * FROM public.wa_settings LIMIT 1');
    const queueStatsRes = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'queued') as queued_count,
        COUNT(*) FILTER (WHERE status = 'sent' AND sent_at >= CURRENT_DATE) as sent_today
      FROM public.wa_messages
    `);

    const session = sessionRes.rows[0] || {};
    const settings = settingsRes.rows[0] || {};
    const stats = queueStatsRes.rows[0] || {};

    res.json({
      status: session.status || 'disconnected',
      connected_phone: session.connected_phone || null,
      last_seen: session.last_seen || null,
      queue: {
        paused: settings.queue_paused || false,
        failure_streak: settings.failure_streak || 0,
        queued_count: parseInt(stats.queued_count || '0', 10),
        sent_today: parseInt(stats.sent_today || '0', 10),
        daily_cap: settings.daily_cap || 500,
        hourly_cap: settings.hourly_cap || 60,
      },
      uptime: process.uptime(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch status' });
  }
});

// 3. GET /qr (Current QR code data URL for pairing)
router.get('/qr', async (req: Request, res: Response) => {
  try {
    const resDb = await query('SELECT status, qr FROM public.wa_sessions LIMIT 1');
    const row = resDb.rows[0];

    if (!row || !row.qr) {
      return res.json({
        status: row?.status || 'disconnected',
        qr: null,
        message: 'No QR code available at this moment',
      });
    }

    res.json({
      status: row.status,
      qr: row.qr,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch QR' });
  }
});

// 3.1. POST /pair-code (Request 8-digit Pairing Code for phone linking)
router.post('/pair-code', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    const code = await whatsappService.requestPairingCode(phone);
    res.json({ success: true, code });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to request pairing code' });
  }
});

// 4. POST /send-otp (Called by send-sms-hook Edge Function)
const sendOtpSchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
  otp: z.string().min(4, 'OTP must be at least 4 digits'),
});

router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const parsed = sendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    const { phone, otp } = parsed.data;
    const body = `Your TOLAND verification code is *${otp}*.\nValid for 5 minutes. Do not share this code with anyone.`;

    // Insert with Priority 1 (OTP - Highest Priority)
    const insertRes = await query(
      `INSERT INTO public.wa_messages (direction, phone, body, priority, template_key, status, created_at)
       VALUES ('outbound', $1, $2, 1, 'otp_verification', 'queued', NOW())
       RETURNING id`,
      [phone, body]
    );

    const messageId = insertRes.rows[0]?.id;
    console.log(`[Bridge API] Queued OTP verification for ${phone} (Message ID: ${messageId})`);

    // Trigger immediate queue worker processing
    queueWorker.triggerImmediate();

    res.json({
      success: true,
      message_id: messageId,
      message: `OTP queued with priority 1 for ${phone}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to queue OTP' });
  }
});

// 5. POST /send (Queue generic or transactional message)
const sendMessageSchema = z.object({
  phone: z.string().min(10),
  body: z.string().min(1),
  template_key: z.string().optional(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  scheduled_at: z.string().datetime().optional(),
});

router.post('/send', async (req: Request, res: Response) => {
  try {
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    const { phone, body, template_key, priority, scheduled_at } = parsed.data;

    const scheduledDate = scheduled_at ? new Date(scheduled_at) : new Date();

    const insertRes = await query(
      `INSERT INTO public.wa_messages (direction, phone, body, priority, template_key, scheduled_at, status, created_at)
       VALUES ('outbound', $1, $2, $3, $4, $5, 'queued', NOW())
       RETURNING id`,
      [phone, body, priority, template_key || null, scheduledDate]
    );

    const messageId = insertRes.rows[0]?.id;
    queueWorker.triggerImmediate();

    res.json({
      success: true,
      message_id: messageId,
      message: `Message queued for ${phone}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to queue message' });
  }
});

// 6. POST /logout (Disconnect session and clear credentials)
router.post('/logout', async (req: Request, res: Response) => {
  try {
    await whatsappService.logout();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to logout' });
  }
});

// 7. POST /pause (Manually pause message queue)
router.post('/pause', async (req: Request, res: Response) => {
  try {
    await query('UPDATE public.wa_settings SET queue_paused = true');
    console.log('[Bridge API] WhatsApp queue paused manually.');
    res.json({ success: true, message: 'WhatsApp message queue paused' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to pause queue' });
  }
});

// 8. POST /resume (Resume message queue and reset failure streak)
router.post('/resume', async (req: Request, res: Response) => {
  try {
    await query('UPDATE public.wa_settings SET queue_paused = false, failure_streak = 0');
    console.log('[Bridge API] WhatsApp queue resumed.');
    queueWorker.triggerImmediate();
    res.json({ success: true, message: 'WhatsApp message queue resumed' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to resume queue' });
  }
});
