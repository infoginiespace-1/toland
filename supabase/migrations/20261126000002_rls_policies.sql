-- ==============================================================================
-- TOLAND DATABASE SCHEMA — Migration 2: RLS Policies & Security
-- ==============================================================================

-- Helper function: Check if current authenticated user has admin or staff privileges
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'staff'),
    false
  );
$$;

-- Helper function: Check if current user is super admin
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ------------------------------------------------------------------------------
-- ENABLE RLS ON EVERY SINGLE TABLE
-- ------------------------------------------------------------------------------
alter table public.admin_allowlist enable row level security;
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.banners enable row level security;

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.shipments enable row level security;

alter table public.suppliers enable row level security;
alter table public.raw_materials enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.boms enable row level security;
alter table public.production_orders enable row level security;
alter table public.production_stages enable row level security;
alter table public.stock_ledger enable row level security;
alter table public.b2b_price_tiers enable row level security;

alter table public.customers_crm enable row level security;
alter table public.leads enable row level security;
alter table public.followups enable row level security;
alter table public.activities enable row level security;

alter table public.wa_sessions enable row level security;
alter table public.wa_templates enable row level security;
alter table public.wa_messages enable row level security;
alter table public.wa_settings enable row level security;
alter table public.wa_autoreply_rules enable row level security;
alter table public.wa_campaigns enable row level security;
alter table public.wa_optouts enable row level security;

-- ------------------------------------------------------------------------------
-- 1. IDENTITY & PROFILES POLICIES
-- ------------------------------------------------------------------------------

-- Admin allowlist: only admins can view or modify
create policy "Admins manage admin_allowlist"
  on public.admin_allowlist
  for all
  using (public.is_admin());

-- Profiles: Users can view/edit their own profile; admins can manage all
create policy "Users read own profile"
  on public.profiles
  for select
  using (auth.uid() = id or public.is_admin());

create policy "Users update own profile"
  on public.profiles
  for update
  using (auth.uid() = id or public.is_admin());

create policy "Admins manage all profiles"
  on public.profiles
  for all
  using (public.is_admin());

-- Addresses: Users manage their own addresses; admins can view for orders
create policy "Users manage own addresses"
  on public.addresses
  for all
  using (auth.uid() = user_id or public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. CATALOG POLICIES
-- ------------------------------------------------------------------------------

-- Categories: public read for active categories; admins full manage
create policy "Public read active categories"
  on public.categories
  for select
  using (is_active = true or public.is_admin());

create policy "Admins manage categories"
  on public.categories
  for all
  using (public.is_admin());

-- Products: public read active products; admins full manage
create policy "Public read active products"
  on public.products
  for select
  using (is_active = true or public.is_admin());

create policy "Admins manage products"
  on public.products
  for all
  using (public.is_admin());

-- Product Variants: public read if parent product is active
create policy "Public read variants"
  on public.product_variants
  for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id
        and (p.is_active = true or public.is_admin())
    )
  );

create policy "Admins manage product_variants"
  on public.product_variants
  for all
  using (public.is_admin());

-- Product Images: public read
create policy "Public read product_images"
  on public.product_images
  for select
  using (true);

create policy "Admins manage product_images"
  on public.product_images
  for all
  using (public.is_admin());

-- Banners: public read active banners
create policy "Public read active banners"
  on public.banners
  for select
  using (is_active = true or public.is_admin());

create policy "Admins manage banners"
  on public.banners
  for all
  using (public.is_admin());

-- B2B Price Tiers: public read for buyers; admins full manage
create policy "Public read b2b_price_tiers"
  on public.b2b_price_tiers
  for select
  using (true);

create policy "Admins manage b2b_price_tiers"
  on public.b2b_price_tiers
  for all
  using (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. CARTS & ORDERS POLICIES
-- ------------------------------------------------------------------------------

-- Carts: Users manage their own cart
create policy "Users manage own cart"
  on public.carts
  for all
  using (auth.uid() = user_id);

-- Cart Items: Users manage their own cart items
create policy "Users manage own cart items"
  on public.cart_items
  for all
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = auth.uid()
    )
  );

