-- TreadFlow: In-dashboard POS support
--
-- Same rules as prior migrations: review and run yourself.
-- POS "sales" reuse the invoices table from 20260720000005_invoices.sql
-- (doc_type = 'Receipt', status = 'Paid'), so this just adds the one column
-- POS needs that invoices/quotes don't: how the in-person payment was taken.

alter table public.invoices
  add column if not exists payment_method text; -- 'Cash' | 'Card' | 'Check' | 'Other'
