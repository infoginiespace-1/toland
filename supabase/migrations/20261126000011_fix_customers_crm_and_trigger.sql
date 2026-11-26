-- Migration: 20261126000011_fix_customers_crm_and_trigger.sql
-- Description: Allow nullable phone and add email to customers_crm, and harden handle_new_user trigger

-- 1. Alter customers_crm to allow email-only users
alter table public.customers_crm alter column phone drop not null;
alter table public.customers_crm add column if not exists email text;
create unique index if not exists idx_customers_crm_email on public.customers_crm (lower(email)) where email is not null;

-- 2. Harden handle_new_user trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_phone text;
  assigned_role text := 'customer';
  display_name text;
begin
  -- Extract phone number from auth.users or metadata
  user_phone := coalesce(new.phone, new.raw_user_meta_data->>'phone');
  display_name := coalesce(
    new.raw_user_meta_data->>'name', 
    case when new.email is not null then split_part(new.email, '@', 1) else null end, 
    'Customer'
  );

  -- 1. Check phone allowlist
  if user_phone is not null then
    select role into assigned_role
    from public.admin_allowlist
    where phone = user_phone or phone = replace(user_phone, '+91', '') or phone = ('+91' || user_phone);
  end if;

  -- 2. Check email allowlist if not already matched
  if (assigned_role is null or assigned_role = 'customer') and new.email is not null then
    select role into assigned_role
    from public.admin_allowlist
    where lower(email) = lower(new.email);
  end if;

  if assigned_role is null then
    assigned_role := 'customer';
  end if;

  -- 3. Create or update profiles row
  insert into public.profiles (id, phone, name, email, role)
  values (
    new.id,
    user_phone,
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

  -- 4. Update auth.users app_metadata with the role for immediate JWT sync
  begin
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', assigned_role)
    where id = new.id;
  exception when others then
    -- Suppress any recursion or permission warning
    null;
  end;

  -- 5. Safe CRM tracking (wrapped in exception block so CRM never blocks user auth creation)
  begin
    if user_phone is not null then
      insert into public.customers_crm (profile_id, phone, email, name, source)
      values (new.id, user_phone, new.email, display_name, 'phone_auth')
      on conflict (phone) do update
      set 
        profile_id = new.id, 
        email = coalesce(excluded.email, customers_crm.email),
        name = coalesce(excluded.name, customers_crm.name),
        updated_at = now();
    elsif new.email is not null then
      insert into public.customers_crm (profile_id, email, name, source)
      values (new.id, new.email, display_name, 'email_auth')
      on conflict do nothing;
    end if;
  exception when others then
    -- Log or ignore so user sign-up/creation never fails
    null;
  end;

  return new;
end;
$$;
