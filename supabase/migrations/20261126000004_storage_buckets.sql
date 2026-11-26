-- ==============================================================================
-- TOLAND DATABASE SCHEMA — Migration 4: Storage Buckets & Policies
-- ==============================================================================

-- Create buckets in storage.buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('banners', 'banners', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('invoices', 'invoices', false, 10485760, array['application/pdf']),
  ('uploads', 'uploads', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- STORAGE RLS POLICIES
-- ------------------------------------------------------------------------------

-- Public read for product-images and banners
create policy "Public read product-images bucket"
  on storage.objects
  for select
  using (bucket_id = 'product-images');

create policy "Public read banners bucket"
  on storage.objects
  for select
  using (bucket_id = 'banners');

-- Admins and staff can upload/update/delete product images and banners
create policy "Admins manage product-images"
  on storage.objects
  for all
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admins manage banners bucket"
  on storage.objects
  for all
  using (bucket_id = 'banners' and public.is_admin())
  with check (bucket_id = 'banners' and public.is_admin());

-- Invoices: Authenticated users can read their own invoices, admins manage
create policy "Users read own invoices"
  on storage.objects
  for select
  using (
    bucket_id = 'invoices' and (
      public.is_admin() or
      (auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text)
    )
  );

create policy "Admins manage invoices"
  on storage.objects
  for all
  using (bucket_id = 'invoices' and public.is_admin())
  with check (bucket_id = 'invoices' and public.is_admin());

-- Uploads: Authenticated users can upload to their own user_id folder; admins manage all
create policy "Users upload to own folder in uploads"
  on storage.objects
  for insert
  with check (
    bucket_id = 'uploads' and (
      public.is_admin() or
      (auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text)
    )
  );

create policy "Users read own uploads"
  on storage.objects
  for select
  using (
    bucket_id = 'uploads' and (
      public.is_admin() or
      (auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text)
    )
  );

create policy "Admins manage all uploads"
  on storage.objects
  for all
  using (bucket_id = 'uploads' and public.is_admin())
  with check (bucket_id = 'uploads' and public.is_admin());
