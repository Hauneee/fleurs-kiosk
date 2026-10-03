import React from 'react';
import { ShoppingBag } from 'lucide-react';

export const CartButton = ({ onClick, count = 0 }) => {
  return (
    <button
      onClick={onClick}
      className="kiosk-btn"
      style={{
        background: count > 0 ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        border: '2px dashed #93c5fd',
        padding: '12px 24px',
        fontSize: '1.15rem',
        borderRadius: '9999px',
        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        position: 'relative'
      }}
      aria-label={`View cart with ${count} items`}
    >
      <ShoppingBag size={24} strokeWidth={2.5} />
      <span style={{ fontWeight: 700 }}>CART</span>
      {count > 0 && (
        <span
          style={{
            background: '#f59e0b',
            color: '#ffffff',
            borderRadius: '9999px',
            minWidth: '26px',
            height: '26px',
            padding: '0 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.95rem',
            fontWeight: 800,
            border: '2px solid #ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
};
