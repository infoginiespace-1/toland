-- ==============================================================================
-- TOLAND CRM & WhatsApp Automation Seed Migration
-- Seeds Customers CRM, B2B Leads Pipeline, Follow-ups, Activities, & WhatsApp Campaign Rules
-- ==============================================================================

-- 1. SEED CUSTOMERS CRM
insert into public.customers_crm (id, phone, name, source, tags, stage, notes, opt_in_whatsapp)
values
  (
    'ea000000-0000-0000-0000-000000000001',
    '+919811122233',
    'Priya Sharma',
    'storefront',
    array['vip', 'selvedge_lover', 'repeat_buyer'],
    'vip',
    'Purchased 3 pairs of 13.5 oz Raw Denim. Requested custom inseam 30 on next batch.',
    true
  ),
  (
    'ea000000-0000-0000-0000-000000000002',
    '+919822233344',
    'Rohit Patel',
    'storefront',
    array['active_buyer', 'stretch_denim'],
    'active_buyer',
    'Prefers Comfort Stretch Deep Black, Size 34. Always orders via UPI.',
    true
  ),
  (
    'ea000000-0000-0000-0000-000000000003',
    '+919833344455',
    'Amit Verma',
    'storefront',
    array['storefront', 'first_order'],
    'active_buyer',
    'Bought Vintage Stone Wash Denim from Instagram ad. Positive sizing feedback.',
    true
  ),
  (
    'ea000000-0000-0000-0000-000000000004',
    '+919844455566',
    'Sheikhpura Denim Mart (Manoj Kumar)',
    'b2b_portal',
    array['wholesale', 'bihar_stockist', 'repeat_buyer'],
    'vip',
    'Regional retail distributor in Sheikhpura town. Regular 200 pcs volume buyer.',
    true
  ),
  (
    'ea000000-0000-0000-0000-000000000005',
    '+919855566677',
    'Patna Cloth Merchants (Rajiv Singhania)',
    'website_b2b',
    array['b2b', 'distributor', 'in_negotiation'],
    'prospect',
    'Requested physical fabric swatch kit for 500 pcs festive booking.',
    true
  ),
  (
    'ea000000-0000-0000-0000-000000000006',
    '+919866677788',
    'Kolkata Jeans Emporium (Debabrata Sen)',
    'referral',
    array['wholesale', 'eastern_region'],
    'lead',
    'Met at East India Apparel Expo. Interested in private label OEM selvedge manufacturing.',
    true
  )
on conflict (id) do nothing;

-- 2. SEED B2B LEADS PIPELINE
insert into public.leads (id, name, phone, source, stage, value, next_followup_at)
values
  (
    'eb000000-0000-0000-0000-000000000001',
    'Metro Apparels Delhi (Gaurav Gupta)',
    '+919877788899',
    'website_b2b',
    'new',
    150000.00,
    now() + interval '1 day'
  ),
  (
    'eb000000-0000-0000-0000-000000000002',
    'Patna Cloth Merchants (Rajiv Singhania)',
    '+919888899900',
    'website_b2b',
    'contacted',
    350000.00,
    now() + interval '2 days'
  ),
  (
    'eb000000-0000-0000-0000-000000000003',
    'Ranchi Jeans House (Sunil Mahto)',
    '+919899900011',
    'whatsapp_inquiry',
    'sample_sent',
    200000.00,
    now() + interval '3 days'
  ),
  (
    'eb000000-0000-0000-0000-000000000004',
    'Barbigha Youth Wear (Rakesh Kumar)',
    '+919812345678',
    'storefront',
    'negotiation',
    95000.00,
    now() + interval '6 hours'
  ),
  (
    'eb000000-0000-0000-0000-000000000005',
    'Sheikhpura Denim Mart (Manoj Kumar)',
    '+919844455566',
    'website_b2b',
    'converted',
    480000.00,
    null
  ),
  (
    'eb000000-0000-0000-0000-000000000006',
    'Kanpur Casuals & Trims (Vikram Singh)',
    '+919823456789',
    'trade_show',
    'lost',
    120000.00,
    null
  )
on conflict (id) do nothing;

