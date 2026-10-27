
import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

const MAX_ITEMS = 10;

export const CartItem = ({
  item,
  onUpdateQuantity,
  onRemove,
  canIncrease = true
}) => {
  const price = Number(item.price) || 0;
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const subtotal = price * quantity;

  const formatPrice = (amount) =>
    `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const handleDecrease = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      quantity > 1 &&
      typeof onUpdateQuantity === 'function'
    ) {
      onUpdateQuantity(item.id, quantity - 1);
    }
  };

  const handleIncrease = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!canIncrease || quantity >= MAX_ITEMS) {
      return;
    }

    if (typeof onUpdateQuantity === 'function') {
      onUpdateQuantity(item.id, quantity + 1);
    }
  };

  const handleRemove = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (typeof onRemove === 'function') {
      onRemove(item.id);
    }
  };

  return (
    <div className="fl-item">
      <div className="fl-item__thumb">
        <img
          src={item.image_url}
          alt={item.name || 'Flower product'}
          loading="lazy"
        />
      </div>

      <div className="fl-item__info">
        <h3 className="fl-item__name">
          {item.name}
        </h3>

        <div className="fl-item__price">
          {formatPrice(price)} each
        </div>
      </div>

      <div className="fl-item__qty">
        <button
          type="button"
          className="fl-round"
          onClick={handleDecrease}
          disabled={quantity <= 1}
          aria-label={`Decrease quantity of ${item.name}`}
          title={
            quantity <= 1
              ? 'Minimum quantity is 1'
              : 'Decrease quantity'
          }
        >
          <Minus size={20} strokeWidth={3} />
        </button>

        <span
          className="fl-item__count"
          aria-live="polite"
          aria-label={`Quantity: ${quantity}`}
        >
          {quantity}
        </span>

        <button
          type="button"
          className="fl-round"
          onClick={handleIncrease}
          aria-label={`Increase quantity of ${item.name}`}
          title={
            !canIncrease
              ? `Maximum of ${MAX_ITEMS} items per order`
              : 'Increase quantity'
          }
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>

      <div className="fl-item__sub">
        <span className="fl-item__sub-label">
          Subtotal
        </span>

        <span className="fl-item__sub-value">
          {formatPrice(subtotal)}
        </span>
      </div>

      <button
        type="button"
        className="fl-item__remove"
        onClick={handleRemove}
        title="Remove item"
        aria-label={`Remove ${item.name} from cart`}
      >
        <Trash2 size={22} />
      </button>
    </div>
  );
};
