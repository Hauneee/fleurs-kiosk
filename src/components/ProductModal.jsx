
import React, { useState, useEffect } from 'react';
import { QuantitySelector } from './QuantitySelector';
import { Button } from './Button';
import {
  ShoppingBag,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';

const MAX_ITEMS = 10;
const MAX_ITEMS_MESSAGE = 'Maximum order is only 10 items!';

export const ProductModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onCheckoutNow,
  maxQuantity = MAX_ITEMS,
  onLimitReached,
}) => {
  const [quantity, setQuantity] = useState(1);

  const productStock =
    product?.stock == null || product.stock === ''
      ? 50
      : Number(product.stock);

  const stock = Number.isFinite(productStock)
    ? Math.max(0, productStock)
    : 0;

  const availableQuantity = Math.max(
    0,
    Math.min(Number(maxQuantity) || 0, stock)
  );

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(availableQuantity > 0 ? 1 : 0);
    }
  }, [isOpen, product?.id, availableQuantity]);

  useEffect(() => {
    if (availableQuantity <= 0) {
      setQuantity(0);
      return;
    }

    setQuantity((currentQuantity) =>
      Math.min(Math.max(1, currentQuantity), availableQuantity)
    );
  }, [availableQuantity]);

  if (!isOpen || !product) return null;

  const isValidQuantity = () =>
    availableQuantity > 0 &&
    quantity >= 1 &&
    quantity <= availableQuantity;

  const handleQuantityChange = (newQuantity) => {
    const requestedQuantity = Number(newQuantity);

    if (!Number.isInteger(requestedQuantity)) return;

    if (requestedQuantity > availableQuantity) {
      if (onLimitReached) onLimitReached();
      else console.warn(MAX_ITEMS_MESSAGE);
      return;
    }

    if (requestedQuantity < 1) return;
    setQuantity(requestedQuantity);
  };

  const handleAddToCart = () => {
    if (!isValidQuantity()) {
      if (onLimitReached) onLimitReached();
      else console.warn(MAX_ITEMS_MESSAGE);
      return;
    }

    const result = onAddToCart(product, quantity);
    if (result === false) return;

    setQuantity(1);
    onClose();
  };

  const handleCheckoutNow = () => {
    if (!isValidQuantity()) {
      if (onLimitReached) onLimitReached();
      else console.warn(MAX_ITEMS_MESSAGE);
      return;
    }

    if (typeof onCheckoutNow !== 'function') {
      console.error('ProductModal: onCheckoutNow callback is missing.');
      return;
    }

    const result = onCheckoutNow(product, quantity);
    if (result === false) return;

    setQuantity(1);
    onClose();
  };

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
            <p role="status">
              {stock <= 0
                ? 'This product is out of stock.'
                : MAX_ITEMS_MESSAGE}
            </p>
          )}

          <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
            {`You can add up to ${availableQuantity} more item${
              availableQuantity === 1 ? '' : 's'
            } to your order.`}
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
            disabled={!isValidQuantity()}
            icon={<ShoppingBag size={24} strokeWidth={2.5} />}
          >
            Add to cart · ₱
            {((Number(product.price) || 0) * quantity).toLocaleString()}
          </Button>

          <Button
            variant="accent"
            size="xl"
            onClick={handleCheckoutNow}
            disabled={!isValidQuantity()}
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
