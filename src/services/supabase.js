import { createClient } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS } from '../data/defaultProducts';

// Read environment variables
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Allow runtime override via localStorage for easy testing without restarting dev server
const savedUrl = localStorage.getItem('fleurs_supabase_url');
const savedKey = localStorage.getItem('fleurs_supabase_anon_key');

const supabaseUrl = (savedUrl || envUrl).trim();
const supabaseAnonKey = (savedKey || envAnonKey).trim();

// Check if valid credentials are provided
export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project') &&
    supabaseUrl.startsWith('https://')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Persistent local cache keys for resilience and offline backup
const CACHE_PRODUCTS_KEY = 'fleurs_cached_products';
const CACHE_ORDERS_KEY = 'fleurs_cached_orders';

// Helper to get local backup products
export const getLocalProducts = () => {
  try {
    const raw = localStorage.getItem(CACHE_PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse cached products', err);
  }
  localStorage.setItem(CACHE_PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
};

// Helper to save local products backup
export const saveLocalProducts = (products) => {
  localStorage.setItem(CACHE_PRODUCTS_KEY, JSON.stringify(products));
};

// Helper to get local orders backup
export const getLocalOrders = () => {
  try {
    const raw = localStorage.getItem(CACHE_ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse cached orders', err);
  }
  return [];
};

// Helper to save local orders backup
export const saveLocalOrders = (orders) => {
  localStorage.setItem(CACHE_ORDERS_KEY, JSON.stringify(orders));
};

/**
 * Test connectivity to Supabase
 */
export const checkSupabaseConnection = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      connected: false,
      message: 'Supabase credentials are not configured yet. Running in offline/demo mode.'
    };
  }

  try {
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
    if (error) {
      return {
        connected: false,
        message: `Database error: ${error.message}`
      };
    }
    return {
      connected: true,
      message: 'Successfully connected to Supabase PostgreSQL database!'
    };
  } catch (err) {
    return {
      connected: false,
      message: `Unable to connect: ${err.message || 'Network error'}`
    };
  }
};

/**
 * Fetch products from Supabase (filtered by category if provided)
 */
export const fetchProducts = async (category = null) => {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Supabase fetch error, falling back to local cache:', error.message);
        throw error;
      }

      // If database is empty, seed it with default products if we have permission
      if (data && data.length === 0 && !category) {
        await seedDefaultProducts();
        return getLocalProducts();
      }

      return data || [];
    } catch (err) {
      console.warn('Using local fallback for products due to connection issue:', err);
      const local = getLocalProducts().filter((p) => p.is_active);
      return category ? local.filter((p) => p.category === category) : local;
    }
  }

  // Fallback to local data when Supabase is not configured
  const local = getLocalProducts().filter((p) => p.is_active);
  return category ? local.filter((p) => p.category === category) : local;
};

/**
 * Fetch all products for admin inventory
 */
export const fetchAllAdminProducts = async () => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Using local fallback for admin products:', err);
      return getLocalProducts();
    }
  }

  return getLocalProducts();
};

/**
 * Create a new product (Admin)
 */
export const createProduct = async (productData) => {
  const newProduct = {
    ...productData,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('products')
      .insert([newProduct])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Local fallback
  const products = getLocalProducts();
  const created = { ...newProduct, id: `prod-${Date.now()}` };
  products.unshift(created);
  saveLocalProducts(products);
  return created;
};

/**
 * Update an existing product (Admin)
 */
export const updateProduct = async (id, updates) => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Local fallback
  const products = getLocalProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...updates };
    saveLocalProducts(products);
    return products[index];
  }
  throw new Error('Product not found in local storage');
};

/**
 * Delete a product (Admin)
 */
export const deleteProduct = async (id) => {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // Local fallback
  const products = getLocalProducts().filter((p) => p.id !== id);
  saveLocalProducts(products);
  return true;
};

/**
 * Seed initial default products into Supabase
 */
export const seedDefaultProducts = async () => {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const { error } = await supabase.from('products').upsert(INITIAL_PRODUCTS, { onConflict: 'id' });
    if (error) {
      console.error('Error seeding products:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to seed default products:', err);
    return false;
  }
};

/**
 * Create Order in Supabase
 * Performs relational insert: orders -> order_items
 * Called only after the customer confirms payment.
 * Requires the database setup in supabase/migration_checkout_update.sql,
 * migration_payment_reference.sql and migration_admin_dashboard.sql.
 */
