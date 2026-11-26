import { WhatsAppProvider, SendResult } from './types';
import { config } from '../config';

export class WhatsAppCloudApiProvider implements WhatsAppProvider {
  public name = 'cloud_api';

  constructor(
    private token?: string,
    private phoneNumberId?: string
  ) {
    this.token = token || config.WHATSAPP_CLOUD_API_TOKEN;
    this.phoneNumberId = phoneNumberId || config.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID;
  }

  public isConnected(): boolean {
    return Boolean(this.token && this.phoneNumberId);
  }

  public async sendMessage(phone: string, text: string): Promise<SendResult> {
    if (!this.isConnected()) {
      return { success: false, error: 'WhatsApp Cloud API credentials not configured' };
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body: text },
        }),
      });

      const data = (await response.json()) as any;
      if (!response.ok) {
        return {
          success: false,
          error: data?.error?.message || `Cloud API error status: ${response.status}`,
        };
      }

      return {
        success: true,
        messageId: data?.messages?.[0]?.id,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to dispatch to WhatsApp Cloud API',
      };
    }
  }
}

export const cloudApiProvider = new WhatsAppCloudApiProvider();
