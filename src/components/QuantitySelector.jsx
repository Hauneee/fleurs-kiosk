import React from 'react';
import { Minus, Plus } from 'lucide-react';

export const QuantitySelector = ({ quantity, onChange, min = 1, max = 99 }) => {
  const handleDecrement = (e) => {
    e.stopPropagation();
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '20px',
        background: '#ffffff',
        padding: '8px 16px',
        borderRadius: '9999px',
        border: '2.5px dashed #60a5fa',
        boxShadow: '0 4px 12px rgba(11, 28, 56, 0.1)'
      }}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= min}
        className="quantity-ctrl-btn"
        aria-label="Decrease quantity"
        style={{
          opacity: quantity <= min ? 0.4 : 1,
          cursor: quantity <= min ? 'not-allowed' : 'pointer'
        }}
      >
        <Minus size={28} strokeWidth={3} />
      </button>

      <span
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2.2rem',
          fontWeight: 800,
          color: '#0f274a',
          minWidth: '50px',
          textAlign: 'center'
        }}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={quantity >= max}
        className="quantity-ctrl-btn"
        aria-label="Increase quantity"
        style={{
          opacity: quantity >= max ? 0.4 : 1,
          cursor: quantity >= max ? 'not-allowed' : 'pointer'
        }}
      >
        <Plus size={28} strokeWidth={3} />
      </button>
    </div>
  );
};
