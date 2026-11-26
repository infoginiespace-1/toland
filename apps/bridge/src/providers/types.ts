export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppProvider {
  name: string;
  sendMessage(phone: string, text: string): Promise<SendResult>;
  sendPresence?(phone: string, presence: 'composing' | 'paused' | 'available' | 'unavailable'): Promise<void>;
  isConnected(): boolean;
}
