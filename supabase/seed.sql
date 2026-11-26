-- ==============================================================================
-- TOLAND INITIAL SEED DATA
-- ==============================================================================

-- 1. Initial Admin Allowlist
insert into public.admin_allowlist (phone, role, notes) values
('+918797186001', 'admin', 'Primary Owner Administrator'),
('+919876543210', 'admin', 'Primary Administrator'),
('+919999999999', 'staff', 'Operations Staff')
on conflict (phone) do update set role = excluded.role;

-- 2. Core Denim Categories
insert into public.categories (name, slug, sort, is_active) values
('Men''s Jeans', 'mens-jeans', 1, true),
('Slim Fit Denim', 'slim-fit-denim', 2, true),
('Regular Straight', 'regular-straight', 3, true),
('Casual Jackets & Shirts', 'casual-jackets-shirts', 4, true)
on conflict (slug) do nothing;
