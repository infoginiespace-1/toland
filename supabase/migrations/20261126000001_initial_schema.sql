-- ==============================================================================
-- TOLAND DATABASE SCHEMA — Migration 1: Core Tables
-- ==============================================================================

-- Enable essential extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. IDENTITY & ROLES
-- ------------------------------------------------------------------------------

create table if not exists public.admin_allowlist (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  role text not null check (role in ('admin', 'staff')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text not null unique,
  name text,
  email text,
  role text not null default 'customer' check (role in ('customer', 'staff', 'admin')),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 2. CATALOG
-- ------------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  image_path text,
  sort int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  base_price numeric(10, 2) not null check (base_price >= 0),
  mrp numeric(10, 2) not null check (mrp >= base_price),
  gst_percent numeric(5, 2) not null default 12.00,
  hsn_code text default '620342', -- Men's Cotton Denim Trousers / Jeans
  is_active boolean not null default true,
  is_featured boolean not null default false,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size text not null, -- e.g. 28, 30, 32, 34, 36, 38
  fit text,          -- e.g. Slim, Regular, Relaxed, Carrot
  color text,        -- e.g. Indigo, Light Blue, Deep Black
  wash text,         -- e.g. Stone Wash, Acid Wash, Raw/Rinse
  price numeric(10, 2) not null check (price >= 0),
  stock_qty int not null default 0 check (stock_qty >= 0),
  barcode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  path text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_path text not null,
  link text,
  sort int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 3. CARTS & ORDERS
-- ------------------------------------------------------------------------------

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  qty int not null default 1 check (qty > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percentage', 'fixed')),
  value numeric(10, 2) not null check (value > 0),
  min_amount numeric(10, 2) not null default 0,
  usage_limit int,
  used_count int not null default 0,
  valid_from timestamptz,
  valid_to timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned')),
  payment_method text not null check (payment_method in ('razorpay', 'cod')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'completed', 'failed', 'refunded')),
  subtotal numeric(10, 2) not null,
  discount numeric(10, 2) not null default 0.00,
  shipping numeric(10, 2) not null default 0.00,
  tax numeric(10, 2) not null default 0.00,
  total numeric(10, 2) not null,
  address_snapshot jsonb not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  qty int not null check (qty > 0),
  price numeric(10, 2) not null,
  tax numeric(10, 2) not null default 0.00,
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'razorpay',
  provider_ref text, -- Razorpay Payment ID or Order ID
  amount numeric(10, 2) not null,
  status text not null default 'pending',
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade unique,
  invoice_no text not null unique,
  gst_details jsonb not null,
  pdf_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  courier text not null,
  awb text not null,
  status text not null default 'manifested',
  tracking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 4. ERP (MANUFACTURING)
-- ------------------------------------------------------------------------------

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  gst_number text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.raw_materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('fabric', 'thread', 'button', 'zip', 'label', 'packaging')),
  unit text not null, -- meters, pieces, cones, kg
  stock_qty numeric(12, 3) not null default 0.000,
  reorder_level numeric(12, 3) not null default 10.000,
  unit_price numeric(10, 2) not null default 0.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_no text not null unique,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'ordered', 'received', 'cancelled')),
  total_amount numeric(12, 2) not null default 0.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  raw_material_id uuid not null references public.raw_materials(id) on delete cascade,
  qty numeric(12, 3) not null check (qty > 0),
  unit_price numeric(10, 2) not null,
  total numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.boms (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  raw_material_id uuid not null references public.raw_materials(id) on delete cascade,
  qty_per_piece numeric(10, 4) not null check (qty_per_piece > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, raw_material_id)
);

create table if not exists public.production_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  planned_qty int not null check (planned_qty > 0),
  completed_qty int not null default 0,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_stages (
  id uuid primary key default gen_random_uuid(),
  production_order_id uuid not null references public.production_orders(id) on delete cascade,
  stage text not null check (stage in ('cutting', 'stitching', 'washing', 'finishing', 'packing')),
  qty_in int not null default 0,
  qty_out int not null default 0,
  wastage int not null default 0,
  assigned_to text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_ledger (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('raw_material', 'finished_variant')),
  item_id uuid not null,
  change numeric(12, 3) not null,
  reason text not null, -- purchase, production_in, production_out, sale, adjustment, wastage
  ref_id uuid,          -- foreign key to po_id, production_order_id, order_id, etc.
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_price_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  min_qty int not null check (min_qty > 1),
  price numeric(10, 2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, min_qty)
);

-- ------------------------------------------------------------------------------
-- 5. CRM
-- ------------------------------------------------------------------------------

create table if not exists public.customers_crm (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  phone text not null unique,
  name text,
  source text not null default 'storefront',
  tags text[] not null default '{}',
  stage text not null default 'lead' check (stage in ('lead', 'prospect', 'active_buyer', 'dormant', 'vip')),
  assigned_to uuid references public.profiles(id) on delete set null,
  notes text,
  opt_in_whatsapp boolean not null default true,
  opted_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  source text not null default 'website_b2b',
  stage text not null default 'new' check (stage in ('new', 'contacted', 'sample_sent', 'negotiation', 'converted', 'lost')),
  value numeric(12, 2) not null default 0.00,
  next_followup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  customer_id uuid references public.customers_crm(id) on delete cascade,
  due_at timestamptz not null,
  note text not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers_crm(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  activity_type text not null, -- call, message, order, note, status_change
  description text not null,
  metadata jsonb not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 6. WHATSAPP & AUTOMATION
-- ------------------------------------------------------------------------------

create table if not exists public.wa_sessions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'disconnected' check (status in ('disconnected', 'connecting', 'connected', 'qr_ready')),
  qr text,
  connected_phone text,
  last_seen timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.wa_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  body text not null,
  variables text[] not null default '{}',
  category text not null default 'transactional' check (category in ('otp', 'transactional', 'promo')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wa_messages (
  id uuid primary key default gen_random_uuid(),
  direction text not null default 'outbound' check (direction in ('inbound', 'outbound')),
  phone text not null,
  body text not null,
  template_key text references public.wa_templates(key) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'read', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.wa_settings (
  id uuid primary key default gen_random_uuid(),
  daily_cap int not null default 500,
  hourly_cap int not null default 60,
  min_delay_s int not null default 4,
  max_delay_s int not null default 12,
  quiet_hours_start time not null default '22:00:00',
  quiet_hours_end time not null default '08:00:00',
  warmup_enabled boolean not null default true,
  warmup_day int not null default 1,
  autoreply_enabled boolean not null default true,
  fallback_to_cloud_api boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.wa_autoreply_rules (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  match_type text not null default 'exact' check (match_type in ('exact', 'contains', 'regex')),
  reply_template_key text references public.wa_templates(key) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wa_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template_key text references public.wa_templates(key) on delete set null,
  segment_filter jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'running', 'completed', 'paused', 'cancelled')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wa_optouts (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  reason text,
  created_at timestamptz not null default now()
);
