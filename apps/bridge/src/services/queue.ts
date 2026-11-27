import { query } from '../db/pool';
import { whatsappService } from './whatsapp';
import { cloudApiProvider } from '../providers/cloud-api';
import { WhatsAppProvider } from '../providers/types';

// Helper to resolve Spintax: "{Hello|Hi|Namaste} {Customer|Friend}" -> "Namaste Friend"
export function resolveSpintax(text: string): string {
  const spintaxRegex = /\{([^{}]+)\}/g;
  return text.replace(spintaxRegex, (_, choices) => {
    const options = choices.split('|');
    const picked = options[Math.floor(Math.random() * options.length)];
    return picked.trim();
  });
}

// Sleep helper
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class WhatsAppQueueWorker {
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;

  constructor() {}

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[QueueWorker] WhatsApp queue worker started.');
    this.scheduleNextTick(1000);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log('[QueueWorker] WhatsApp queue worker stopped.');
  }

  // Trigger immediate tick (e.g. after urgent OTP arrives)
  public triggerImmediate(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    setImmediate(() => this.tick());
  }

  private scheduleNextTick(delayMs: number): void {
    if (!this.isRunning) return;
    this.timer = setTimeout(() => this.tick(), delayMs);
  }

  private async tick(): Promise<void> {
    try {
      await this.processNextMessage();
    } catch (err) {
      console.error('[QueueWorker] Error in queue processing tick:', err);
    } finally {
      this.scheduleNextTick(2000);
    }
  }

  // Check if current local time is within quiet hours (e.g., 22:00 to 08:00)
  private isQuietHours(startStr: string, endStr: string): boolean {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentVal = currentHours * 60 + currentMinutes;

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    const startVal = startH * 60 + (startM || 0);
    const endVal = endH * 60 + (endM || 0);

    if (startVal > endVal) {
      // Overnight (e.g. 22:00 to 08:00)
      return currentVal >= startVal || currentVal < endVal;
    }
    return currentVal >= startVal && currentVal < endVal;
  }

  // Calculate allowed volume for warmup day
  private getWarmupDailyLimit(day: number): number {
    switch (day) {
      case 1:
        return 50;
      case 2:
        return 100;
      case 3:
        return 200;
      case 4:
        return 350;
      default:
        return 500;
    }
  }

  private async processNextMessage(): Promise<void> {
    // 1. Fetch current settings
    const settingsRes = await query('SELECT * FROM public.wa_settings LIMIT 1');
    if (settingsRes.rows.length === 0) return;
    const settings = settingsRes.rows[0];

    // Check if queue is paused
    if (settings.queue_paused) {
      return;
    }

    // Determine provider to use (Baileys or Cloud API fallback)
    let provider: WhatsAppProvider = whatsappService;
    if (!whatsappService.isConnected()) {
      if (settings.fallback_to_cloud_api && cloudApiProvider.isConnected()) {
        provider = cloudApiProvider;
      } else {
        // No connected provider available
        return;
      }
    }

    // 2. Volume & Cap Checks
    const statsRes = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '1 hour') as sent_last_hour,
        COUNT(*) FILTER (WHERE sent_at >= CURRENT_DATE) as sent_today
      FROM public.wa_messages
      WHERE status = 'sent' AND direction = 'outbound'
    `);
    const sentLastHour = parseInt(statsRes.rows[0]?.sent_last_hour || '0', 10);
    const sentToday = parseInt(statsRes.rows[0]?.sent_today || '0', 10);

    const isHourlyCapped = sentLastHour >= settings.hourly_cap;
    const dailyLimit = settings.warmup_enabled
      ? Math.min(settings.daily_cap, this.getWarmupDailyLimit(settings.warmup_day))
      : settings.daily_cap;
    const isDailyCapped = sentToday >= dailyLimit;

    // Check quiet hours
    const inQuietHours = this.isQuietHours(
      settings.quiet_hours_start || '22:00:00',
      settings.quiet_hours_end || '08:00:00'
    );

    // 3. Select next queued message
    // Priority 1: OTP, Priority 2: Order/Transactional, Priority 3: Promotional
    // If capped or quiet hours, only allow priority 1 & 2
    let priorityFilter = '';
    if (isDailyCapped || isHourlyCapped) {
      // When caps reached, allow ONLY Priority 1 (OTP)
      priorityFilter = 'AND priority = 1';
    } else if (inQuietHours) {
      // During quiet hours, allow Priority 1 (OTP) and Priority 2 (Order updates), suppress Priority 3 (Promotions)
      priorityFilter = 'AND priority <= 2';
    }

    const selectQuery = `
      SELECT id, phone, body, priority, attempts, max_attempts
      FROM public.wa_messages
      WHERE status = 'queued'
        AND scheduled_at <= NOW()
        ${priorityFilter}
      ORDER BY priority ASC, scheduled_at ASC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    const msgRes = await query(selectQuery);
    if (msgRes.rows.length === 0) return;

    const message = msgRes.rows[0];

    // 4. Opt-Out Check (Rule 7)
    const optoutRes = await query(
      'SELECT id FROM public.wa_optouts WHERE phone = $1 LIMIT 1',
      [message.phone]
    );
    if (optoutRes.rows.length > 0 && message.priority === 3) {
      // Recipient opted out of marketing
      await query(
        `UPDATE public.wa_messages
         SET status = 'failed', error = 'Recipient has opted out of WhatsApp promotions'
         WHERE id = $1`,
        [message.id]
      );
      console.log(`[QueueWorker] Suppressed promotional message to opted-out phone: ${message.phone}`);
      return;
    }

    // 5. Anti-Ban Human Simulation: Typing Indicator & Random Delay (Rule 4)
    if (provider.sendPresence) {
      await provider.sendPresence(message.phone, 'composing');
    }

    const minDelay = settings.min_delay_s || 4;
    const maxDelay = settings.max_delay_s || 12;
    // OTPs get faster delivery (1-2s), normal messages get full random human jitter (4-12s)
    const delaySec = message.priority === 1
      ? 1 + Math.random() * 1.5
      : minDelay + Math.random() * (maxDelay - minDelay);

    await sleep(Math.floor(delaySec * 1000));

    // 6. Template Variation & Spintax (Rule 8)
    const finalBody = resolveSpintax(message.body);

    // 7. Dispatch Message
    const sendResult = await provider.sendMessage(message.phone, finalBody);

    if (sendResult.success) {
      // Mark as sent and persist provider message ID & raw proto for retry decryption
      const rawMsgJson = JSON.stringify(sendResult.rawMessage || {});
      await query(
        `UPDATE public.wa_messages
         SET status = 'sent', 
             sent_at = NOW(), 
             error = NULL,
             metadata = jsonb_set(
               jsonb_set(COALESCE(metadata, '{}'::jsonb), '{provider_message_id}', to_jsonb($2::text)),
               '{raw_message}', 
               $3::jsonb
             )
         WHERE id = $1`,
        [message.id, sendResult.messageId || '', rawMsgJson]
      );

      // Reset failure streak
      await query('UPDATE public.wa_settings SET failure_streak = 0');
      console.log(`[QueueWorker] Sent message ${message.id} to ${message.phone} (Priority: ${message.priority})`);
    } else {
      const nextAttempts = (message.attempts || 0) + 1;
      const isFailed = nextAttempts >= (message.max_attempts || 3);
      const newStatus = isFailed ? 'failed' : 'queued';

      await query(
        `UPDATE public.wa_messages
         SET status = $1,
             attempts = $2,
             error = $3,
             scheduled_at = NOW() + INTERVAL '1 minute'
         WHERE id = $4`,
        [newStatus, nextAttempts, sendResult.error || 'Failed to send', message.id]
      );

      // Rule 10: Auto-pause queue if delivery failure spike reaches threshold
      const updateSettings = await query(`
        UPDATE public.wa_settings
        SET failure_streak = failure_streak + 1,
            queue_paused = CASE WHEN (failure_streak + 1) >= failure_threshold THEN true ELSE queue_paused END
        RETURNING failure_streak, failure_threshold, queue_paused
      `);

      const updated = updateSettings.rows[0];
      if (updated?.queue_paused) {
        console.error(
          `[QueueWorker] ⚠️ CRITICAL: WhatsApp queue AUTO-PAUSED! Failure streak reached ${updated.failure_streak}/${updated.failure_threshold}.`
        );
      }
    }
  }
}

export const queueWorker = new WhatsAppQueueWorker();