-- Coupons: Public can read active coupons to apply
create policy "Public read active coupons"
  on public.coupons
  for select
  using (is_active = true or public.is_admin());

create policy "Admins manage coupons"
  on public.coupons
  for all
  using (public.is_admin());

-- Orders: Users read own orders and can create orders; admins manage all
create policy "Users read own orders"
  on public.orders
  for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users create orders"
  on public.orders
  for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Admins manage all orders"
  on public.orders
  for all
  using (public.is_admin());

-- Order Items: Users read own order items; admins manage all
create policy "Users read own order items"
  on public.order_items
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Users insert own order items"
  on public.order_items
  for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or o.user_id is null or public.is_admin())
    )
  );

create policy "Admins manage order_items"
  on public.order_items
  for all
  using (public.is_admin());

-- Order Status History: Users can view history of their order; admins manage
create policy "Users read own order status history"
  on public.order_status_history
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Admins manage order_status_history"
  on public.order_status_history
  for all
  using (public.is_admin());

-- Payments: Users read own payment records; webhook/service_role/admin manages
create policy "Users read own payments"
  on public.payments
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Admins manage payments"
  on public.payments
  for all
  using (public.is_admin());

-- Invoices: Users can read their own invoice; admins manage
create policy "Users read own invoices"
  on public.invoices
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = invoices.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Admins manage invoices"
  on public.invoices
  for all
  using (public.is_admin());

-- Shipments: Users can track their shipments; admins manage
create policy "Users read own shipments"
  on public.shipments
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = shipments.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Admins manage shipments"
  on public.shipments
  for all
  using (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. ERP POLICIES (Admins and Staff only)
-- ------------------------------------------------------------------------------
create policy "Admins and staff manage suppliers"
  on public.suppliers for all using (public.is_admin());

create policy "Admins and staff manage raw_materials"
  on public.raw_materials for all using (public.is_admin());

create policy "Admins and staff manage purchase_orders"
  on public.purchase_orders for all using (public.is_admin());

create policy "Admins and staff manage purchase_order_items"
  on public.purchase_order_items for all using (public.is_admin());

create policy "Admins and staff manage boms"
  on public.boms for all using (public.is_admin());

create policy "Admins and staff manage production_orders"
  on public.production_orders for all using (public.is_admin());

create policy "Admins and staff manage production_stages"
  on public.production_stages for all using (public.is_admin());

create policy "Admins and staff manage stock_ledger"
  on public.stock_ledger for all using (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. CRM POLICIES
-- ------------------------------------------------------------------------------
-- Leads: Public can submit website B2B inquiries; Admins manage all
create policy "Public insert leads"
  on public.leads
  for insert
  with check (true);

create policy "Admins manage leads"
  on public.leads
  for all
  using (public.is_admin());

create policy "Admins manage customers_crm"
  on public.customers_crm for all using (public.is_admin());

create policy "Admins manage followups"
  on public.followups for all using (public.is_admin());

create policy "Admins manage activities"
  on public.activities for all using (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. WHATSAPP POLICIES (Admins and Staff only)
-- ------------------------------------------------------------------------------
create policy "Admins manage wa_sessions"
  on public.wa_sessions for all using (public.is_admin());

create policy "Admins manage wa_templates"
  on public.wa_templates for all using (public.is_admin());

create policy "Admins manage wa_messages"
  on public.wa_messages for all using (public.is_admin());

create policy "Admins manage wa_settings"
  on public.wa_settings for all using (public.is_admin());

create policy "Admins manage wa_autoreply_rules"
  on public.wa_autoreply_rules for all using (public.is_admin());

create policy "Admins manage wa_campaigns"
  on public.wa_campaigns for all using (public.is_admin());

create policy "Admins manage wa_optouts"
  on public.wa_optouts for all using (public.is_admin());
