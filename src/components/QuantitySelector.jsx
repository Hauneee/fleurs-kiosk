import React from 'react';
import { Minus, Plus } from 'lucide-react';

export const QuantitySelector = ({ quantity, onChange, min = 1, max = 99 }) => {
  const handleDecrement = (e) => {
    e.stopPropagation();
    if (quantity > min) onChange(quantity - 1);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (quantity < max) onChange(quantity + 1);
  };

  return (
    <div className="fl-qty">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= min}
        className="fl-round fl-round--lg"
        aria-label="Decrease quantity"
      >
        <Minus size={26} strokeWidth={3} />
      </button>

      <span className="fl-qty__value">{quantity}</span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={quantity >= max}
        className="fl-round fl-round--lg"
        aria-label="Increase quantity"
      >
        <Plus size={26} strokeWidth={3} />
      </button>
    </div>
  );
};
