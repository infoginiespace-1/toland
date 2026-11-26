-- Migration: 20261126000012_categories_and_product_links.sql
-- Description: Insert core denim categories and link products to their respective categories

-- 1. Insert core categories
insert into public.categories (name, slug, sort, is_active) values
('Men''s Jeans', 'mens-jeans', 1, true),
('Slim Fit Denim', 'slim-fit-denim', 2, true),
('Regular Straight', 'regular-straight', 3, true),
('Casual Jackets & Shirts', 'casual-jackets-shirts', 4, true)
on conflict (slug) do update set 
  name = excluded.name, 
  sort = excluded.sort, 
  is_active = excluded.is_active;

-- 2. Link products to matching categories
update public.products
set category_id = (select id from public.categories where slug = 'slim-fit-denim' limit 1)
where slug in ('toland-raw-selvedge-slim-fit-denim', 'toland-jet-black-comfort-stretch-denim');

update public.products
set category_id = (select id from public.categories where slug = 'regular-straight' limit 1)
where slug = 'toland-classic-mid-blue-stonewash-straight';

update public.products
set category_id = (select id from public.categories where slug = 'casual-jackets-shirts' limit 1)
where slug = 'toland-heavyweight-denim-trucker-jacket';
