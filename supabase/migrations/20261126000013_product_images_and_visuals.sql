-- Migration: 20261126000013_product_images_and_visuals.sql
-- Description: Seed high-resolution denim studio and lifestyle photography into product_images and banners

-- 1. Clear existing images for core products to prevent duplication on re-run
delete from public.product_images where product_id in (
  'ed000000-0000-0000-0000-000000000001',
  'ed000000-0000-0000-0000-000000000002',
  'ed000000-0000-0000-0000-000000000003',
  'ed000000-0000-0000-0000-000000000004'
);

-- 2. Insert photography angles for Product 1: TOLAND Raw Selvedge Slim Fit Denim Jeans
insert into public.product_images (id, product_id, path, sort) values
('ea000000-0000-0000-0000-000000000011', 'ed000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=1000&q=80', 1),
('ea000000-0000-0000-0000-000000000012', 'ed000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=1000&q=80', 2),
('ea000000-0000-0000-0000-000000000013', 'ed000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80', 3)
on conflict (id) do update set path = excluded.path, sort = excluded.sort;

-- 3. Insert photography angles for Product 2: TOLAND Classic Mid-Blue Stonewash Straight Jeans
insert into public.product_images (id, product_id, path, sort) values
('ea000000-0000-0000-0000-000000000021', 'ed000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80', 1),
('ea000000-0000-0000-0000-000000000022', 'ed000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1000&q=80', 2),
('ea000000-0000-0000-0000-000000000023', 'ed000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=1000&q=80', 3)
on conflict (id) do update set path = excluded.path, sort = excluded.sort;

-- 4. Insert photography angles for Product 3: TOLAND Jet Black Comfort Stretch Denim Jeans
insert into public.product_images (id, product_id, path, sort) values
('ea000000-0000-0000-0000-000000000031', 'ed000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?auto=format&fit=crop&w=1000&q=80', 1),
('ea000000-0000-0000-0000-000000000032', 'ed000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=1000&q=80', 2),
('ea000000-0000-0000-0000-000000000033', 'ed000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80', 3)
on conflict (id) do update set path = excluded.path, sort = excluded.sort;

-- 5. Insert photography angles for Product 4: TOLAND Heavyweight Denim Trucker Jacket
insert into public.product_images (id, product_id, path, sort) values
('ea000000-0000-0000-0000-000000000041', 'ed000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&w=1000&q=80', 1),
('ea000000-0000-0000-0000-000000000042', 'ed000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80', 2),
('ea000000-0000-0000-0000-000000000043', 'ed000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1000&q=80', 3)
on conflict (id) do update set path = excluded.path, sort = excluded.sort;

-- 6. Update Banners with authentic photography
update public.banners
set image_path = 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=2000&q=85'
where id = 'ba000000-0000-0000-0000-000000000001';

update public.banners
set image_path = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=2000&q=85'
where id = 'ba000000-0000-0000-0000-000000000002';
