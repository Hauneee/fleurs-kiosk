-- ==========================================================
-- FLEURS: TRACK MY ORDER
-- Run this ONCE in Supabase > SQL Editor > New query.
-- (Run migration_admin_dashboard.sql first - you already did.)
--
-- Adds track_order(): the kiosk gives it an order number AND the
-- phone number used on that order. It returns ONLY the status,
-- payment status, items and total. It never returns the customer's
-- name, email, phone or receipt reference, and it does not open the
-- orders table to the public. Nothing existing is changed or deleted.
-- ==========================================================

CREATE OR REPLACE FUNCTION public.track_order(
    p_order_number TEXT,
    p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_number TEXT;
    v_phone TEXT;
    v_order RECORD;
    v_items JSONB;
BEGIN
    -- Keep digits only, so "#123456", "123456" and " 123456 " all match
    v_number := '#' || regexp_replace(coalesce(p_order_number, ''), '\D', '', 'g');
    v_phone  := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');

    IF length(v_number) < 2 OR length(v_phone) < 7 THEN
        RETURN NULL;
    END IF;

    -- Compare the last 10 digits of the phone, so 09171234567 and +639171234567 both match
    SELECT o.id, o.order_number, o.status, o.payment_status, o.total_amount, o.created_at
    INTO v_order
    FROM public.orders o
    WHERE o.order_number = v_number
      AND right(regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g'), 10) = right(v_phone, 10)
    LIMIT 1;

    -- A wrong order number and a wrong phone number give the same answer (NULL)
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT coalesce(jsonb_agg(jsonb_build_object(
               'product_name', i.product_name,
               'quantity', i.quantity,
               'subtotal', i.subtotal
           )), '[]'::jsonb)
    INTO v_items
    FROM public.order_items i
    WHERE i.order_id = v_order.id;

    RETURN jsonb_build_object(
        'order_number', v_order.order_number,
        'status', v_order.status,
        'payment_status', v_order.payment_status,
        'total_amount', v_order.total_amount,
        'created_at', v_order.created_at,
        'order_items', v_items
    );
END;
$$;

REVOKE ALL ON FUNCTION public.track_order(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(TEXT, TEXT) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
