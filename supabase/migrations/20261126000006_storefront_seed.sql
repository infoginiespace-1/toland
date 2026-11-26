-- Migration: 20261126000006_storefront_seed.sql
-- Description: Seed catalog products, variants, banners, and launch coupons for the TOLAND storefront

-- 1. Banners for Homepage Carousel
insert into public.banners (id, title, image_path, link, sort, is_active) values
('ba000000-0000-0000-0000-000000000001', 'Direct From Factory: Premium Denim Collection 2026', '/images/banners/banner_denim_hero.jpg', '/products?category=mens-jeans', 1, true),
('ba000000-0000-0000-0000-000000000002', 'B2B & Wholesale Orders: Authentic Sheikhpura Denim', '/images/banners/banner_wholesale.jpg', '/b2b', 2, true)
on conflict (id) do nothing;

-- 2. Core Denim Products
insert into public.products (id, name, slug, description, category_id, base_price, mrp, gst_percent, hsn_code, is_active, is_featured, meta_title, meta_description) values
(
  'ed000000-0000-0000-0000-000000000001',
  'TOLAND Raw Selvedge Slim Fit Denim Jeans',
  'toland-raw-selvedge-slim-fit-denim',
  'Crafted at our Sheikhpura manufacturing unit using heavyweight 13.5oz ring-spun cotton denim. Deep indigo raw finish designed to fade naturally with wear. Features reinforced bar-tacks, heavy-duty brass zipper, and signature forest green stitch detailing on the back pocket.',
  (select id from public.categories where slug = 'slim-fit-denim' limit 1),
  1499.00,
  2999.00,
  12,
  '620342',
  true,
  true,
  'TOLAND Raw Selvedge Slim Fit Denim Jeans | Factory Direct',
  'Heavyweight raw indigo slim-fit jeans made directly in Sheikhpura, Bihar. 100% Cotton, built to last.'
),
(
  'ed000000-0000-0000-0000-000000000002',
  'TOLAND Classic Mid-Blue Stonewash Straight Jeans',
  'toland-classic-mid-blue-stonewash-straight',
  'Classic 5-pocket straight leg denim treated with our signature in-house enzyme stonewash for an authentic vintage feel and soft hand-feel from day one. Medium rise with comfortable thigh room and straight leg opening.',
  (select id from public.categories where slug = 'regular-straight' limit 1),
  1299.00,
  2499.00,
  12,
  '620342',
  true,
  true,
  'TOLAND Classic Mid-Blue Stonewash Straight Jeans',
  'Comfortable straight fit jeans with authentic enzyme stone wash. Direct from manufacturer.'
),
(
  'ed000000-0000-0000-0000-000000000003',
  'TOLAND Jet Black Comfort Stretch Denim Jeans',
  'toland-jet-black-comfort-stretch-denim',
  'Deep sulfur dyed black denim with 2% elastane for unrestricted all-day flexibility. Resistant to fading across dozens of washes. Clean modern look suitable for workwear and evening casuals.',
  (select id from public.categories where slug = 'slim-fit-denim' limit 1),
  1399.00,
  2699.00,
  12,
  '620342',
  true,
  true,
  'TOLAND Jet Black Comfort Stretch Denim Jeans',
  'Fade-resistant sulfur black stretch jeans designed for comfort and durability.'
),
(
  'ed000000-0000-0000-0000-000000000004',
  'TOLAND Heavyweight Denim Trucker Jacket',
  'toland-heavyweight-denim-trucker-jacket',
  'Rugged 14oz indigo denim trucker jacket featuring dual chest flap pockets, waist cinches, and copper shank buttons. Cut and stitched in our Bihar factory with industrial grade thread.',
  (select id from public.categories where slug = 'casual-jackets-shirts' limit 1),
  2199.00,
  4499.00,
  12,
  '620140',
  true,
  true,
  'TOLAND Heavyweight Denim Trucker Jacket | Direct From Factory',
  'All-season 14oz denim trucker jacket with heavy duty hardware and dual pockets.'
)
on conflict (id) do nothing;

