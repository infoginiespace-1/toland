// User Roles
export type UserRole = 'customer' | 'staff' | 'admin';

// WhatsApp Message & Session Statuses
export type WhatsAppSessionStatus = 'disconnected' | 'connecting' | 'connected' | 'qr_ready';
export type WhatsAppMessageDirection = 'inbound' | 'outbound';
export type WhatsAppMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type WhatsAppTemplateCategory = 'otp' | 'transactional' | 'promo';

// Order & Payment Statuses
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentMethod = 'razorpay' | 'cod';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// ERP Production Stages & Types
export type RawMaterialType = 'fabric' | 'thread' | 'button' | 'zip' | 'label' | 'packaging';
export type ProductionStageName = 'cutting' | 'stitching' | 'washing' | 'finishing' | 'packing';
export type ProductionOrderStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type StockLedgerItemType = 'raw_material' | 'finished_variant';

// CRM Lead Stages
export type LeadStage = 'new' | 'contacted' | 'sample_sent' | 'negotiation' | 'converted' | 'lost';

export * from './database';

