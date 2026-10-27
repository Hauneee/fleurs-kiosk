
import { createClient } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS } from '../data/defaultProducts';
import { getPaymentInfo } from '../utils/paymentInfo';

// ========================================
// SUPABASE CONFIGURATION
// ========================================

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const savedUrl = localStorage.getItem('fleurs_supabase_url');
const savedKey = localStorage.getItem('fleurs_supabase_anon_key');

const supabaseUrl = (savedUrl || envUrl).trim();
const supabaseAnonKey = (savedKey || envAnonKey).trim();

console.log(
  '[FLEURS] Supabase configured:',
  Boolean(supabaseUrl && supabaseAnonKey)
);
console.log('[FLEURS] Using saved URL:', Boolean(savedUrl));
console.log('[FLEURS] Using saved key:', Boolean(savedKey));

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

// ========================================
// LOCAL PRODUCTS
// ========================================

export const getLocalProducts = () => {
  try {
    const raw = localStorage.getItem(CACHE_PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('[FLEURS] Failed to parse cached products:', err);
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

// ========================================
// LOCAL ORDERS
// ========================================

export const getLocalOrders = () => {
  try {
    const raw = localStorage.getItem(CACHE_ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('[FLEURS] Failed to parse cached orders:', err);
  }

  return [];
};

export const saveLocalOrders = (orders) => {
  localStorage.setItem(
    CACHE_ORDERS_KEY,
    JSON.stringify(orders)
  );
};

// ========================================
// SUPABASE CONNECTION
// ========================================

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
      .select('id', { count: 'exact', head: true });

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

// ========================================
// FETCH PRODUCTS
// ========================================

export const fetchProducts = async (category = null) => {
  if (!isSupabaseConfigured() || !supabase) {
    console.error(
      '[FLEURS STOCK] Supabase is not configured. Using local products.'
    );

    const local = getLocalProducts().filter(
      (product) => product.is_active
    );

    return category
      ? local.filter((product) => product.category === category)
      : local;
  }

  let query = supabase
    .from('products')
    .select(
      'id, name, category, description, price, image_url, stock, is_active, created_at'
    )
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[FLEURS STOCK] Supabase fetch failed:', error);
    throw new Error(
      `Unable to fetch products from Supabase: ${error.message}`
    );
  }

  const products = data || [];

  console.table(
    products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      stock: product.stock,
      is_active: product.is_active,
    }))
  );

  return products;
};

// ========================================
// REALTIME PRODUCT CHANGES
// ========================================

export const subscribeToProductChanges = (onChange) => {
  if (!supabase || !isSupabaseConfigured()) {
    console.warn(
      '[FLEURS] Product Realtime unavailable; using normal fetches.'
    );

    return () => {};
  }

  const channel = supabase
    .channel('fleurs-kiosk-products')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
      },
      (payload) => {
        console.info(
          '[FLEURS] Product change detected:',
          payload.eventType
        );

        if (typeof onChange === 'function') {
          onChange(payload);
        }
      }
    )
    .subscribe((status) => {
      console.info('[FLEURS] Product Realtime status:', status);

      if (
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT'
      ) {
        console.error(
          '[FLEURS] Product Realtime subscription failed:',
          status
        );
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};

// ========================================
// FETCH ALL ADMIN PRODUCTS
// ========================================

export const fetchAllAdminProducts = async () => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[FLEURS] Failed to fetch admin products:', error);
      throw new Error(
        `Unable to fetch admin products: ${error.message}`
      );
    }

    return data || [];
  }

  return getLocalProducts();
};

// ========================================
// CREATE PRODUCT
// ========================================

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

// ========================================
// UPDATE PRODUCT
// ========================================

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
  const index = products.findIndex((product) => product.id === id);

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

// ========================================
// DELETE PRODUCT
// ========================================

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
    getLocalProducts().filter((product) => product.id !== id)
  );

  return true;
};

// ========================================
// SEED DEFAULT PRODUCTS
// ========================================

export const seedDefaultProducts = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('products')
      .upsert(INITIAL_PRODUCTS, { onConflict: 'id' });

    if (error) throw error;

    return true;
  } catch (err) {
    console.error('[FLEURS] Error seeding products:', err);
    return false;
  }
};

