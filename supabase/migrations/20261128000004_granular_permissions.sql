-- ==============================================================================
-- TOLAND DATABASE SCHEMA — Migration: Granular Per-Tab Permissions (JSONB)
-- ==============================================================================

alter table public.profiles
  add column if not exists permissions jsonb default null;

alter table public.admin_allowlist
  add column if not exists permissions jsonb default null;

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
  assigned_permissions jsonb := null;
  allow_row record;
  display_name text;
  real_email text;
  existing_crm_id uuid;
begin
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
    select role, permissions into allow_row
    from public.admin_allowlist
    where phone = canonical_phone
       or phone = right(digits, 10)
       or phone = auth_digits_phone
    limit 1;

    if allow_row.role is not null then
      assigned_role := allow_row.role;
      assigned_permissions := allow_row.permissions;
    end if;
  end if;

  -- 2. Check email allowlist if not matched by phone
  if assigned_role is null and new.email is not null then
    select role, permissions into allow_row
    from public.admin_allowlist
    where lower(email) = lower(new.email)
    limit 1;

    if allow_row.role is not null then
      assigned_role := allow_row.role;
      assigned_permissions := allow_row.permissions;
    end if;
  end if;

  -- Sole Super Admin safety check
  if lower(coalesce(new.email, '')) = 'dawoodhussain504@gmail.com' then
    assigned_role := 'admin';
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

  if assigned_permissions is null and (new.raw_app_meta_data ? 'permissions') then
    assigned_permissions := new.raw_app_meta_data->'permissions';
  end if;

  -- 3. Create or update public.profiles row
  insert into public.profiles (id, phone, name, email, role, permissions)
  values (
    new.id,
    canonical_phone,
    display_name,
    new.email,
    assigned_role,
    assigned_permissions
  )
  on conflict (id) do update
  set
    phone = coalesce(excluded.phone, profiles.phone),
    name = coalesce(excluded.name, profiles.name),
    email = coalesce(excluded.email, profiles.email),
    role = excluded.role,
    permissions = coalesce(excluded.permissions, profiles.permissions),
    updated_at = now();

  -- 4. Sync app_metadata.role and permissions back to auth.users
  begin
    update auth.users
    set
      raw_app_meta_data = case
        when assigned_permissions is not null then
          coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', assigned_role, 'permissions', assigned_permissions)
        else
          (coalesce(raw_app_meta_data, '{}'::jsonb) - 'permissions') || jsonb_build_object('role', assigned_role)
      end,
      phone = coalesce(nullif(phone, ''), auth_digits_phone)
    where id = new.id;
  exception when others then
    null;
  end;

  -- 5. Re-link or create CRM row safely
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
