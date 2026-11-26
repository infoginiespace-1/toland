-- Migration: 20261126000010_email_auth_and_allowlist.sql
-- Description: Enable email-based signup/login and add email support to admin allowlist

-- 1. Make phone column in profiles nullable to support email-only signups
alter table public.profiles alter column phone drop not null;

-- 2. Add email column to admin_allowlist and make phone nullable
alter table public.admin_allowlist alter column phone drop not null;
alter table public.admin_allowlist add column if not exists email text unique;

-- 3. Register primary admin email and phone in admin_allowlist
insert into public.admin_allowlist (email, role, notes)
values ('info.giniespace@gmail.com', 'admin', 'Primary Organization Owner')
on conflict (email) do update set role = 'admin';

insert into public.admin_allowlist (phone, role, notes)
values 
  ('+918797186001', 'admin', 'Primary Owner Administrator'),
  ('8797186001', 'admin', 'Primary Owner Administrator')
on conflict (phone) do update set role = 'admin';

-- 4. Update handle_new_user trigger to recognize both phone and email admin allowlists
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
  -- Extract phone number from auth.users or metadata
  user_phone := coalesce(new.phone, new.raw_user_meta_data->>'phone');

  -- 1. Check phone allowlist
  if user_phone is not null then
    select role into assigned_role
    from public.admin_allowlist
    where phone = user_phone or phone = replace(user_phone, '+91', '') or phone = ('+91' || user_phone);
  end if;

  -- 2. Check email allowlist if not already matched as admin
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
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Customer'),
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
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', assigned_role)
  where id = new.id;

  -- 5. Track in CRM
  if user_phone is not null then
    insert into public.customers_crm (profile_id, phone, email, name, source)
    values (
      new.id, 
      user_phone, 
      new.email, 
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Storefront User'), 
      'phone_auth'
    )
    on conflict (phone) do update
    set profile_id = new.id, email = coalesce(excluded.email, customers_crm.email), updated_at = now();
  else
    insert into public.customers_crm (profile_id, email, name, source)
    values (
      new.id, 
      new.email, 
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Storefront User'), 
      'email_auth'
    );
  end if;

  return new;
end;
$$;
