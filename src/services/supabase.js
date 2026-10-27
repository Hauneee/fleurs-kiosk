
import { createClient } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS } from '../data/defaultProducts';
import { getPaymentInfo } from '../utils/paymentInfo';

// ===============================
// SUPABASE CONFIGURATION
// ===============================

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const savedUrl = localStorage.getItem('fleurs_supabase_url');
const savedKey = localStorage.getItem('fleurs_supabase_anon_key');

const supabaseUrl = (savedUrl || envUrl).trim();
const supabaseAnonKey = (savedKey || envAnonKey).trim();

console.log('[FLEURS DEBUG] Supabase URL:', supabaseUrl);
console.log('[FLEURS DEBUG] Using saved URL:', Boolean(savedUrl));
console.log('[FLEURS DEBUG] Using saved key:', Boolean(savedKey));

export const isSupabaseConfigured = () =>
  Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    supabaseUrl.startsWith('https://')
  );

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const CACHE_PRODUCTS_KEY = 'fleurs_cached_products';
const CACHE_ORDERS_KEY = 'fleurs_cached_orders';
const ORDER_REQUEST_TIMEOUT_MS = 30000;

// ===============================
// LOCAL PRODUCTS
// ===============================

export const getLocalProducts = () => {
  try {
    const raw = localStorage.getItem(CACHE_PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse cached products:', err);
  }

  localStorage.setItem(
    CACHE_PRODUCTS_KEY,
    JSON.stringify(INITIAL_PRODUCTS)
  );

  return INITIAL_PRODUCTS;
};

export const saveLocalProducts = (products) => {
  localStorage.setItem(
    CACHE_PRODUCTS_KEY,
    JSON.stringify(products)
  );
};

// ===============================
// LOCAL ORDERS
// ===============================

export const getLocalOrders = () => {
  try {
    const raw = localStorage.getItem(CACHE_ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse cached orders:', err);
  }

  return [];
};

export const saveLocalOrders = (orders) => {
  localStorage.setItem(
    CACHE_ORDERS_KEY,
    JSON.stringify(orders)
  );
};

// ===============================
// SUPABASE CONNECTION
// ===============================

export const checkSupabaseConnection = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      connected: false,
      message:
        'Supabase credentials are not configured. Running offline/demo mode.',
    };
  }

  try {
    const { error } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        message: `Database error: ${error.message}`,
      };
    }

    return {
      connected: true,
      message: 'Successfully connected to Supabase!',
    };
  } catch (err) {
    return {
      connected: false,
      message: `Unable to connect: ${err.message || 'Network error'}`,
    };
  }
};

// ===============================
// FETCH PRODUCTS
// ===============================

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

      if (error) throw error;

      if (data && data.length === 0 && !category) {
        await seedDefaultProducts();
        return getLocalProducts();
      }

      return data || [];
    } catch (err) {
      console.warn(
        'Supabase products fetch failed:',
        err.message
      );
    }
  }

  const local = getLocalProducts().filter(
    (product) => product.is_active
  );

  return category
    ? local.filter((product) => product.category === category)
    : local;
};

// ===============================
// FETCH ALL ADMIN PRODUCTS
// ===============================

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
      console.warn('Using local product cache:', err.message);
    }
  }

  return getLocalProducts();
};

// ===============================
// CREATE PRODUCT
// ===============================

export const createProduct = async (productData) => {
  const newProduct = {
    ...productData,
    created_at: new Date().toISOString(),
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

  const products = getLocalProducts();

  const created = {
    ...newProduct,
    id: `prod-${Date.now()}`,
  };

  products.unshift(created);
  saveLocalProducts(products);

  return created;
};

// ===============================
// UPDATE PRODUCT
// ===============================

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

  const products = getLocalProducts();
  const index = products.findIndex(
    (product) => product.id === id
  );

  if (index !== -1) {
    products[index] = {
      ...products[index],
      ...updates,
    };

    saveLocalProducts(products);
    return products[index];
  }

  throw new Error('Product not found in local storage');
};

// ===============================
// DELETE PRODUCT
// ===============================

export const deleteProduct = async (id) => {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  }

  saveLocalProducts(
    getLocalProducts().filter(
      (product) => product.id !== id
    )
  );

  return true;
};

// ===============================
// SEED DEFAULT PRODUCTS
// ===============================

export const seedDefaultProducts = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('products')
      .upsert(INITIAL_PRODUCTS, {
        onConflict: 'id',
      });

    if (error) throw error;

    return true;
  } catch (err) {
    console.error('Error seeding products:', err);
    return false;
  }
};

// ===============================
// CREATE ORDER
// Online: Supabase RPC with idempotency
// Offline: local demo fallback
// ===============================

