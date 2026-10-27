
import React from 'react';
import { BowSvg } from './Decorations';
import { getStockInfo } from '../utils/stock';

export const ProductCard = ({ product, onSelect, maxQuantity = 10 }) => {
  const stockInfo = product.stockInfo || getStockInfo(product);
  const { soldOut, low, qty, label } = stockInfo;

  const handleSelect = () => {
    if (soldOut) return;
    onSelect?.(product);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  };

  return (
    <div
      onClick={handleSelect}
      className={`product-card${soldOut ? ' product-card--sold-out' : ''}`}
      role="button"
      tabIndex={soldOut ? -1 : 0}
      aria-disabled={soldOut}
      aria-label={`${product.name}, ₱${Number(product.price).toLocaleString()}${
        label ? `, ${label}` : ''
      }`}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        cursor: soldOut ? 'not-allowed' : 'pointer',
        opacity: soldOut ? 0.65 : 1,
      }}
    >
      {/* Decorative Bow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '10px',
          left: '14px',
          zIndex: 4,
          opacity: 0.95,
          pointerEvents: 'none',
        }}
      >
        <BowSvg style={{ width: '42px', height: '26px' }} />
      </div>

      {/* Price Badge */}
      <div className="price-badge">
        ₱{Number(product.price).toLocaleString()}
      </div>

      {/* Stock Badge */}
      {label && (
        <div
          role="status"
          style={{
            position: 'absolute',
            top: '48px',
            right: '10px',
            zIndex: 5,
            padding: '6px 10px',
            borderRadius: '999px',
            background: soldOut ? '#991b1b' : low ? '#fef3c7' : '#dcfce7',
            color: soldOut ? '#ffffff' : low ? '#92400e' : '#166534',
            fontSize: '0.75rem',
            fontWeight: 800,
            maxWidth: 'calc(100% - 20px)',
            textAlign: 'center',
          }}
        >
          {label}
        </div>
      )}

      {/* Product Image */}
      <div className="image-frame">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          style={{
            filter: soldOut ? 'grayscale(75%)' : 'none',
          }}
        />
      </div>

      {/* Product Name */}
      <h3 className="product-title">{product.name}</h3>

      {/* Stock Details */}
      {qty !== null && (
        <p
          style={{
            margin: '6px 0 0',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: soldOut ? '#991b1b' : low ? '#92400e' : '#166534',
          }}
        >
          {soldOut ? 'Currently unavailable' : `${qty} available`}
        </p>
      )}

      {/* Selection Prompt */}
      <div
        style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: soldOut ? '#9ca3af' : '#3b82f6',
          letterSpacing: '0.05em',
          marginTop: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>{soldOut ? 'OUT OF STOCK' : 'TAP TO SELECT'}</span>
      </div>
    </div>
  );
};
