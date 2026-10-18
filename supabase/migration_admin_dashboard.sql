-- ==========================================================
-- FLEURS: ADMIN DASHBOARD SETUP
-- Run this ONCE in Supabase > SQL Editor.
--
-- BEFORE running it, create your staff login:
--   Supabase > Authentication > Users > Add user > Create new user
--   (type an email + password and tick "Auto Confirm User").
-- Everyone who has a login when you run this becomes staff.
--
-- What it does:
--   1. Adds a private staff list + an is_staff() check.
--   2. Adds create_kiosk_order(): the ONLY way the kiosk can save an
--      order (all-or-nothing, prices taken from the products table).
--   3. Locks the tables: the kiosk can no longer read or change
--      orders directly. Only signed-in staff can read/update orders
--      and edit products. The kiosk can still read products.
-- Existing products and orders are NOT changed or deleted.
-- ==========================================================


-- 1. STAFF LIST ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- No policies on purpose: nobody can read or edit this list through the API
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- Everyone who already has a login right now becomes staff
INSERT INTO public.staff_users (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.staff_users WHERE user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;


-- 2. KIOSK ORDER FUNCTION ------------------------------------
CREATE OR REPLACE FUNCTION public.create_kiosk_order(
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_customer_section TEXT,
    p_payment_reference TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item JSONB;
    v_qty INTEGER;
    v_product RECORD;
    v_lines JSONB := '[]'::jsonb;
    v_total NUMERIC(10, 2) := 0;
    v_subtotal NUMERIC(10, 2);
    v_order_id UUID;
    v_order_number TEXT;
    v_created_at TIMESTAMPTZ;
    v_attempts INTEGER := 0;
BEGIN
    IF coalesce(btrim(p_customer_name), '') = ''
       OR coalesce(btrim(p_customer_email), '') = ''
       OR coalesce(btrim(p_customer_phone), '') = ''
       OR coalesce(btrim(p_customer_section), '') = '' THEN
        RAISE EXCEPTION 'Customer information is required';
    END IF;

    IF coalesce(btrim(p_payment_reference), '') = '' THEN
        RAISE EXCEPTION 'Payment reference number is required';
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'The order has no items';
    END IF;

    -- Build the order lines using the real prices from the products table
    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
        v_qty := (v_item ->> 'quantity')::INTEGER;
        IF v_qty IS NULL OR v_qty < 1 OR v_qty > 100 THEN
            RAISE EXCEPTION 'Invalid quantity';
        END IF;

        SELECT p.id, p.name, p.price INTO v_product
        FROM public.products p
        WHERE p.id = (v_item ->> 'product_id') AND p.is_active = TRUE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not available: %', coalesce(v_item ->> 'product_id', '?');
        END IF;

        v_subtotal := round(v_product.price * v_qty, 2);
        v_total := v_total + v_subtotal;
        v_lines := v_lines || jsonb_build_array(jsonb_build_object(
            'product_id', v_product.id,
            'product_name', v_product.name,
            'quantity', v_qty,
            'unit_price', v_product.price,
            'subtotal', v_subtotal
        ));
    END LOOP;

    -- Save the order (retry if the random order number is already taken)
    LOOP
        v_attempts := v_attempts + 1;
        v_order_number := '#' || (100000 + floor(random() * 900000))::INTEGER::TEXT;
        BEGIN
            INSERT INTO public.orders (
                order_number, customer_name, customer_email, customer_phone,
                customer_section, payment_reference, total_amount, status, payment_status
            ) VALUES (
                v_order_number,
                left(btrim(p_customer_name), 100),
                left(btrim(p_customer_email), 254),
                left(btrim(p_customer_phone), 30),
                left(btrim(p_customer_section), 60),
                left(btrim(p_payment_reference), 50),
                v_total,
                'pending',
                'payment_submitted'
            )
            RETURNING id, created_at INTO v_order_id, v_created_at;
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            IF v_attempts >= 10 THEN
                RAISE EXCEPTION 'Could not generate an order number, please try again';
            END IF;
        END;
    END LOOP;

    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
    SELECT
        v_order_id,
        l ->> 'product_id',
        l ->> 'product_name',
        (l ->> 'quantity')::INTEGER,
        (l ->> 'unit_price')::NUMERIC,
        (l ->> 'subtotal')::NUMERIC
    FROM jsonb_array_elements(v_lines) AS l;

    RETURN jsonb_build_object(
        'id', v_order_id,
        'order_number', v_order_number,
        'total_amount', v_total,
        'status', 'pending',
        'payment_status', 'payment_submitted',
        'created_at', v_created_at,
        'order_items', v_lines
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_kiosk_order(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_kiosk_order(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;


-- 3. LOCK THE TABLES ------------------------------------------
-- Remove the old "anyone can do anything" policies
DROP POLICY IF EXISTS "Public read active products" ON public.products;
DROP POLICY IF EXISTS "Allow insert products" ON public.products;
DROP POLICY IF EXISTS "Allow update products" ON public.products;
DROP POLICY IF EXISTS "Allow delete products" ON public.products;
DROP POLICY IF EXISTS "Allow insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow select orders" ON public.orders;
DROP POLICY IF EXISTS "Allow update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow select order_items" ON public.order_items;

-- (also drop the new ones first so this script can be re-run safely)
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Staff insert products" ON public.products;
DROP POLICY IF EXISTS "Staff update products" ON public.products;
DROP POLICY IF EXISTS "Staff delete products" ON public.products;
DROP POLICY IF EXISTS "Staff read orders" ON public.orders;
DROP POLICY IF EXISTS "Staff update orders" ON public.orders;
DROP POLICY IF EXISTS "Staff read order_items" ON public.order_items;

-- Products: the kiosk can read; only staff can change
CREATE POLICY "Public read products" ON public.products
    FOR SELECT USING (true);
CREATE POLICY "Staff insert products" ON public.products
    FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff update products" ON public.products
    FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "Staff delete products" ON public.products
    FOR DELETE TO authenticated USING (public.is_staff());

-- Orders: only staff can read and update (the kiosk saves through create_kiosk_order)
CREATE POLICY "Staff read orders" ON public.orders
    FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff update orders" ON public.orders
    FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "Staff read order_items" ON public.order_items
    FOR SELECT TO authenticated USING (public.is_staff());

-- Make the API pick up the new functions right away
NOTIFY pgrst, 'reload schema';
