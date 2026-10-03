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
 */
export const createOrder = async (orderPayload, items) => {
  const orderNumber = `#${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  const newOrder = {
    order_number: orderNumber,
    total_amount: orderPayload.total_amount,
    status: 'pending',
    created_at: now
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Prepare relational order_items
      const orderItemsToInsert = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id || item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity
      }));

      // 3. Insert order_items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) {
        console.error('Failed to insert order items:', itemsError);
        // Rollback / delete orphaned order
        await supabase.from('orders').delete().eq('id', orderData.id);
        throw new Error(`Failed to save order details: ${itemsError.message}`);
      }

      // Also save to local backup so user can view offline
      const localOrders = getLocalOrders();
      localOrders.unshift({
        ...orderData,
        order_items: orderItemsToInsert
      });
      saveLocalOrders(localOrders);

      return {
        ...orderData,
        order_items: orderItemsToInsert
      };
    } catch (err) {
      console.error('Supabase order creation failed:', err);
      throw new Error(`Unable to connect to the server. Please check the connection and try again.`);
    }
  }

  // If Supabase is not configured yet (e.g. initial demo testing)
  // Store reliably in local orders database
  const fallbackOrder = {
    id: `ord-${Date.now()}`,
    order_number: orderNumber,
    total_amount: orderPayload.total_amount,
    status: 'pending',
    created_at: now,
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
