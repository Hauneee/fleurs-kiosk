
/**
 * Stock helpers for the Fleurs kiosk.
 *
 * Supports common stock column names:
 * stock, quantity, stock_quantity, inventory_quantity.
 *
 * If no stock field exists, the product is treated as
 * having unknown stock, so offline/demo products continue
 * to work without being blocked.
 */

const STOCK_FIELDS = [
  'stock',
  'quantity',
  'stock_quantity',
  'inventory_quantity',
];

export const getStockInfo = (product) => {
  if (!product || typeof product !== 'object') {
    return {
      soldOut: false,
      low: false,
      qty: null,
      label: '',
    };
  }

  const field = STOCK_FIELDS.find(
    (key) =>
      product[key] !== null &&
      product[key] !== undefined &&
      product[key] !== ''
  );

  // Unknown stock: do not block demo or legacy products.
  if (!field) {
    return {
      soldOut: false,
      low: false,
      qty: null,
      label: '',
    };
  }

  const qty = Number(product[field]);

  // Invalid stock values are treated as unknown.
  if (!Number.isFinite(qty) || qty < 0) {
    return {
      soldOut: false,
      low: false,
      qty: null,
      label: '',
    };
  }

  const normalizedQty = Math.floor(qty);
  const soldOut = normalizedQty <= 0;
  const low = normalizedQty > 0 && normalizedQty <= 10;

  let label = '';

  if (soldOut) {
    label = 'Out of stock';
  } else if (low) {
    label = `Only ${normalizedQty} left`;
  }

  return {
    soldOut,
    low,
    qty: normalizedQty,
    label,
  };
};

/**
 * Returns how many more units may be added to the cart.
 * A negative cart quantity is treated as zero.
 */
export const remainingToAdd = (
  product,
  quantityInCart = 0
) => {
  const { qty } = getStockInfo(product);

  // Unknown stock: preserve existing add-to-cart behavior.
  if (qty === null) {
    return Infinity;
  }

  const inCart = Math.max(
    0,
    Number(quantityInCart) || 0
  );

  return Math.max(0, qty - inCart);
};

/**
 * Convenience helper for buttons and quantity controls.
 */
export const canAddToCart = (
  product,
  quantityInCart = 0
) => {
  return remainingToAdd(product, quantityInCart) > 0;
};
