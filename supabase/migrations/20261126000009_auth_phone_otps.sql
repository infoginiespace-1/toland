-- Migration: 20261126000009_auth_phone_otps.sql
-- Description: Server-side WhatsApp OTP storage and Admin Allowlist update for owner phone

-- 1. Create phone_otps table for WhatsApp authentication
create table if not exists public.phone_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  otp text not null,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

create index if not exists idx_phone_otps_phone on public.phone_otps(phone);

-- Enable RLS (Service role can read/write, public cannot read)
alter table public.phone_otps enable row level security;

-- 2. Add owner phone number to admin_allowlist
insert into public.admin_allowlist (phone, role, notes)
values 
  ('+918797186001', 'admin', 'Primary Owner Administrator'),
  ('8797186001', 'admin', 'Primary Owner Administrator')
on conflict (phone) do update set role = 'admin';
