-- ==============================================================================
-- TOLAND DATABASE SCHEMA — Migration: Strict Email/Phone Uniqueness & Confirmed-Only Profile Trigger
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. MERGE KNOWN DUPLICATE ACCOUNT FOR 7870819862 (Keep primary email account)
-- ------------------------------------------------------------------------------
do $$
declare
  primary_id uuid := '4efeb0af-e33b-4a38-beb5-d75a6d65705f';
  dup_id     uuid := '210bacb5-3456-4872-ac1c-ac0e4d4e7a76';
  has_refs   int := 0;
begin
  if exists (select 1 from auth.users where id = primary_id)
     and exists (select 1 from auth.users where id = dup_id) then
    select
      (select count(*) from public.orders where user_id = dup_id) +
      (select count(*) from public.addresses where user_id = dup_id) +
      (select count(*) from public.reviews where user_id = dup_id)
    into has_refs;

    if has_refs = 0 then
      if exists (select 1 from public.customers_crm where phone = '+917870819862' and (profile_id is distinct from dup_id)) then
        update public.customers_crm
        set profile_id = primary_id,
            email = coalesce(email, 'dawoods8797@gmail.com'),
            updated_at = now()
        where phone = '+917870819862';

        delete from public.customers_crm where profile_id = dup_id;
      else
        update public.customers_crm
        set profile_id = primary_id,
            email = coalesce(email, 'dawoods8797@gmail.com'),
            phone = '+917870819862',
            updated_at = now()
        where profile_id = dup_id;
      end if;

      delete from auth.users where id = dup_id;

      update auth.users
      set phone = '917870819862',
          phone_confirmed_at = coalesce(phone_confirmed_at, now())
      where id = primary_id;
    end if;
  end if;
end $$;

-- ------------------------------------------------------------------------------
-- 2. NORMALIZE EXISTING PROFILES PHONES & ADD STRICT UNIQUE INDEXES
-- ------------------------------------------------------------------------------
update public.profiles
set phone = '+91' || right(regexp_replace(phone, '\D', '', 'g'), 10)
where phone is not null
  and length(regexp_replace(phone, '\D', '', 'g')) >= 10
  and phone <> '+91' || right(regexp_replace(phone, '\D', '', 'g'), 10);

create unique index if not exists idx_profiles_phone_last10_unique
  on public.profiles ((right(regexp_replace(phone, '\D', '', 'g'), 10)))
  where phone is not null and length(regexp_replace(phone, '\D', '', 'g')) >= 10;

create unique index if not exists idx_profiles_email_lower_unique
  on public.profiles ((lower(email)))
  where email is not null and email <> '';

-- ------------------------------------------------------------------------------
-- 3. CONFIRMED-ONLY PROFILE & CRM TRIGGER (Do NOT create profile before OTP verify)
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
  assigned_role text := 'customer';
  display_name text;
begin
  -- Wait until at least email or phone is OTP-confirmed before creating profile/CRM records
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

  display_name := coalesce(
    nullif(new.raw_user_meta_data->>'name', ''),
    case
      when new.email is not null and new.email not like '%@phone.toland.in'
        then split_part(new.email, '@', 1)
      else null
    end,
    'Customer'
  );

  -- 1. Check phone allowlist
  if canonical_phone is not null then
    select role into assigned_role
    from public.admin_allowlist
    where phone = canonical_phone
       or phone = right(digits, 10)
       or phone = auth_digits_phone;
  end if;

  -- 2. Check email allowlist
  if (assigned_role is null or assigned_role = 'customer') and new.email is not null then
    select role into assigned_role
    from public.admin_allowlist
    where lower(email) = lower(new.email);
  end if;

  if assigned_role is null then
    assigned_role := coalesce(nullif(new.raw_app_meta_data->>'role', ''), 'customer');
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
      phone = coalesce(nullif(phone, ''), auth_digits_phone),
      phone_confirmed_at = case
        when auth_digits_phone is not null and phone_confirmed_at is null and new.email_confirmed_at is not null
          then phone_confirmed_at
        else phone_confirmed_at
      end
    where id = new.id;
  exception when others then
    null;
  end;

  -- 5. Safe CRM tracking
  begin
    if canonical_phone is not null then
      insert into public.customers_crm (profile_id, phone, email, name, source)
      values (
        new.id,
        canonical_phone,
        case when new.email like '%@phone.toland.in' then null else new.email end,
        display_name,
        case when new.email like '%@phone.toland.in' then 'phone_auth' else 'email_auth' end
      )
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
    null;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email_confirmed_at, phone_confirmed_at on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. FAST SECURITY DEFINER LOOKUPS (NO 50-USER PAGINATION LIMIT)
