/**
 * Stock helpers for the Fleurs kiosk.
 * Uses the actual Supabase products.stock field.
 */

export const getStockInfo = (product) => {
  if (!product || typeof product !== 'object') {
    return {
      soldOut: false,
      low: false,
      qty: null,
      label: '',
    };
  }

  const rawStock = product.stock;

  // Missing stock means unknown stock.
  if (
    rawStock === null ||
    rawStock === undefined ||
    rawStock === ''
  ) {
    return {
      soldOut: false,
      low: false,
      qty: null,
      label: '',
    };
  }

  const qty = Number(rawStock);

  if (!Number.isFinite(qty) || qty < 0) {
    return {
      soldOut: false,
      low: false,
      qty: null,
      label: '',
    };
  }

  const normalizedQty = Math.floor(qty);
  const soldOut = normalizedQty === 0;
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

export const remainingToAdd = (
  product,
  quantityInCart = 0
) => {
  const { qty } = getStockInfo(product);

  if (qty === null) {
    return Infinity;
  }

  const inCart = Math.max(
    0,
    Number(quantityInCart) || 0
  );

  return Math.max(0, qty - inCart);
};

export const canAddToCart = (
  product,
  quantityInCart = 0
) => {
  return remainingToAdd(product, quantityInCart) > 0;
};