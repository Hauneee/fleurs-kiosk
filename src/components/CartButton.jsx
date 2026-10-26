
import React from 'react';
import { ShoppingBag } from 'lucide-react';

export const CartButton = ({ onClick, count = 0 }) => {
  const hasItems = count > 0;

  return (
    <button
      onClick={onClick}
      className="kiosk-btn cart-btn"
      style={{
        background: hasItems
          ? 'linear-gradient(135deg, #E879A5 0%, #C2255C 100%)'
          : '#FFFFFF',
        color: hasItems ? '#FFFFFF' : '#9C1A47',
        border: '2px solid #E879A5',
        fontSize: 'clamp(0.8rem, 3.2vw, 1.15rem)',
        borderRadius: '9999px',
        boxShadow: hasItems
          ? '0 4px 14px rgba(194, 37, 92, 0.22)'
          : '0 3px 10px rgba(194, 37, 92, 0.10)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'clamp(4px, 1.5vw, 10px)',
        padding: '8px 12px',
        cursor: 'pointer',
        position: 'relative',
        flexShrink: 0,
        transition: 'all 0.2s ease',
      }}
      aria-label={`View cart with ${count} items`}
    >
      <ShoppingBag size={20} strokeWidth={2.5} />

      <span className="cart-label" style={{ fontWeight: 700 }}>
        CART
      </span>

      {hasItems && (
        <span
          style={{
            background: '#FCE7EF',
            color: '#9C1A47',
            borderRadius: '9999px',
            minWidth: 'clamp(20px, 5.5vw, 26px)',
            height: 'clamp(20px, 5.5vw, 26px)',
            padding: '0 5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(0.75rem, 3vw, 0.95rem)',
            fontWeight: 800,
            border: '2px solid #FFFFFF',
            boxShadow: '0 2px 6px rgba(156, 26, 71, 0.15)',
            boxSizing: 'border-box',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
};
