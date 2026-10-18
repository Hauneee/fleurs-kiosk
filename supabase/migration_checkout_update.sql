-- ==========================================================
-- FLEURS KIOSK: CHECKOUT UPDATE (customer info + payment status)
-- Run this ONCE in Supabase > SQL Editor.
-- Safe to run: it only ADDS columns. Existing products, orders
-- and order items are not changed or deleted.
-- (Do NOT re-run the old schema.sql, it drops your tables.)
-- ==========================================================

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_name TEXT,
    ADD COLUMN IF NOT EXISTS customer_email TEXT,
    ADD COLUMN IF NOT EXISTS customer_phone TEXT,
    ADD COLUMN IF NOT EXISTS customer_section TEXT,
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('unpaid', 'payment_submitted', 'paid', 'refunded'));

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Make the API pick up the new columns right away
NOTIFY pgrst, 'reload schema';
