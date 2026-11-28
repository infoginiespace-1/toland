-- ==============================================================================
-- TOLAND DATABASE SCHEMA — Migration: ERP & Manufacturing Phase 1 + Phase 2
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEQUENTIAL DOCUMENT NUMBER GENERATORS (Replacing Math.random())
-- ------------------------------------------------------------------------------
create sequence if not exists public.production_order_seq start 1;
create sequence if not exists public.purchase_order_seq start 1;
create sequence if not exists public.job_work_challan_seq start 1;
create sequence if not exists public.wholesale_order_seq start 1;
create sequence if not exists public.qc_inspection_seq start 1;

do $$
declare
  prd_count bigint;
  po_count bigint;
begin
  select coalesce(count(*), 0) into prd_count from public.production_orders;
  if prd_count > 0 then
    perform setval('public.production_order_seq', prd_count);
  end if;

  select coalesce(count(*), 0) into po_count from public.purchase_orders;
  if po_count > 0 then
    perform setval('public.purchase_order_seq', po_count);
  end if;
end $$;

create or replace function public.next_erp_doc_no(doc_type text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  yr text := to_char(now(), 'YYYY');
  seq_val bigint;
begin
  if doc_type = 'PRD' then
    seq_val := nextval('public.production_order_seq');
    return 'TLD-PRD-' || yr || '-' || lpad(seq_val::text, 4, '0');
  elsif doc_type = 'PO' then
    seq_val := nextval('public.purchase_order_seq');
    return 'TLD-PO-' || yr || '-' || lpad(seq_val::text, 4, '0');
  elsif doc_type = 'JW' then
    seq_val := nextval('public.job_work_challan_seq');
    return 'TLD-JW-' || yr || '-' || lpad(seq_val::text, 4, '0');
  elsif doc_type = 'B2B' then
    seq_val := nextval('public.wholesale_order_seq');
    return 'TLD-B2B-' || yr || '-' || lpad(seq_val::text, 4, '0');
  elsif doc_type = 'QC' then
    seq_val := nextval('public.qc_inspection_seq');
    return 'TLD-QC-' || yr || '-' || lpad(seq_val::text, 4, '0');
  else
    raise exception 'Unsupported ERP doc_type: %', doc_type;
  end if;
end;
$$;

-- ------------------------------------------------------------------------------
-- 2. PHASE 1 UPGRADES TO EXISTING ERP TABLES
-- ------------------------------------------------------------------------------

-- Raw materials: roll lot, GSM, and denim shade tracking
alter table public.raw_materials
  add column if not exists batch_lot_no text,
  add column if not exists gsm numeric(6, 2),
  add column if not exists shade text;

-- BOMs: cutting/sewing scrap allowance (%)
alter table public.boms
  add column if not exists scrap_percent numeric(5, 2) not null default 0.00;

-- Products: stitching labor & overhead cost per piece for true landed COGS
alter table public.products
  add column if not exists labor_cost_per_piece numeric(10, 2) not null default 0.00,
  add column if not exists overhead_cost_per_piece numeric(10, 2) not null default 0.00;

-- Purchase orders: partial GRN status, supplier invoice, GST, payment tracking
alter table public.purchase_orders
  drop constraint if exists purchase_orders_status_check;

alter table public.purchase_orders
  add constraint purchase_orders_status_check
  check (status in ('draft', 'ordered', 'partial', 'received', 'cancelled'));

alter table public.purchase_orders
  add column if not exists supplier_invoice_no text,
  add column if not exists gst_amount numeric(12, 2) not null default 0.00,
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists paid_amount numeric(12, 2) not null default 0.00,
  add column if not exists expected_date date,
  add column if not exists notes text;

alter table public.purchase_orders
  drop constraint if exists purchase_orders_payment_status_check;

alter table public.purchase_orders
  add constraint purchase_orders_payment_status_check
  check (payment_status in ('unpaid', 'partial', 'paid'));

-- Purchase order items: track partial received quantity
alter table public.purchase_order_items
  add column if not exists received_qty numeric(12, 3) not null default 0.000;

update public.purchase_order_items i
set received_qty = i.qty
from public.purchase_orders p
where i.purchase_order_id = p.id
  and p.status = 'received'
  and i.received_qty = 0;

-- Production orders: multi-size ratio allocations, shortfall flag, exact consumed material snapshot
alter table public.production_orders
  add column if not exists size_allocations jsonb not null default '[]'::jsonb,
  add column if not exists allow_shortfall boolean not null default false,
  add column if not exists consumed_materials jsonb not null default '[]'::jsonb;

-- ------------------------------------------------------------------------------
-- 3. PHASE 2 NEW FACTORY MODULES
-- ------------------------------------------------------------------------------

-- 3A. Quality Control & Defect / Rework Inspection
create table if not exists public.erp_qc_inspections (
  id uuid primary key default gen_random_uuid(),
  qc_no text not null unique,
  inspection_type text not null default 'stage' check (inspection_type in ('fabric_roll', 'stage', 'final_garment')),
  production_order_id uuid references public.production_orders(id) on delete set null,
  raw_material_id uuid references public.raw_materials(id) on delete set null,
  stage_name text,
  inspected_qty int not null default 0 check (inspected_qty >= 0),
  pass_qty int not null default 0 check (pass_qty >= 0),
  rework_qty int not null default 0 check (rework_qty >= 0),
  reject_qty int not null default 0 check (reject_qty >= 0),
  defect_reason text,
  gsm_actual numeric(6, 2),
  shrinkage_pct numeric(5, 2),
  inspector_name text,
  status text not null default 'passed' check (status in ('passed', 'rework_required', 'failed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3B. Karigars & Job-Work Vendors
create table if not exists public.erp_karigars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  department text not null default 'stitching' check (department in ('cutting', 'stitching', 'washing', 'embroidery', 'finishing', 'packing')),
  rate_per_piece numeric(10, 2) not null default 0.00 check (rate_per_piece >= 0),
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3C. Outwork / Job-Work Challans
create table if not exists public.erp_job_work_challans (
  id uuid primary key default gen_random_uuid(),
  challan_no text not null unique,
  karigar_id uuid not null references public.erp_karigars(id) on delete restrict,
  production_order_id uuid references public.production_orders(id) on delete set null,
  process_stage text not null default 'stitching' check (process_stage in ('cutting', 'stitching', 'washing', 'embroidery', 'finishing', 'packing')),
  qty_issued int not null check (qty_issued > 0),
  qty_returned int not null default 0 check (qty_returned >= 0),
  qty_rejected int not null default 0 check (qty_rejected >= 0),
  rate_per_piece numeric(10, 2) not null default 0.00 check (rate_per_piece >= 0),
  total_wage numeric(12, 2) not null default 0.00,
  paid_amount numeric(12, 2) not null default 0.00,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid')),
  status text not null default 'issued' check (status in ('issued', 'partial_return', 'completed', 'cancelled')),
  issued_date date not null default current_date,
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3D. B2B Proforma Quotes, Wholesale Orders & Buyer Credit Khata
create table if not exists public.erp_wholesale_orders (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null unique,
  buyer_name text not null,
  buyer_company text,
  buyer_phone text not null,
  buyer_gst text,
  buyer_address text,
  customer_crm_id uuid references public.customers_crm(id) on delete set null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null default 0.00,
  gst_percent numeric(5, 2) not null default 12.00,
  gst_amount numeric(12, 2) not null default 0.00,
  total_amount numeric(12, 2) not null default 0.00,
  paid_amount numeric(12, 2) not null default 0.00,
  credit_limit numeric(12, 2) not null default 0.00,
  payment_terms text not null default 'Net 15 Days',
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid')),
  status text not null default 'quote' check (status in ('quote', 'confirmed', 'dispatched', 'cancelled')),
  stock_deducted boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 4. RLS POLICIES & UPDATED_AT TRIGGERS
-- ------------------------------------------------------------------------------
alter table public.erp_qc_inspections enable row level security;
alter table public.erp_karigars enable row level security;
alter table public.erp_job_work_challans enable row level security;
alter table public.erp_wholesale_orders enable row level security;

drop policy if exists "Admins and staff manage erp_qc_inspections" on public.erp_qc_inspections;
create policy "Admins and staff manage erp_qc_inspections"
  on public.erp_qc_inspections for all using (public.is_admin());

drop policy if exists "Admins and staff manage erp_karigars" on public.erp_karigars;
create policy "Admins and staff manage erp_karigars"
  on public.erp_karigars for all using (public.is_admin());

drop policy if exists "Admins and staff manage erp_job_work_challans" on public.erp_job_work_challans;
create policy "Admins and staff manage erp_job_work_challans"
  on public.erp_job_work_challans for all using (public.is_admin());

drop policy if exists "Admins and staff manage erp_wholesale_orders" on public.erp_wholesale_orders;
create policy "Admins and staff manage erp_wholesale_orders"
  on public.erp_wholesale_orders for all using (public.is_admin());

create or replace trigger set_erp_qc_inspections_updated_at
  before update on public.erp_qc_inspections
  for each row execute function public.handle_updated_at();

create or replace trigger set_erp_karigars_updated_at
  before update on public.erp_karigars
  for each row execute function public.handle_updated_at();

create or replace trigger set_erp_job_work_challans_updated_at
  before update on public.erp_job_work_challans
  for each row execute function public.handle_updated_at();

create or replace trigger set_erp_wholesale_orders_updated_at
  before update on public.erp_wholesale_orders
  for each row execute function public.handle_updated_at();
