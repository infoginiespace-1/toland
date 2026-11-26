-- Migration: 20261126000005_wa_auth_and_queue.sql
-- Description: Baileys authentication persistence in Postgres and queue management columns

-- 1. Baileys multi-file authentication keys store in Postgres
create table if not exists public.wa_auth_keys (
  session_id text not null default 'default',
  key_id text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (session_id, key_id)
);

create index if not exists idx_wa_auth_keys_session on public.wa_auth_keys(session_id);

alter table public.wa_auth_keys enable row level security;

-- Admin access policy for wa_auth_keys
create policy "wa_auth_keys_admin_all" on public.wa_auth_keys
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 2. Enhance wa_messages for queue prioritization, retry logic, and scheduling
alter table public.wa_messages
  add column if not exists priority int not null default 2, -- 1: OTP, 2: Transactional/Order, 3: Promotional
  add column if not exists scheduled_at timestamptz not null default now(),
  add column if not exists sent_at timestamptz,
  add column if not exists attempts int not null default 0,
  add column if not exists max_attempts int not null default 3,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_wa_messages_queue 
  on public.wa_messages (status, priority, scheduled_at) 
  where status = 'queued';

create index if not exists idx_wa_messages_phone
  on public.wa_messages (phone);

-- 3. Enhance wa_settings for queue control & auto-pause failure protection
alter table public.wa_settings
  add column if not exists queue_paused boolean not null default false,
  add column if not exists failure_streak int not null default 0,
  add column if not exists failure_threshold int not null default 5;
