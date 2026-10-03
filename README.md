# Fleurs by Blossoms Craft — Flower Shop Kiosk Application

> **“Handmade Flowers, Made With Love”**  
> A complete, responsive, touchscreen flower-shop kiosk application built with **React**, **Vite**, **Supabase PostgreSQL & Storage**, and prepared for packaging into desktop applications and **Android APKs** with **Tauri v2**.

---

## ✨ Features & Visual Design

- **Handcrafted Flower Shop Aesthetic**: Inspired by the deep navy background (`#0b1528`), light & medium blue panels, stitched/dashed border detailing, soft drop shadows, and delicate botanical butterflies and satin bows.
- **Kiosk-Optimized Touch Controls**:
  - Extra-large buttons, wide tap targets (minimum 56px–72px).
  - Designed specifically for touchscreens: zero hover dependencies, tactile tap states.
- **Complete End-to-End Customer Flow**:
  1. **HOME**: Beautiful landing showcase with *"START ORDER"*, floral artwork, and butterflies.
  2. **MENU**: Three large category buttons (**SOLO FLOWER**, **TRIPLE FLOWER**, **BOUQUET**) and persistent Cart badge.
  3. **BOUQUET**: Dedicated 2-column responsive kiosk grid matching the visual reference with top-right ₱500 price badges, white image containers, bottom title plates, and corner ribbons.
     - *Blue Bouquet* (₱500)
     - *Red Bouquet* (₱500)
     - *Tulip Bouquet* (₱500)
     - *Purple Bouquet (Assorted)* (₱500)
     - *Brown Bouquet (Assorted)* (₱500)
  4. **SOLO FLOWER**: Single stem elegance featuring Rose, Sunflower, Tulip, Lily, Daisy, and Carnation.
  5. **TRIPLE FLOWER**: Curated 3-stem artisan ensembles with descriptions.
  6. **PRODUCT SELECTION & QUANTITY**: Touchscreen quantity selector (`[ − ] 1 [ + ]`), *"ADD TO CART"* with real-time price updates, and non-blocking toast notification.
  7. **CART & CHECKOUT**: Review items, increase/decrease quantities, delete items, view live subtotals, and place orders.
  8. **ORDER CONFIRMATION**: Saves order to Supabase first, displays generated `#XXXXXX` order number, order item breakdown, total in ₱, date/time stamp, celebratory confetti, and *"NEW ORDER"* restart.
- **Staff Admin Dashboard**:
  - View real-time orders with statuses: `PENDING` → `CONFIRMED` → `COMPLETED` (or `CANCELLED`).
  - Auto-refreshing order feed from Supabase.
- **Inventory Management**:
  - Add, edit, and delete products in Supabase.
  - Modify stock levels, pricing, descriptions, and visibility toggle.
- **Offline & Fallback Resilience**:
  - Never loses an order: if internet or Supabase is temporarily unreachable, orders are preserved safely and cached locally with clear user-friendly notifications.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 5, Vanilla & Modular CSS, Lucide Icons, Canvas Confetti.
- **Backend**: Supabase (PostgreSQL, Row Level Security, Supabase JS Client, Supabase Storage for product images).
- **Packaging**: Tauri v2 for Desktop (Windows/macOS/Linux) and Android APK.

---

## 🚀 Getting Started

### 1. Run the Web Application (Development)

```bash
cd "C:\Users\HONOR MAGICBOOK\.gemini\antigravity\scratch\fleurs-kiosk"
npm install
npm run dev
```

Open `http://localhost:5173` in your browser or on your kiosk touchscreen.

---

## 🗄️ Supabase Backend Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `supabase/schema.sql` from this repository, copy its contents, and run it. This will automatically create:
   - `products` table (with constraints and initial seed data for all Bouquets, Solos, and Triples)
   - `orders` table
   - `order_items` table (relational foreign keys with cascade support)
   - Row Level Security (RLS) policies
   - Storage bucket `product-images`
4. Copy your project credentials into `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
5. *(Optional)* You can also configure or test Supabase credentials on the fly directly inside the app by tapping the **Supabase Live / Demo Mode** badge in the bottom-right corner!

---

## 📱 Tauri Android APK & Desktop Packaging

### Desktop Build
```bash
npm run tauri:build
```

### Android APK Build
1. Make sure you have the **Android SDK**, **NDK**, and **Java (JDK 17+)** installed on your system.
2. Initialize Tauri Android:
   ```bash
   npm run tauri:android:init
   ```
3. Run on an Android emulator or connected device:
   ```bash
   npm run tauri:android:dev
   ```
4. Build the release Android APK:
   ```bash
   npm run tauri:android:build
   ```
The compiled APK will be output in `src-tauri/gen/android/app/build/outputs/apk/release/`.

---

## 📁 Directory Structure

```
fleurs-kiosk/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── .env
├── supabase/
│   └── schema.sql                # Complete Supabase schema, RLS, & seed SQL
├── src/
│   ├── assets/
│   │   └── flowerAssets.js       # Handcrafted SVG vector flower illustrations
│   ├── components/
│   │   ├── BackButton.jsx        # Touchscreen back button
│   │   ├── Button.jsx            # Reusable kiosk touch button
│   │   ├── CartButton.jsx        # Top-right cart button with count badge
│   │   ├── CartItem.jsx          # Cart row with item controls
│   │   ├── Decorations.jsx       # SVG butterflies, bows, floral corners
│   │   ├── ErrorMessage.jsx      # Friendly error guidance
│   │   ├── Header.jsx            # Kiosk header bar
│   │   ├── LoadingScreen.jsx     # Botanical loading state
│   │   ├── OrderCard.jsx         # Staff order card with status transitions
│   │   ├── ProductCard.jsx       # Bouquet card inspired by reference image 2
│   │   ├── ProductGrid.jsx       # 2-column responsive layout
│   │   ├── ProductModal.jsx      # Product quantity selection modal
│   │   ├── QuantitySelector.jsx  # [ - ] 1 [ + ] controls
│   │   ├── SupabaseConfigModal.jsx# On-screen Supabase connection manager
│   │   └── Toast.jsx             # Added-to-cart confirmation toast
│   ├── data/
│   │   └── defaultProducts.js    # Initial catalog data
│   ├── pages/
│   │   ├── HomePage.jsx          # Kiosk Landing page
│   │   ├── MenuPage.jsx          # Category menu (Image 1 reference)
│   │   ├── BouquetPage.jsx       # Bouquet 2-column grid (Image 2 reference)
│   │   ├── SoloFlowerPage.jsx    # Solo flower stem list
│   │   ├── TripleFlowerPage.jsx  # Triple flower ensemble list
│   │   ├── CartPage.jsx          # Shopping cart & checkout
│   │   ├── OrderConfirmationPage.jsx # Order confirmed receipt with confetti
│   │   ├── AdminDashboardPage.jsx    # Real-time staff order management
│   │   └── AdminInventoryPage.jsx    # Inventory and pricing management
│   ├── services/
│   │   └── supabase.js           # Supabase client, queries, & offline fallback
│   ├── styles/
│   │   └── kiosk.css             # Theme, stitch borders, colors, touch layout
│   ├── App.jsx                   # Master kiosk controller & state
│   ├── index.css                 # Base resets
│   └── main.jsx
└── src-tauri/                    # Tauri v2 configuration for desktop & Android APK
    ├── Cargo.toml
    ├── tauri.conf.json
    └── src/
        ├── lib.rs
        └── main.rs
```
