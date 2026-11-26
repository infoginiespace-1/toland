-- ==============================================================================
-- TOLAND ERP Manufacturing Seed Migration
-- Seeds Suppliers, Raw Materials, BOMs, and Initial Production Orders
-- ==============================================================================

-- 1. SEED SUPPLIERS
insert into public.suppliers (id, name, contact_person, phone, email, gst_number, address)
values
  (
    'ba000000-0000-0000-0000-000000000001',
    'Arvind Mills Ltd. (Denim Division)',
    'Rajesh Verma',
    '+919825012345',
    'sales.denim@arvindmills.com',
    '24AAACA1234F1Z5',
    'Naroda Road, Ahmedabad, Gujarat - 380025'
  ),
  (
    'ba000000-0000-0000-0000-000000000002',
    'YKK India Pvt. Ltd.',
    'Siddharth Nair',
    '+919810054321',
    'orders@ykkindia.com',
    '06AAACY5678B1Z2',
    'Plot 699, Sector 3, HSIIDC Growth Centre, Bawal, Haryana - 123501'
  ),
  (
    'ba000000-0000-0000-0000-000000000003',
    'Vardhman Yarns & Threads Ltd.',
    'Gurpreet Singh',
    '+919876098765',
    'threads@vardhman.com',
    '03AAACV9876C1Z9',
    'Chandigarh Road, Ludhiana, Punjab - 141010'
  ),
  (
    'ba000000-0000-0000-0000-000000000004',
    'TOLAND National Trims & Packaging',
    'Anil K. Sharma',
    '+919431011223',
    'supplies@tolandtrims.in',
    '10AABCT9988D1Z4',
    'Boring Road Industrial Estate, Patna, Bihar - 800001'
  )
on conflict (id) do nothing;

-- 2. SEED RAW MATERIALS
insert into public.raw_materials (id, name, type, unit, stock_qty, reorder_level, unit_price)
values
  (
    'fa000000-0000-0000-0000-000000000001',
    '13.5 oz Raw Ring-Spun Cotton Denim (Indigo)',
    'fabric',
    'meters',
    3200.000,
    500.000,
    215.00
  ),
  (
    'fa000000-0000-0000-0000-000000000002',
    '12.0 oz Comfort Stretch Denim (Deep Black)',
    'fabric',
    'meters',
    2150.000,
    400.000,
    235.00
  ),
  (
    'fa000000-0000-0000-0000-000000000003',
    'Heavy-Duty Poly-Core Denim Thread (Golden Amber)',
    'thread',
    'cones',
    140.000,
    30.000,
    185.00
  ),
  (
    'fa000000-0000-0000-0000-000000000004',
    'Antique Brass Shank Button (17mm TOLAND Engraved)',
    'button',
    'pieces',
    18500.000,
    3000.000,
    3.80
  ),
  (
    'fa000000-0000-0000-0000-000000000005',
    'Copper Rivets (9mm Reinforced Pocket Trim)',
    'button',
    'pieces',
    42000.000,
    5000.000,
    1.25
  ),
  (
    'fa000000-0000-0000-0000-000000000006',
    'YKK #5 Antique Brass Zipper (5.5 Inch)',
    'zip',
    'pieces',
    5200.000,
    1000.000,
    18.50
  ),
  (
    'fa000000-0000-0000-0000-000000000007',
    'Genuine Buffalo Leather Waistband Patch',
    'label',
    'pieces',
    6400.000,
    1500.000,
    14.00
  ),
  (
    'fa000000-0000-0000-0000-000000000008',
    'Woven Damask Washcare & Size Labels',
    'label',
    'pieces',
    12000.000,
    2000.000,
    1.80
  ),
  (
    'fa000000-0000-0000-0000-000000000009',
    'Heavy-Duty Corrugated Cartons (50 Pcs Capacity)',
    'packaging',
    'pieces',
    350.000,
    50.000,
    95.00
  )
on conflict (id) do nothing;

-- 3. SEED INITIAL BILL OF MATERIALS (BOM) FOR CLASSIC RAW DENIM
-- Product ID: 'ed000000-0000-0000-0000-000000000001'
insert into public.boms (id, product_id, raw_material_id, qty_per_piece)
values
  ('ca000000-0000-0000-0000-000000000001', 'ed000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000001', 1.4500), -- 1.45 meters fabric
  ('ca000000-0000-0000-0000-000000000002', 'ed000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000003', 0.0500), -- 0.05 cone thread
  ('ca000000-0000-0000-0000-000000000003', 'ed000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000004', 1.0000), -- 1 shank button
  ('ca000000-0000-0000-0000-000000000004', 'ed000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000005', 5.0000), -- 5 copper rivets
  ('ca000000-0000-0000-0000-000000000005', 'ed000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000006', 1.0000), -- 1 YKK zip
  ('ca000000-0000-0000-0000-000000000006', 'ed000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000007', 1.0000), -- 1 leather patch
  ('ca000000-0000-0000-0000-000000000007', 'ed000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000008', 2.0000)  -- 2 labels
on conflict (product_id, raw_material_id) do nothing;

-- 4. SEED INITIAL PRODUCTION BATCH (LOT #TLD-PRD-2026-001)
insert into public.production_orders (id, order_no, product_id, planned_qty, completed_qty, status, notes)
values
  (
    'da000000-0000-0000-0000-000000000001',
    'TLD-PRD-2026-001',
    'ed000000-0000-0000-0000-000000000001',
    500,
    180,
    'in_progress',
    'Batch 1 of 13.5 oz Raw Selvedge Denim. Target delivery for national retail inventory.'
  )
on conflict (id) do nothing;

-- Seed Stages for Production Order 1
insert into public.production_stages (production_order_id, stage, qty_in, qty_out, wastage, assigned_to, started_at, ended_at)
values
  ('da000000-0000-0000-0000-000000000001', 'cutting', 500, 492, 8, 'Masterji Ramesh (Cutting Table 1)', now() - interval '3 days', now() - interval '2 days'),
  ('da000000-0000-0000-0000-000000000001', 'stitching', 492, 485, 7, 'Stitching Line A (12 Machines)', now() - interval '2 days', now() - interval '1 day'),
  ('da000000-0000-0000-0000-000000000001', 'washing', 485, 485, 0, 'Stone Enzyme Washing Unit 2', now() - interval '1 day', now() - interval '8 hours'),
  ('da000000-0000-0000-0000-000000000001', 'finishing', 485, 300, 2, 'Rivet & Button Station B', now() - interval '8 hours', null),
  ('da000000-0000-0000-0000-000000000001', 'packing', 300, 180, 0, 'Packing & Tagging Station', now() - interval '2 hours', null);

-- 5. SEED B2B WHOLESALE PRICE TIERS
insert into public.b2b_price_tiers (product_id, min_qty, price)
values
  ('ed000000-0000-0000-0000-000000000001', 50, 780.00),
  ('ed000000-0000-0000-0000-000000000001', 200, 720.00),
  ('ed000000-0000-0000-0000-000000000001', 500, 680.00),
  ('ed000000-0000-0000-0000-000000000002', 50, 890.00),
  ('ed000000-0000-0000-0000-000000000002', 200, 830.00),
  ('ed000000-0000-0000-0000-000000000002', 500, 780.00)
on conflict (product_id, min_qty) do nothing;