export const createOrder = async (orderPayload, items) => {
  const customer = orderPayload.customer || {};

  // Customer information is required for every kiosk order
  if (
    !customer.name?.trim() ||
    !customer.email?.trim() ||
    !customer.phone?.trim() ||
    !customer.section?.trim()
  ) {
    throw new Error('Customer information is missing. Please go back and fill in all fields.');
  }

  // The receipt reference number is required for every kiosk order
  const paymentReference = (orderPayload.payment_reference || '').trim();
  if (!paymentReference) {
    throw new Error('The payment reference number is missing. Please go back and enter it.');
  }

  const orderNumber = `#${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  const newOrder = {
    order_number: orderNumber,
    customer_name: customer.name.trim(),
    customer_email: customer.email.trim(),
    customer_phone: customer.phone.trim(),
    customer_section: customer.section.trim(),
    total_amount: orderPayload.total_amount,
    status: 'pending',
    payment_status: 'payment_submitted',
    payment_reference: paymentReference,
    created_at: now
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      // The database function saves the order and its items together (all or nothing)
      // and takes the prices from the products table.
      const { data, error } = await supabase.rpc('create_kiosk_order', {
        p_customer_name: customer.name.trim(),
        p_customer_email: customer.email.trim(),
        p_customer_phone: customer.phone.trim(),
        p_customer_section: customer.section.trim(),
        p_payment_reference: paymentReference,
        p_items: items.map((item) => ({
          product_id: item.product_id || item.id,
          quantity: item.quantity
        }))
      });

      if (error) throw error;
      if (!data || !data.order_number) {
        throw new Error('Empty response from the server');
      }

      return data;
    } catch (err) {
      console.error('Supabase order creation failed:', err);
      if (/Product not available/i.test(err?.message || '')) {
        throw new Error(
          'One of the items in your cart is no longer available. Please go back to the cart and review your order.'
        );
      }
      throw new Error('Unable to connect to the server. Please check the connection and try again.');
    }
  }

  // If Supabase is not configured yet (e.g. initial demo testing)
  // Store reliably in local orders database
  const fallbackOrder = {
    id: `ord-${Date.now()}`,
    ...newOrder,
    order_items: items.map((item) => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: item.product_id || item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity
    }))
  };

  const localOrders = getLocalOrders();
  localOrders.unshift(fallbackOrder);
  saveLocalOrders(localOrders);

  return fallbackOrder;
};

/**
 * Look up the status of an order (used by the kiosk "Track My Order" page).
 * The customer must give the order number AND the phone number used on the order.
 * Returns only the status, payment status, items and total - never personal details.
 * Returns null when no order matches (wrong number and wrong phone look the same).
 * Requires supabase/migration_track_order.sql.
 */
export const trackOrder = async (orderNumber, phone) => {
  const cleanNumber = String(orderNumber || '').replace(/\D/g, '');
  const cleanPhone = String(phone || '').replace(/\D/g, '');

  if (cleanNumber.length < 1 || cleanPhone.length < 7) {
    throw new Error('Please enter your order number and the phone number used for the order.');
  }

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.rpc('track_order', {
      p_order_number: `#${cleanNumber}`,
      p_phone: cleanPhone
    });

    if (error) {
      console.error('Order tracking failed:', error);
      throw new Error('Unable to check your order right now. Please try again.');
    }
    return data || null;
  }

  // Demo mode (no Supabase): look in the orders saved in this browser
  const last10 = (v) => String(v || '').replace(/\D/g, '').slice(-10);
  const match = getLocalOrders().find(
    (o) =>
      String(o.order_number || '').replace(/\D/g, '') === cleanNumber &&
      last10(o.customer_phone) === last10(cleanPhone)
  );
  if (!match) return null;
  return {
    order_number: match.order_number,
    status: match.status,
    payment_status: match.payment_status,
    total_amount: match.total_amount,
    created_at: match.created_at,
    order_items: (match.order_items || []).map((i) => ({
      product_name: i.product_name,
      quantity: i.quantity,
      subtotal: i.subtotal
    }))
  };
};

/**
 * Fetch orders for Admin Dashboard
 */
export const fetchOrders = async () => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          created_at,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            subtotal
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Falling back to cached orders:', err);
      return getLocalOrders();
    }
  }

  return getLocalOrders();
};

/**
 * Update order status (PENDING -> CONFIRMED -> COMPLETED / CANCELLED)
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Local fallback
  const orders = getLocalOrders();
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    order.status = newStatus;
    saveLocalOrders(orders);
    return order;
  }
  throw new Error('Order not found');
};

/**
 * Upload image to Supabase Storage
 */
export const uploadProductImage = async (file) => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured for image uploads');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `product-images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * Data for the Admin Reports page (orders + product categories)
 */
export const fetchReportData = async () => {
  if (isSupabaseConfigured() && supabase) {
    const [ordersRes, productsRes] = await Promise.all([
      supabase
        .from('orders')
        .select(
          'id, order_number, total_amount, status, created_at, payment_reference, order_items ( product_id, product_name, quantity, subtotal )'
        )
        .order('created_at', { ascending: false }),
      supabase.from('products').select('id, category')
    ]);

    if (ordersRes.error) throw ordersRes.error;
    return {
      orders: ordersRes.data || [],
      products: productsRes.data || []
    };
  }

  return { orders: getLocalOrders(), products: getLocalProducts() };
};