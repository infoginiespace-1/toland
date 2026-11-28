-- ==============================================================================
-- TOLAND DATABASE SCHEMA — Migration 15: UPI Payment & Payment Status Constraints
-- ==============================================================================

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check check (payment_method in ('razorpay', 'cod', 'upi'));

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check check (payment_status in ('pending', 'paid', 'completed', 'failed', 'refunded'));