-- 3. SEED SCHEDULED FOLLOW-UPS
insert into public.followups (id, lead_id, customer_id, due_at, note, done)
values
  (
    'ec000000-0000-0000-0000-000000000001',
    'eb000000-0000-0000-0000-000000000003',
    'ea000000-0000-0000-0000-000000000005',
    now() + interval '1 day',
    'Call Sunil Mahto: Confirm safe courier delivery of 13.5oz Indigo swatches and feedback.',
    false
  ),
  (
    'ec000000-0000-0000-0000-000000000002',
    'eb000000-0000-0000-0000-000000000004',
    null,
    now() + interval '6 hours',
    'Send final wholesale invoice draft for 100 pcs Barbigha order at ₹780/pc with GST.',
    false
  ),
  (
    'ec000000-0000-0000-0000-000000000003',
    'eb000000-0000-0000-0000-000000000001',
    null,
    now() + interval '2 days',
    'Introductory WhatsApp demo: Share video walkthrough of Khetalpura manufacturing facility.',
    false
  ),
  (
    'ec000000-0000-0000-0000-000000000004',
    null,
    'ea000000-0000-0000-0000-000000000001',
    now() - interval '2 days',
    'VIP Check-in: Inquire about fit satisfaction on Selvedge Jean order #TLD-ORD-2026-001.',
    true
  )
on conflict (id) do nothing;

-- 4. SEED CRM ACTIVITY LOGS
insert into public.activities (id, customer_id, lead_id, activity_type, description, metadata)
values
  (
    'ed000000-0000-0000-0000-000000000001',
    'ea000000-0000-0000-0000-000000000004',
    'eb000000-0000-0000-0000-000000000005',
    'order',
    'Placed 200 pcs wholesale booking for Classic Raw Denim Jeans.',
    jsonb_build_object('order_val', 144000, 'items', 200)
  ),
  (
    'ed000000-0000-0000-0000-000000000002',
    'ea000000-0000-0000-0000-000000000005',
    'eb000000-0000-0000-0000-000000000002',
    'message',
    'Dispatched physical sample pack via DTDC Express (AWB: DTDC88129031).',
    jsonb_build_object('courier', 'DTDC', 'awb', 'DTDC88129031')
  ),
  (
    'ed000000-0000-0000-0000-000000000003',
    'ea000000-0000-0000-0000-000000000001',
    null,
    'note',
    'Customer praised denim weight and Japanese shuttle loom stitching quality.',
    jsonb_build_object('sentiment', 'positive')
  ),
  (
    'ed000000-0000-0000-0000-000000000004',
    null,
    'eb000000-0000-0000-0000-000000000004',
    'status_change',
    'Lead advanced from "contacted" to "negotiation" after volume tier review.',
    jsonb_build_object('previous_stage', 'contacted', 'new_stage', 'negotiation')
  )
on conflict (id) do nothing;

-- 5. SEED WHATSAPP AUTOREPLY RULES
insert into public.wa_autoreply_rules (id, keyword, match_type, is_active)
values
  (
    'ee000000-0000-0000-0000-000000000001',
    'CATALOG',
    'exact',
    true
  ),
  (
    'ee000000-0000-0000-0000-000000000002',
    'RATE',
    'contains',
    true
  ),
  (
    'ee000000-0000-0000-0000-000000000003',
    'SAMPLE',
    'contains',
    true
  ),
  (
    'ee000000-0000-0000-0000-000000000004',
    'TRACK',
    'exact',
    true
  ),
  (
    'ee000000-0000-0000-0000-000000000005',
    'HELP',
    'exact',
    true
  )
on conflict (id) do nothing;

-- 6. SEED WHATSAPP CAMPAIGNS
insert into public.wa_campaigns (id, name, template_key, status, scheduled_at)
values
  (
    'ef000000-0000-0000-0000-000000000001',
    'Winter Selvedge Denim Launch 2026',
    'order_confirmed',
    'scheduled',
    now() + interval '2 days'
  ),
  (
    'ef000000-0000-0000-0000-000000000002',
    'B2B Wholesale Festive Booking Drive',
    'b2b_inquiry_received',
    'completed',
    now() - interval '5 days'
  ),
  (
    'ef000000-0000-0000-0000-000000000003',
    'VIP Customer Care & Reorder Assistance',
    'order_delivered',
    'running',
    now()
  )
on conflict (id) do nothing;
