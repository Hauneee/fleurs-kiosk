-- ==========================================================
-- FLEURS KIOSK: PAYMENT REFERENCE NUMBER
-- Run this ONCE in Supabase > SQL Editor.
-- It only ADDS one column. Nothing is changed or deleted.
-- ==========================================================

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);

-- Make the API pick up the new column right away
NOTIFY pgrst, 'reload schema';
