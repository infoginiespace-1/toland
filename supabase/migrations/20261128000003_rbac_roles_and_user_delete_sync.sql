-- ==============================================================================
-- TOLAND DATABASE SCHEMA — Migration: Multi-Role RBAC & Clean User Delete/Re-Signup
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXPAND ROLE CHECK CONSTRAINTS (6 Business Roles)
-- ------------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'staff', 'erp_manager', 'sales_crm', 'marketing', 'admin'));

alter table public.admin_allowlist drop constraint if exists admin_allowlist_role_check;
alter table public.admin_allowlist
  add constraint admin_allowlist_role_check
  check (role in ('staff', 'erp_manager', 'sales_crm', 'marketing', 'admin'));

-- ------------------------------------------------------------------------------
-- 2. UPDATE RLS ROLE HELPERS
-- ------------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'staff', 'erp_manager', 'sales_crm', 'marketing'),
    false
  );
$$;

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
-- 3. HARDEN handle_new_user() FOR RE-SIGNUPS AFTER DELETION & ALL TEAM ROLES
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_phone text;
  digits text;
  canonical_phone text;
  auth_digits_phone text;
  assigned_role text := null;
  display_name text;
  real_email text;
  existing_crm_id uuid;
begin
  -- Wait until email or phone is OTP-confirmed before creating profile/CRM records
  if new.email_confirmed_at is null and new.phone_confirmed_at is null then
    return new;
  end if;

  raw_phone := coalesce(nullif(new.phone, ''), nullif(new.raw_user_meta_data->>'phone', ''));
  if raw_phone is not null then
    digits := regexp_replace(raw_phone, '\D', '', 'g');
    if length(digits) >= 10 then
      canonical_phone := '+91' || right(digits, 10);
      auth_digits_phone := '91' || right(digits, 10);
    end if;
  end if;

  real_email := case
    when new.email is not null and new.email not like '%@phone.toland.in' then new.email
    else null
  end;

  display_name := coalesce(
    nullif(new.raw_user_meta_data->>'name', ''),
    case when real_email is not null then split_part(real_email, '@', 1) else null end,
    'Customer'
  );

  -- 1. Check phone allowlist
  if canonical_phone is not null then
    select role into assigned_role
    from public.admin_allowlist
    where phone = canonical_phone
       or phone = right(digits, 10)
       or phone = auth_digits_phone
    limit 1;
  end if;

  -- 2. Check email allowlist if not matched by phone
  if assigned_role is null and new.email is not null then
    select role into assigned_role
    from public.admin_allowlist
    where lower(email) = lower(new.email)
    limit 1;
  end if;

  if assigned_role is null then
    assigned_role := coalesce(
      nullif(new.raw_app_meta_data->>'role', ''),
      nullif(new.raw_user_meta_data->>'role', ''),
      'customer'
    );
  end if;

  if assigned_role not in ('customer', 'staff', 'erp_manager', 'sales_crm', 'marketing', 'admin') then
    assigned_role := 'customer';
  end if;

  -- 3. Create or update public.profiles row
  insert into public.profiles (id, phone, name, email, role)
  values (
    new.id,
    canonical_phone,
    display_name,
    new.email,
    assigned_role
  )
  on conflict (id) do update
  set
    phone = coalesce(excluded.phone, profiles.phone),
    name = coalesce(excluded.name, profiles.name),
    email = coalesce(excluded.email, profiles.email),
    role = excluded.role,
    updated_at = now();

  -- 4. Sync app_metadata.role and canonical phone back to auth.users
  begin
    update auth.users
    set
      raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', assigned_role),
      phone = coalesce(nullif(phone, ''), auth_digits_phone)
    where id = new.id;
  exception when others then
    null;
  end;

  -- 5. Re-link or create CRM row safely (handles re-signups after admin deletion cleanly)
  begin
    if canonical_phone is not null or real_email is not null then
      select id into existing_crm_id
      from public.customers_crm
      where (canonical_phone is not null and phone = canonical_phone)
         or (real_email is not null and lower(email) = lower(real_email))
      order by (phone = canonical_phone) desc nulls last, updated_at desc
      limit 1;

      if existing_crm_id is not null then
        update public.customers_crm
        set
          profile_id = new.id,
          phone = coalesce(canonical_phone, customers_crm.phone),
          email = coalesce(real_email, customers_crm.email),
          name = coalesce(nullif(display_name, 'Customer'), customers_crm.name),
          updated_at = now()
        where id = existing_crm_id;
      else
        insert into public.customers_crm (profile_id, phone, email, name, source)
        values (
          new.id,
          canonical_phone,
          real_email,
          display_name,
          case when real_email is null then 'phone_auth' else 'email_auth' end
        );
      end if;
    end if;
  exception when others then
    null;
  end;

  return new;
end;
$$;

notify pgrst, 'reload schema';
