-- ==============================================================================
-- TOLAND DATABASE SCHEMA — Migration 14: Reviews System & Media Upgrades
-- ==============================================================================

-- 1. Create reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  rating int not null check (rating >= 1 and rating <= 5),
  title text,
  comment text not null,
  is_verified_buyer boolean not null default true,
  is_featured boolean not null default false,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for speedy queries on storefront and admin
create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_reviews_status on public.reviews(status);
create index if not exists idx_reviews_featured on public.reviews(is_featured);

-- 2. Extend banners with media_type and subtitle
alter table public.banners add column if not exists media_type text not null default 'image';
alter table public.banners add column if not exists subtitle text;

-- 3. Extend product_images with media_type
alter table public.product_images add column if not exists media_type text not null default 'image';

-- 4. Enable Row Level Security (RLS) on reviews
alter table public.reviews enable row level security;

-- Drop previous policies if re-running
drop policy if exists "Public read approved reviews" on public.reviews;
drop policy if exists "Anyone can insert reviews" on public.reviews;
drop policy if exists "Admins manage all reviews" on public.reviews;

-- Public can read approved reviews
create policy "Public read approved reviews"
  on public.reviews
  for select
  using (status = 'approved');

-- Anyone can submit a review
create policy "Anyone can insert reviews"
  on public.reviews
  for insert
  with check (true);

-- Admins manage all reviews
create policy "Admins manage all reviews"
  on public.reviews
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- 5. Enable Realtime on reviews table (ignore if already added)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'reviews'
  ) then
    alter publication supabase_realtime add table public.reviews;
  end if;
exception when others then
  null;
end $$;

-- 6. Update storage buckets to support GIFs and MP4/WebM videos up to 50MB
update storage.buckets
set 
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
where id in ('product-images', 'banners', 'uploads');