// ========================================
// CREATE ORDER
// ========================================

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
    paymentInfo?.method || orderPayload?.payment_method || ''
  )
    .trim()
    .toLowerCase();

  if (!['cash', 'gcash'].includes(paymentMethod)) {
    throw new Error('Please select Cash or GCash as the payment method.');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const totalAmount = Number(orderPayload?.total_amount) || 0;
  const amountPaid =
    Number(orderPayload?.amount_paid) ||
    (paymentMethod === 'gcash' ? totalAmount : 0);

  const changeAmount =
    Number(orderPayload?.change_amount) ||
    Math.max(0, amountPaid - totalAmount);

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

  // Online checkout via Supabase RPC.
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
      orderPayload?.payment_reference || null;

    const controller = new AbortController();
    let timeoutId;
    let requestTimedOut = false;

    try {
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
        console.error('[FLEURS] Supabase RPC error:', error);
        throw new Error(error.message);
      }

      const result = Array.isArray(data) ? data[0] : data;

      if (
        !result ||
        typeof result !== 'object' ||
        !result.order_number
      ) {
        throw new Error(
          'The server response did not contain an order number. Check create_kiosk_order.'
        );
      }

      return {
        ...result,
        order_number: result.order_number,
        total_amount: Number(result.total_amount ?? totalAmount),
        payment_method: result.payment_method || paymentMethod,
        amount_paid: Number(result.amount_paid ?? amountPaid),
        change_amount: Number(
          result.change_amount ?? changeAmount
        ),
        status: result.status || 'pending',
        payment_status: result.payment_status || 'pending',
      };
    } catch (err) {
      if (requestTimedOut) {
        throw new Error(
          'The order request timed out. Your order may still have been saved. Please check your orders before trying again.'
        );
      }

      console.error('[FLEURS] Order creation failed:', err);

      if (
        /insufficient stock|inactive product/i.test(
          err?.message || ''
        )
      ) {
        const stockError = new Error(
          'Sorry, one or more items in your cart just ran out of stock. Please check your cart quantities and try again.'
        );

        stockError.code = 'OUT_OF_STOCK';
        throw stockError;
      }

      throw new Error(
        `Unable to create order: ${err?.message || 'Please try again.'}`
      );
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  // Offline/demo fallback.
  const orderNumber = `#${Math.floor(
    100000 + Math.random() * 900000
  )}`;

  const now = new Date().toISOString();

  const fallbackOrder = {
    id: `ord-${Date.now()}`,
    order_number: orderNumber,
    customer: {
      name: customer.name.trim(),
      email: customer.email.trim(),
      phone: customer.phone.trim(),
    },
    customer_name: customer.name.trim(),
    customer_email: customer.email.trim(),
    customer_phone: customer.phone.trim(),
    total_amount: totalAmount,
    amount_paid: amountPaid,
    change_amount: changeAmount,
    status: 'pending',
    payment_status: 'pending',
    payment_method: paymentMethod,
    payment_reference: orderPayload?.payment_reference || null,
    idempotency_key: orderPayload?.idempotency_key || null,
    created_at: now,
    items: items.map((item) => {
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.price) || 0;
      const lineTotal = unitPrice * quantity;
      const productName =
        item.product_name || item.name || 'Unnamed Product';

      return {
        id: `item-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 6)}`,
        product_id: item.product_id || item.id,
        product_name: productName,
        name: productName,
        quantity,
        unit_price: unitPrice,
        price: unitPrice,
        subtotal: lineTotal,
        line_total: lineTotal,
      };
    }),
  };

  const localOrders = getLocalOrders();
  localOrders.unshift(fallbackOrder);
  saveLocalOrders(localOrders);

  return fallbackOrder;
};

// ========================================
// TRACK ORDER
// ========================================

export const trackOrder = async (orderNumber) => {
  const cleanNumber = String(orderNumber || '').replace(/\D/g, '');

  if (!cleanNumber) {
    throw new Error('Please enter your order number.');
  }

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.rpc('track_order', {
      p_order_number: `#${cleanNumber}`,
    });

    if (error) {
      console.error('[FLEURS] Order tracking failed:', error);
      throw new Error('Unable to check your order right now.');
    }

    return data || null;
  }

  const match = getLocalOrders().find(
    (order) =>
      String(order.order_number || '').replace(/\D/g, '') ===
      cleanNumber
  );

  if (!match) return null;

  return {
    order_number: match.order_number,
    status: match.status,
    payment_status: match.payment_status,
    payment_method: match.payment_method,
    total_amount: match.total_amount,
    created_at: match.created_at,
    order_items: (match.order_items || match.items || []).map(
      (item) => ({
        product_name:
          item.product_name || item.name || 'Unnamed Product',
        quantity: item.quantity,
        subtotal:
          item.subtotal ??
          item.line_total ??
          (Number(item.unit_price ?? item.price) || 0) *
            (Number(item.quantity) || 1),
      })
    ),
  };
};
