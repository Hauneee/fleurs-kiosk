-- ==========================================================
-- FLEURS BY BLOSSOMS CRAFT — SUPABASE DATABASE SCHEMA
-- PostgreSQL Schema for Flower Shop Kiosk & Admin Dashboard
-- ==========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 3. PRODUCTS TABLE
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('bouquet', 'solo-flower', 'triple-flower')),
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    stock INTEGER NOT NULL DEFAULT 50 CHECK (stock >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ORDER_ITEMS TABLE (Relational linkage to orders and products)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 6. INDEXES for High-Performance Kiosk Queries
CREATE INDEX idx_products_category ON products(category) WHERE is_active = TRUE;
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES FOR KIOSK (Public Anon Access for Kiosk Device)
-- Products: Anyone can read active products; Authenticated/Anon can read for admin
CREATE POLICY "Public read active products"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Allow insert products"
    ON products FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow update products"
    ON products FOR UPDATE
    USING (true);

CREATE POLICY "Allow delete products"
    ON products FOR DELETE
    USING (true);

-- Orders: Kiosk can insert new orders; Admin can read and update
CREATE POLICY "Allow insert orders"
    ON orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow select orders"
    ON orders FOR SELECT
    USING (true);

CREATE POLICY "Allow update orders"
    ON orders FOR UPDATE
    USING (true);

-- Order Items: Kiosk can insert; Admin can read
CREATE POLICY "Allow insert order_items"
    ON order_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow select order_items"
    ON order_items FOR SELECT
    USING (true);

-- 9. SUPABASE STORAGE BUCKET FOR PRODUCT IMAGES
-- (Run this in Supabase SQL editor or create via Storage dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access product-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

CREATE POLICY "Public Upload product-images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'product-images');

-- 10. SEED INITIAL PRODUCTS DATA
INSERT INTO products (id, name, category, description, price, stock, is_active) VALUES
-- BOUQUETS (Required 5 Products at ₱500)
('prod-bouquet-1', 'BLUE BOUQUET', 'bouquet', 'Exquisite handcrafted blue roses and hydrangea accents with artisanal wrapping and a signature satin navy bow.', 500.00, 25, true),
('prod-bouquet-2', 'RED BOUQUET', 'bouquet', 'Passionate velvet crimson roses with delicate baby’s breath wrapped in pastel blush paper and satin bow.', 500.00, 20, true),
('prod-bouquet-3', 'TULIP BOUQUET', 'bouquet', 'Charming blend of pastel pink, sunset coral, and golden sunshine Dutch tulips tied with a delicate silk ribbon.', 500.00, 18, true),
('prod-bouquet-4', 'PURPLE BOUQUET (ASSORTED)', 'bouquet', 'Enchanting arrangement of royal purple roses, French lavender spikes, and soft lilac blooms.', 500.00, 15, true),
('prod-bouquet-5', 'BROWN BOUQUET (ASSORTED)', 'bouquet', 'Warm rustic terracotta and amber dried florals with pampas accents, beige wraps, and an earthy chocolate bow.', 500.00, 12, true),

-- SOLO FLOWERS
('prod-solo-1', 'ROSE', 'solo-flower', 'Single premium stem fresh scarlet rose with fresh green foliage.', 120.00, 50, true),
('prod-solo-2', 'SUNFLOWER', 'solo-flower', 'Single radiant giant sunshine sunflower that brings instant joy.', 150.00, 40, true),
('prod-solo-3', 'TULIP', 'solo-flower', 'Single elegant pink Dutch tulip with long graceful stem.', 140.00, 35, true),
('prod-solo-4', 'LILY', 'solo-flower', 'Single fragrant pure white Oriental lily with star petals.', 160.00, 30, true),
('prod-solo-5', 'DAISY', 'solo-flower', 'Single cheerful English daisy with bright golden center.', 90.00, 60, true),
('prod-solo-6', 'CARNATION', 'solo-flower', 'Single ruffled soft pink carnation with sweet clove scent.', 110.00, 45, true),

-- TRIPLE FLOWERS
('prod-triple-1', 'TRIPLE ROSE ENSEMBLE', 'triple-flower', 'Three hand-picked long stem red roses hand-tied with a blue satin bow.', 320.00, 25, true),
('prod-triple-2', 'SUNFLOWER TRIO HARMONY', 'triple-flower', 'Trio of vibrant sunflowers bundled together with rustic kraft binding.', 380.00, 20, true),
('prod-triple-3', 'TULIP & LILY TRIO', 'triple-flower', 'Harmonious trio of pink and orange tulips embracing a pure white lily.', 390.00, 18, true),
('prod-triple-4', 'SPRING BLOSSOM TRIO', 'triple-flower', 'Pastel symphony featuring a daisy, rose, and carnation tied together.', 340.00, 15, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    stock = EXCLUDED.stock;