export const createOrder = async (orderPayload, items) => {
  const customer = orderPayload?.customer || {};

  if (
    !customer.name?.trim() ||
    !customer.email?.trim() ||
    !customer.phone?.trim()
  ) {
    throw new Error(
      'Customer information is missing. Please complete all fields.'
    );
  }

  const paymentInfo = getPaymentInfo();

  const paymentMethod = String(
    paymentInfo?.method || ''
  )
    .trim()
    .toLowerCase();

  if (!['cash', 'gcash'].includes(paymentMethod)) {
    throw new Error(
      'Please select Cash or GCash as the payment method.'
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const orderItems = items.map((item) => {
    const productId = item.product_id || item.id;
    const quantity = Number(item.quantity);

    if (
      !productId ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new Error('An item in your cart is invalid.');
    }

    return {
      product_id: productId,
      quantity,
    };
  });

  // ===============================
  // ONLINE: SUPABASE RPC
  // ===============================

  if (isSupabaseConfigured() && supabase) {
    const idempotencyKey = orderPayload?.idempotency_key;

    if (
      typeof idempotencyKey !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idempotencyKey
      )
    ) {
      throw new Error(
        'Missing or invalid checkout key. Please return to checkout and try again.'
      );
    }

    const paymentReference =
      orderPayload.payment_reference || null;

    const controller = new AbortController();
    let timeoutId;
    let requestTimedOut = false;

    try {
      console.log(
        '[FLEURS DEBUG] Creating order through Supabase RPC'
      );
      console.log(
        '[FLEURS DEBUG] Payment method:',
        paymentMethod
      );
      console.log(
        '[FLEURS DEBUG] Calling create_kiosk_order RPC'
      );

      timeoutId = setTimeout(() => {
        requestTimedOut = true;
        controller.abort();
      }, ORDER_REQUEST_TIMEOUT_MS);

      const { data, error } = await supabase
        .rpc('create_kiosk_order', {
          p_customer_name: customer.name.trim(),
          p_customer_email: customer.email.trim(),
          p_customer_phone: customer.phone.trim(),
          p_items: orderItems,
          p_payment_method: paymentMethod,
          p_idempotency_key: idempotencyKey,
          p_payment_reference: paymentReference,
        })
        .abortSignal(controller.signal);

      if (error) {
        console.error(
          '[FLEURS DEBUG] Supabase RPC error:',
          error
        );

        throw new Error(error.message);
      }

      console.log(
        '[FLEURS DEBUG] Raw RPC response:',
        data
      );

      // Support either a JSON object or a one-row array.
      const result = Array.isArray(data) ? data[0] : data;

      if (
        !result ||
        typeof result !== 'object' ||
        !result.order_number
      ) {
        console.error(
          '[FLEURS DEBUG] Unexpected RPC response:',
          data
        );

        throw new Error(
          'The server response did not contain an order number. Check the return value of create_kiosk_order.'
        );
      }

      console.log(
        '[FLEURS DEBUG] Order created:',
        result.order_number
      );

      return {
        ...result,
        status: result.status || 'pending',
        payment_status:
          result.payment_status ||
          (paymentMethod === 'cash' ? 'pending' : 'paid'),
      };
    } catch (err) {
      if (requestTimedOut) {
        console.error(
          '[FLEURS DEBUG] Order RPC timed out after 30 seconds.'
        );

        throw new Error(
          'The order request timed out. Your order may still have been saved. Please check your orders before trying again.'
        );
      }

      console.error(
        '[FLEURS DEBUG] Order creation failed:',
        err
      );

      throw new Error(
        `Unable to create order: ${
          err?.message || 'Please try again.'
        }`
      );
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  // ===============================
  // OFFLINE / DEMO FALLBACK
  // ===============================

  const orderNumber =
    `#${Math.floor(100000 + Math.random() * 900000)}`;

  const now = new Date().toISOString();

  const fallbackOrder = {
    id: `ord-${Date.now()}`,
    order_number: orderNumber,
    customer_name: customer.name.trim(),
    customer_email: customer.email.trim(),
    customer_phone: customer.phone.trim(),
    total_amount: Number(orderPayload.total_amount) || 0,
    status: 'pending',
    payment_status:
      paymentMethod === 'cash' ? 'pending' : 'paid',
    payment_method: paymentMethod,
    payment_reference: orderPayload.payment_reference || null,
    idempotency_key: orderPayload.idempotency_key || null,
    created_at: now,
    order_items: items.map((item) => ({
      id: `item-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}`,
      product_id: item.product_id || item.id,
      product_name: item.name,
      quantity: Number(item.quantity),
      unit_price: Number(item.price),
      subtotal:
        Number(item.price) * Number(item.quantity),
    })),
  };

  const localOrders = getLocalOrders();

  localOrders.unshift(fallbackOrder);
  saveLocalOrders(localOrders);

  return fallbackOrder;
};

// ===============================
// TRACK ORDER
// ===============================

export const trackOrder = async (orderNumber) => {
  const cleanNumber = String(orderNumber || '')
    .replace(/\D/g, '');

  if (!cleanNumber) {
    throw new Error('Please enter your order number.');
  }

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.rpc(
      'track_order',
      {
        p_order_number: `#${cleanNumber}`,
      }
    );

    if (error) {
      console.error('Order tracking failed:', error);

      throw new Error(
        'Unable to check your order right now.'
      );
    }

    return data || null;
  }

  const match = getLocalOrders().find(
    (order) =>
      String(order.order_number || '')
        .replace(/\D/g, '') === cleanNumber
  );

  if (!match) return null;

  return {
    order_number: match.order_number,
    status: match.status,
    payment_status: match.payment_status,
    payment_method: match.payment_method,
    total_amount: match.total_amount,
    created_at: match.created_at,
    order_items: (match.order_items || []).map((item) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
  };
};