-- ------------------------------------------------------------------------------
create or replace function public.check_identity_availability(p_email text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_last10 text := case when length(v_digits) >= 10 then right(v_digits, 10) else null end;
  v_email_user record;
  v_phone_user record;
  v_profile_email_exists boolean := false;
  v_profile_phone_exists boolean := false;
  v_unconfirmed_id uuid := null;
begin
  if v_email is not null then
    select id, email_confirmed_at, phone_confirmed_at
    into v_email_user
    from auth.users
    where lower(email) = v_email
    limit 1;

    select exists(
      select 1 from public.profiles where lower(email) = v_email
    ) into v_profile_email_exists;

    if v_email_user.id is not null and v_email_user.email_confirmed_at is null and v_email_user.phone_confirmed_at is null then
      v_unconfirmed_id := v_email_user.id;
    end if;
  end if;

  if v_last10 is not null then
    select id, email, email_confirmed_at, phone_confirmed_at
    into v_phone_user
    from auth.users
    where (
      right(regexp_replace(coalesce(phone, raw_user_meta_data->>'phone', ''), '\D', '', 'g'), 10) = v_last10
      or lower(coalesce(email, '')) = (v_last10 || '@phone.toland.in')
    )
    and (email_confirmed_at is not null or phone_confirmed_at is not null)
    limit 1;

    select exists(
      select 1 from public.profiles
      where phone is not null
        and length(regexp_replace(phone, '\D', '', 'g')) >= 10
        and right(regexp_replace(phone, '\D', '', 'g'), 10) = v_last10
    ) into v_profile_phone_exists;
  end if;

  return jsonb_build_object(
    'email_taken', (
      (v_email_user.id is not null and (v_email_user.email_confirmed_at is not null or v_email_user.phone_confirmed_at is not null))
      or v_profile_email_exists
    ),
    'phone_taken', (v_phone_user.id is not null or v_profile_phone_exists),
    'phone_owner_is_synthetic', (v_phone_user.email is not null and v_phone_user.email like '%@phone.toland.in'),
    'unconfirmed_user_id', v_unconfirmed_id
  );
end;
$$;

create or replace function public.find_verified_user_by_phone(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_last10 text := case when length(v_digits) >= 10 then right(v_digits, 10) else null end;
  v_row record;
begin
  if v_last10 is null then
    return null;
  end if;

  select
    u.id,
    u.email,
    u.phone,
    u.email_confirmed_at,
    u.phone_confirmed_at,
    coalesce(p.role, u.raw_app_meta_data->>'role', 'customer') as role,
    coalesce(p.name, u.raw_user_meta_data->>'name', 'Customer') as name
  into v_row
  from auth.users u
  left join public.profiles p on p.id = u.id
  where (
    right(regexp_replace(coalesce(u.phone, u.raw_user_meta_data->>'phone', p.phone, ''), '\D', '', 'g'), 10) = v_last10
    or lower(coalesce(u.email, '')) = (v_last10 || '@phone.toland.in')
  )
  and (u.email_confirmed_at is not null or u.phone_confirmed_at is not null or p.id is not null)
  order by (u.email is not null and u.email not like '%@phone.toland.in') desc, u.created_at asc
  limit 1;

  if v_row.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'email', v_row.email,
    'phone', v_row.phone,
    'role', v_row.role,
    'name', v_row.name
  );
end;
$$;

revoke all on function public.check_identity_availability(text, text) from public, anon, authenticated;
grant execute on function public.check_identity_availability(text, text) to service_role;

revoke all on function public.find_verified_user_by_phone(text) from public, anon, authenticated;
grant execute on function public.find_verified_user_by_phone(text) to service_role;

notify pgrst, 'reload schema';