-- 3. Product Variants (Sizes & Fits)
-- Variants for Raw Selvedge Slim Fit
insert into public.product_variants (product_id, sku, size, fit, color, wash, price, stock_qty) values
('ed000000-0000-0000-0000-000000000001', 'TLD-SLM-RAW-28', '28', 'Slim', 'Indigo', 'Raw', 1499.00, 45),
('ed000000-0000-0000-0000-000000000001', 'TLD-SLM-RAW-30', '30', 'Slim', 'Indigo', 'Raw', 1499.00, 60),
('ed000000-0000-0000-0000-000000000001', 'TLD-SLM-RAW-32', '32', 'Slim', 'Indigo', 'Raw', 1499.00, 75),
('ed000000-0000-0000-0000-000000000001', 'TLD-SLM-RAW-34', '34', 'Slim', 'Indigo', 'Raw', 1499.00, 50),
('ed000000-0000-0000-0000-000000000001', 'TLD-SLM-RAW-36', '36', 'Slim', 'Indigo', 'Raw', 1499.00, 30),
('ed000000-0000-0000-0000-000000000001', 'TLD-SLM-RAW-38', '38', 'Slim', 'Indigo', 'Raw', 1499.00, 20)
on conflict (sku) do nothing;

-- Variants for Mid-Blue Stonewash Straight
insert into public.product_variants (product_id, sku, size, fit, color, wash, price, stock_qty) values
('ed000000-0000-0000-0000-000000000002', 'TLD-STR-MID-28', '28', 'Regular', 'Mid Blue', 'Medium', 1299.00, 35),
('ed000000-0000-0000-0000-000000000002', 'TLD-STR-MID-30', '30', 'Regular', 'Mid Blue', 'Medium', 1299.00, 55),
('ed000000-0000-0000-0000-000000000002', 'TLD-STR-MID-32', '32', 'Regular', 'Mid Blue', 'Medium', 1299.00, 70),
('ed000000-0000-0000-0000-000000000002', 'TLD-STR-MID-34', '34', 'Regular', 'Mid Blue', 'Medium', 1299.00, 45),
('ed000000-0000-0000-0000-000000000002', 'TLD-STR-MID-36', '36', 'Regular', 'Mid Blue', 'Medium', 1299.00, 25)
on conflict (sku) do nothing;

-- Variants for Jet Black Stretch
insert into public.product_variants (product_id, sku, size, fit, color, wash, price, stock_qty) values
('ed000000-0000-0000-0000-000000000003', 'TLD-SLM-BLK-30', '30', 'Slim', 'Jet Black', 'Dark', 1399.00, 40),
('ed000000-0000-0000-0000-000000000003', 'TLD-SLM-BLK-32', '32', 'Slim', 'Jet Black', 'Dark', 1399.00, 65),
('ed000000-0000-0000-0000-000000000003', 'TLD-SLM-BLK-34', '34', 'Slim', 'Jet Black', 'Dark', 1399.00, 50),
('ed000000-0000-0000-0000-000000000003', 'TLD-SLM-BLK-36', '36', 'Slim', 'Jet Black', 'Dark', 1399.00, 30)
on conflict (sku) do nothing;

-- Variants for Trucker Jacket
insert into public.product_variants (product_id, sku, size, fit, color, wash, price, stock_qty) values
('ed000000-0000-0000-0000-000000000004', 'TLD-JCK-IND-M', 'M', 'Regular', 'Indigo', 'Dark', 2199.00, 25),
('ed000000-0000-0000-0000-000000000004', 'TLD-JCK-IND-L', 'L', 'Regular', 'Indigo', 'Dark', 2199.00, 35),
('ed000000-0000-0000-0000-000000000004', 'TLD-JCK-IND-XL', 'XL', 'Regular', 'Indigo', 'Dark', 2199.00, 20)
on conflict (sku) do nothing;

-- 4. Launch Coupons
insert into public.coupons (code, type, value, min_amount, usage_limit, is_active) values
('TOLAND10', 'percentage', 10, 999.00, 1000, true),
('FLAT200', 'fixed', 200, 1499.00, 500, true)
on conflict (code) do nothing;
