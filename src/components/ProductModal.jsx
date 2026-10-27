import React, { useState, useEffect, useMemo } from 'react';
import { QuantitySelector } from './QuantitySelector';
import { Button } from './Button';
import {
  ShoppingBag,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';
import { getStockInfo } from '../pages/stock';

const MAX_ITEMS = 10;
const MAX_ITEMS_MESSAGE = 'Maximum order is only 10 items!';

export const ProductModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onCheckoutNow,
  maxQuantity = MAX_ITEMS,
  quantityInCart = 0,
  onLimitReached,
}) => {
  const [quantity, setQuantity] = useState(1);

  const stockInfo = useMemo(
    () => getStockInfo(product),
    [product]
  );

  const { qty: stockQty, soldOut, label: stockLabel } = stockInfo;

  const stockLimit =
    stockQty === null ? MAX_ITEMS : stockQty;

  const orderLimit = Math.max(
    0,
    Math.min(
      MAX_ITEMS,
      Number.isFinite(Number(maxQuantity))
        ? Math.max(0, Number(maxQuantity))
        : MAX_ITEMS
    )
  );

  const cartQty = Math.max(0, Number(quantityInCart) || 0);

  const availableQuantity = Math.max(
    0,
    Math.min(orderLimit, stockLimit - cartQty)
  );

  useEffect(() => {
    if (!isOpen || !product) return;

    setQuantity(availableQuantity > 0 ? 1 : 0);
  }, [isOpen, product?.id]);

  useEffect(() => {
    setQuantity((current) => {
      if (availableQuantity <= 0) return 0;
      return Math.min(Math.max(1, current), availableQuantity);
    });
  }, [availableQuantity]);

  if (!isOpen || !product) return null;

  const isValidQuantity =
    availableQuantity > 0 &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= availableQuantity;

  const notifyLimit = (message = MAX_ITEMS_MESSAGE) => {
    if (typeof onLimitReached === 'function') {
      onLimitReached(message);
    } else {
      console.warn(message);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    const requested = Number(newQuantity);

    if (!Number.isInteger(requested) || requested < 1) return;

    if (requested > availableQuantity) {
      notifyLimit(
        soldOut
          ? 'This product is currently out of stock.'
          : stockQty !== null && stockQty - cartQty < requested
            ? `Only ${Math.max(0, stockQty - cartQty)} more available.`
            : MAX_ITEMS_MESSAGE
      );
      return;
    }

    setQuantity(requested);
  };

  const handleAddToCart = () => {
    if (!isValidQuantity) {
      notifyLimit(
        soldOut
          ? 'This product is currently out of stock.'
          : 'Please choose an available quantity.'
      );
      return;
    }

    const result = onAddToCart?.(product, quantity);

    if (result && typeof result.then === 'function') {
      result
        .then((success) => {
          if (success === false) return;
          setQuantity(1);
          onClose?.();
        })
        .catch((error) => {
          console.error('Could not add product to cart:', error);
        });

      return;
    }

    if (result === false) return;

    setQuantity(1);
    onClose?.();
  };

  const handleCheckoutNow = () => {
    if (!isValidQuantity) {
      notifyLimit(
        soldOut
          ? 'This product is currently out of stock.'
          : 'Please choose an available quantity.'
      );
      return;
    }

    if (typeof onCheckoutNow !== 'function') {
      console.error('ProductModal: onCheckoutNow callback is missing.');
      return;
    }

    const result = onCheckoutNow(product, quantity);

    if (result && typeof result.then === 'function') {
      result
        .then((success) => {
          if (success === false) return;
          setQuantity(1);
          onClose?.();
        })
        .catch((error) => {
          console.error('Could not start checkout:', error);
        });

      return;
    }

    if (result === false) return;

    setQuantity(1);
    onClose?.();
  };

  const unavailableMessage = soldOut
    ? 'This product is out of stock.'
    : 'You have reached the available order limit.';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content fl-pm"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fl-pm__photo">
          <img src={product.image_url} alt={product.name} />
        </div>

        <h2 className="fl-pm__name">{product.name}</h2>

        <div className="fl-pm__price">
          ₱{Number(product.price).toLocaleString()}
        </div>

        {product.description && (
          <p className="fl-pm__desc">{product.description}</p>
        )}

        {stockLabel && (
          <p
            role="status"
            style={{
              color: soldOut ? '#b42318' : '#946200',
              fontWeight: 600,
              margin: '8px 0',
            }}
          >
            {stockLabel}
          </p>
        )}

        <div className="fl-pm__qty">
          <div className="fl-pm__qty-label">Choose quantity</div>

          {availableQuantity > 0 ? (
            <QuantitySelector
              quantity={quantity}
              onChange={handleQuantityChange}
              min={1}
              max={availableQuantity}
            />
          ) : (
            <p role="status">{unavailableMessage}</p>
          )}

          <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
            {availableQuantity > 0
              ? `You can add up to ${availableQuantity} more item${
                  availableQuantity === 1 ? '' : 's'
                } to your order.`
              : 'No additional units are available to add.'}
          </p>
        </div>

        <div
          className="fl-pm__actions"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <Button
            variant="accent"
            size="xl"
            onClick={handleAddToCart}
            disabled={!isValidQuantity}
            icon={<ShoppingBag size={24} strokeWidth={2.5} />}
          >
            Add to cart · ₱
            {(
              (Number(product.price) || 0) *
              (quantity > 0 ? quantity : 0)
            ).toLocaleString()}
          </Button>

          <Button
            variant="accent"
            size="xl"
            onClick={handleCheckoutNow}
            disabled={!isValidQuantity}
            icon={<CreditCard size={22} />}
          >
            Checkout Now
          </Button>

          <Button
            variant="accent"
            size="md"
            onClick={onClose}
            icon={<ArrowLeft size={20} />}
          >
            Back to products
          </Button>
        </div>
      </div>
    </div>
  );
};