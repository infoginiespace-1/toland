import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  proto,
  WASocket,
  Browsers,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import { query } from '../db/pool';
import { usePostgresAuthState } from '../db/auth-state';
import { config } from '../config';
import { WhatsAppProvider, SendResult } from '../providers/types';

const logger = pino({ level: 'info' });

export class BaileysWhatsAppService implements WhatsAppProvider {
  public name = 'baileys';
  private sock: WASocket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private clearCredsFn: (() => Promise<void>) | null = null;
  private messageStore = new Map<string, proto.IMessage>();

  constructor() {}

  public isConnected(): boolean {
    return this.sock !== null && !this.isConnecting;
  }

  // Format phone to WhatsApp JID: 919876543210 -> 919876543210@s.whatsapp.net
  public formatJid(phone: string): string {
    const clean = phone.replace(/[^0-9]/g, '');
    return clean.includes('@s.whatsapp.net') ? clean : `${clean}@s.whatsapp.net`;
  }

  // Request 8-digit Pairing Code alternative to QR
  public async requestPairingCode(phone: string): Promise<string> {
    if (!this.sock) {
      console.log('[Baileys] Socket was null on requestPairingCode. Initializing fresh socket...');
      this.isConnecting = false;
      await this.start();
      // Wait up to 10 seconds for this.sock to be instantiated
      for (let i = 0; i < 20; i++) {
        if (this.sock) break;
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    if (!this.sock) {
      throw new Error('WhatsApp service is starting up. Please click again in a few seconds.');
    }
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.length === 10) {
      clean = `91${clean}`;
    }
    const code = await this.sock.requestPairingCode(clean);
    return code;
  }

  private cleanupSocket(): void {
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners('connection.update');
        this.sock.ev.removeAllListeners('creds.update');
        this.sock.ev.removeAllListeners('messages.upsert');
        this.sock.end(undefined);
      } catch (err) {
        console.error('[Baileys] Error ending socket:', err);
      }
      this.sock = null;
    }
  }

  // Force manual reconnect & fresh QR generation
  public async reconnect(): Promise<void> {
    console.log('[Baileys] Manual reconnect triggered');
    this.cleanupSocket();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    if (this.clearCredsFn) {
      try {
        await this.clearCredsFn();
      } catch (e) {
        console.error('[Baileys] Error clearing creds on reconnect:', e);
      }
    }
    await this.updateSession({ status: 'connecting', qr: null, connected_phone: null });
    await this.start();
  }

  // Update session record in Postgres for admin panel Realtime visibility
  private async updateSession(data: {
    status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready';
    qr?: string | null;
    connected_phone?: string | null;
  }): Promise<void> {
    try {
      await query(
        `INSERT INTO public.wa_sessions (id, status, qr, connected_phone, last_seen, updated_at)
         VALUES (
           '00000000-0000-0000-0000-000000000001',
           $1,
           $2,
           $3,
           NOW(),
           NOW()
         )
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           qr = EXCLUDED.qr,
           connected_phone = COALESCE(EXCLUDED.connected_phone, public.wa_sessions.connected_phone),
           last_seen = NOW(),
           updated_at = NOW()`,
        [data.status, data.qr ?? null, data.connected_phone ?? null]
      );
    } catch (err) {
      console.error('[WhatsAppService] Error updating wa_sessions in DB:', err);
    }
  }

  // Initialize and start Baileys connection
  public async start(): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;

    // Ensure any previously lingering socket or event listeners are destroyed before making a new socket
    this.cleanupSocket();

    try {
      await this.updateSession({ status: 'connecting' });
      const { state, saveCreds, clearCreds } = await usePostgresAuthState(config.WHATSAPP_SESSION_ID);
      this.clearCredsFn = clearCreds;

      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`[Baileys] Using WhatsApp Web version v${version.join('.')}, isLatest: ${isLatest}`);

      this.sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        defaultQueryTimeoutMs: 60000,
        markOnlineOnConnect: true,
        // Crucial: getMessage enables Baileys to re-encrypt and answer retry requests,
        // permanently solving "Waiting for this message. This may take a while."
        getMessage: async (key: proto.IMessageKey): Promise<proto.IMessage | undefined> => {
          if (key.id && this.messageStore.has(key.id)) {
            return this.messageStore.get(key.id);
          }
          if (key.id) {
            try {
              const res = await query(
                `SELECT body FROM public.wa_messages 
                 WHERE metadata->>'provider_message_id' = $1 OR id::text = $1 
                 LIMIT 1`,
                [key.id]
              );
              if (res.rows[0]?.body) {
                return { conversation: res.rows[0].body };
              }
            } catch (err) {
              console.error('[Baileys] Error looking up retry message from DB:', err);
            }
          }
          return undefined;
        },
      });

      // Handle credentials update (token rotation, new keys)
      this.sock.ev.on('creds.update', saveCreds);

      // Handle connection updates
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('[Baileys] New QR generated, converting to data URL...');
          try {
            const qrDataUrl = await QRCode.toDataURL(qr);
            await this.updateSession({ status: 'qr_ready', qr: qrDataUrl });
          } catch (e) {
            console.error('[Baileys] Error converting QR to data URL:', e);
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          console.warn(`[Baileys] Connection closed. StatusCode: ${statusCode}`);

          this.cleanupSocket();
          this.isConnecting = false;

          if (statusCode === DisconnectReason.loggedOut) {
            console.warn('[Baileys] Device logged out or QR session timed out (401). Clearing credentials & restarting fresh session in 3s...');
            if (this.clearCredsFn) {
              try {
                await this.clearCredsFn();
              } catch (e) {
                console.error('[Baileys] Error clearing creds:', e);
              }
            }
            await this.updateSession({ status: 'connecting', qr: null, connected_phone: null });
            this.reconnectAttempts = 0;
            setTimeout(() => this.start(), 3000);
          } else if (statusCode === DisconnectReason.restartRequired || statusCode === 515) {
            console.log('[Baileys] Restart required (515) after pairing sync. Restarting immediately...');
            this.reconnectAttempts = 0;
            setTimeout(() => this.start(), 1000);
          } else if (statusCode === DisconnectReason.connectionReplaced || statusCode === 440) {
            console.warn('[Baileys] Connection replaced (440). Waiting 15s to let dominant session settle...');
            this.reconnectAttempts = 0;
            setTimeout(() => {
              if (!this.sock && !this.isConnecting) {
                this.start();
              }
            }, 15000);
          } else {
            this.reconnectAttempts++;
            const delayMs = Math.min(3000 * Math.pow(1.5, this.reconnectAttempts), 30000);
            console.log(`[Baileys] Reconnecting in ${delayMs / 1000}s (attempt ${this.reconnectAttempts})...`);
            await this.updateSession({ status: 'connecting', qr: null });
            setTimeout(() => this.start(), delayMs);
          }
        } else if (connection === 'open') {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          const phoneJid =
            this.sock?.user?.id ||
            (this.sock?.authState?.creds?.me as any)?.id ||
            '';
          const phone = phoneJid.split(':')[0].replace(/[^0-9]/g, '');
          console.log(`[Baileys] Successfully connected! Account phone: ${phone}`);
          await this.updateSession({
            status: 'connected',
            qr: null,
            connected_phone: phone || null,
          });
        }
      });

      // Handle inbound messages
      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const msg of messages) {
          if (!msg.message || msg.key.fromMe) continue;

          const remoteJid = msg.key.remoteJid || '';
          if (remoteJid.includes('@g.us') || remoteJid.includes('broadcast')) continue;

          const senderPhone = remoteJid.replace('@s.whatsapp.net', '');
          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            '';

          if (!text) continue;
          console.log(`[Baileys] Inbound message from ${senderPhone}: "${text}"`);

          // 1. Record inbound message in database
          try {
            await query(
              `INSERT INTO public.wa_messages (direction, phone, body, status, created_at)
               VALUES ('inbound', $1, $2, 'delivered', NOW())`,
              [senderPhone, text]
            );
          } catch (e) {
            console.error('[Baileys] Error saving inbound message:', e);
          }

          // 2. Anti-Ban Opt-out & Opt-in commands
          const cleanText = text.trim().toUpperCase();
          if (cleanText === 'STOP' || cleanText === 'UNSUBSCRIBE' || cleanText === 'बंद') {
            await query(
              `INSERT INTO public.wa_optouts (phone, reason, created_at)
               VALUES ($1, 'user_reply_stop', NOW())
               ON CONFLICT (phone) DO NOTHING`,
              [senderPhone]
            );
            await this.sendMessage(
              senderPhone,
              'You have successfully unsubscribed from TOLAND promotional updates. Reply START or शुरू to opt in again.'
            );
            continue;
          }

          if (cleanText === 'START' || cleanText === 'शुरू') {
            await query('DELETE FROM public.wa_optouts WHERE phone = $1', [senderPhone]);
            await this.sendMessage(
              senderPhone,
              'Welcome back! You have resubscribed to TOLAND updates and offers.'
            );
            continue;
          }

          // 3. Auto-reply rules evaluation
          await this.processAutoReply(senderPhone, text);
        }
      });
    } catch (err) {
      console.error('[Baileys] Failed to initialize socket:', err);
      this.isConnecting = false;
      await this.updateSession({ status: 'disconnected' });
      setTimeout(() => this.start(), 10000);
    }
  }

  // Auto-reply processor matching keywords against wa_autoreply_rules
  private async processAutoReply(phone: string, text: string): Promise<void> {
    try {
      const settingsRes = await query('SELECT autoreply_enabled FROM public.wa_settings LIMIT 1');
      const isEnabled = settingsRes.rows[0]?.autoreply_enabled ?? true;
      if (!isEnabled) return;

      const rulesRes = await query(
        `SELECT r.keyword, r.match_type, t.body
         FROM public.wa_autoreply_rules r
         LEFT JOIN public.wa_templates t ON r.reply_template_key = t.key
         WHERE r.is_active = true`
      );

      const normalizedText = text.toLowerCase().trim();

      for (const rule of rulesRes.rows) {
        const keyword = (rule.keyword || '').toLowerCase().trim();
        const matches =
          rule.match_type === 'exact'
            ? normalizedText === keyword
            : normalizedText.includes(keyword);

        if (matches && rule.body) {
          console.log(`[Baileys] Auto-reply triggered for keyword "${rule.keyword}" to ${phone}`);
          // Queue auto-reply message with priority 2
          await query(
            `INSERT INTO public.wa_messages (direction, phone, body, priority, status, created_at)
             VALUES ('outbound', $1, $2, 2, 'queued', NOW())`,
            [phone, rule.body]
          );
          break;
        }
      }
    } catch (err) {
      console.error('[Baileys] Error processing auto-reply:', err);
    }
  }

  // Send message implementation
  public async sendMessage(phone: string, text: string): Promise<SendResult> {
    if (!this.sock) {
      return { success: false, error: 'WhatsApp service not connected' };
    }

    try {
      const jid = this.formatJid(phone);
      const res = await this.sock.sendMessage(jid, { text });

      if (res?.key?.id) {
        this.messageStore.set(res.key.id, { conversation: text });
        if (this.messageStore.size > 500) {
          const firstKey = this.messageStore.keys().next().value;
          if (firstKey) this.messageStore.delete(firstKey);
        }
      }

      return {
        success: true,
        messageId: res?.key?.id ?? undefined,
      };
    } catch (err: any) {
      console.error(`[Baileys] Error sending message to ${phone}:`, err);
      return {
        success: false,
        error: err?.message || 'Unknown send error',
      };
    }
  }

  // Send typing/presence indicator
  public async sendPresence(
    phone: string,
    presence: 'composing' | 'paused' | 'available' | 'unavailable'
  ): Promise<void> {
    if (!this.sock) return;
    try {
      const jid = this.formatJid(phone);
      await this.sock.sendPresenceUpdate(presence, jid);
    } catch (err) {
      // Ignore presence update errors silently
    }
  }

  // Logout device
  public async logout(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout();
        this.sock = null;
      }
      if (this.clearCredsFn) {
        await this.clearCredsFn();
      }
      await this.updateSession({ status: 'disconnected', qr: null, connected_phone: null });
      console.log('[Baileys] Device successfully logged out');
    } catch (err) {
      console.error('[Baileys] Error logging out:', err);
    }
  }
}

export const whatsappService = new BaileysWhatsAppService();
