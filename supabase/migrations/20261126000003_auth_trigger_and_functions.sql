-- ==============================================================================
-- TOLAND DATABASE SCHEMA — Migration 3: Auth Triggers, Role Sync & Functions
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. AUTOMATIC PROFILE CREATION & ADMIN ROLE SYNC TRIGGER
-- ------------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_phone text;
  assigned_role text := 'customer';
begin
  -- Extract phone number from auth.users
  user_phone := coalesce(new.phone, new.raw_user_meta_data->>'phone');

  -- Check if phone is in admin_allowlist
  if user_phone is not null then
    select role into assigned_role
    from public.admin_allowlist
    where phone = user_phone;

    if assigned_role is null then
      assigned_role := 'customer';
    end if;
  end if;

  -- Create public.profiles row
  insert into public.profiles (id, phone, name, email, role)
  values (
    new.id,
    coalesce(user_phone, new.id::text),
    coalesce(new.raw_user_meta_data->>'name', 'Customer'),
    new.email,
    assigned_role
  )
  on conflict (id) do update
  set
    phone = excluded.phone,
    name = coalesce(excluded.name, profiles.name),
    email = coalesce(excluded.email, profiles.email),
    role = excluded.role,
    updated_at = now();

  -- Update auth.users app_metadata with the role so RLS is_admin() can read it directly from JWT
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', assigned_role)
  where id = new.id;

  -- Also track in CRM as a customer
  if user_phone is not null then
    insert into public.customers_crm (profile_id, phone, name, source)
    values (new.id, user_phone, coalesce(new.raw_user_meta_data->>'name', 'Storefront User'), 'phone_auth')
    on conflict (phone) do update
    set profile_id = new.id, updated_at = now();
  end if;

  return new;
end;
$$;

-- Trigger on auth.users after insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. UPDATED_AT TIMESTAMP HELPER
-- ------------------------------------------------------------------------------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach updated_at triggers
create or replace trigger set_profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
create or replace trigger set_addresses_updated_at before update on public.addresses for each row execute function public.handle_updated_at();
create or replace trigger set_categories_updated_at before update on public.categories for each row execute function public.handle_updated_at();
create or replace trigger set_products_updated_at before update on public.products for each row execute function public.handle_updated_at();
create or replace trigger set_product_variants_updated_at before update on public.product_variants for each row execute function public.handle_updated_at();
create or replace trigger set_orders_updated_at before update on public.orders for each row execute function public.handle_updated_at();
create or replace trigger set_customers_crm_updated_at before update on public.customers_crm for each row execute function public.handle_updated_at();
create or replace trigger set_leads_updated_at before update on public.leads for each row execute function public.handle_updated_at();
create or replace trigger set_wa_settings_updated_at before update on public.wa_settings for each row execute function public.handle_updated_at();
create or replace trigger set_wa_templates_updated_at before update on public.wa_templates for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 3. SEQUENTIAL ORDER NUMBER GENERATOR (e.g. TLD-2026-0001)
-- ------------------------------------------------------------------------------

create sequence if not exists public.order_number_seq start 1001;

create or replace function public.generate_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_no is null or new.order_no = '' then
    new.order_no := 'TLD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

create or replace trigger set_order_no_before_insert
  before insert on public.orders
  for each row execute function public.generate_order_number();

-- ------------------------------------------------------------------------------
-- 4. INITIAL DEFAULT SEED FOR WHATSAPP SETTINGS & TEMPLATES
-- ------------------------------------------------------------------------------

insert into public.wa_settings (
  daily_cap, hourly_cap, min_delay_s, max_delay_s, quiet_hours_start, quiet_hours_end, warmup_enabled, warmup_day, autoreply_enabled
) values (
  500, 60, 4, 12, '22:00:00', '08:00:00', true, 1, true
) on conflict do nothing;

insert into public.wa_templates (key, name, body, variables, category) values
('otp', 'Login OTP', 'Your TOLAND verification code is {{1}}. Valid for 5 minutes. Please do not share this code with anyone.', array['code'], 'otp'),
('order_confirmed', 'Order Confirmed', 'Hello {{1}}, your TOLAND order #{{2}} of ₹{{3}} has been confirmed! We are getting your denim ready. Track here: {{4}}', array['name', 'order_no', 'amount', 'link'], 'transactional'),
('order_shipped', 'Order Shipped', 'Great news {{1}}! Your TOLAND order #{{2}} has been shipped via {{3}} (AWB: {{4}}). Track your package: {{5}}', array['name', 'order_no', 'courier', 'awb', 'tracking_url'], 'transactional'),
('order_delivered', 'Order Delivered', 'Hi {{1}}, your order #{{2}} has been delivered. Thank you for choosing TOLAND! Need help or want an exchange? Reply here anytime.', array['name', 'order_no'], 'transactional'),
('b2b_inquiry_received', 'B2B Enquiry Received', 'Namaste {{1}}, thank you for contacting TOLAND Wholesale & Manufacturing. Our team will contact you shortly regarding your bulk enquiry.', array['name'], 'transactional')
on conflict (key) do nothing;
