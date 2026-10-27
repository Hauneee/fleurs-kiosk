import React from 'react';
import { BowSvg } from './Decorations';
import { getStockInfo } from '../utils/stock';

export const ProductCard = ({ product, onSelect, maxQuantity = 10 }) => {
  const stockInfo = getStockInfo(product);
  const { soldOut, low, qty } = stockInfo;

  const handleSelect = () => {
    if (soldOut || (qty !== null && qty <= 0)) return;
    onSelect?.(product);
  };

  const handleKeyDown = (event) => {
    if (soldOut) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  };

  const stockLabel =
    qty === null
      ? ''
      : soldOut
        ? 'OUT OF STOCK'
        : `ONLY ${qty} LEFT`;

  return (
    <div
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={`product-card${soldOut ? ' product-card--sold-out' : ''}`}
      role="button"
      tabIndex={soldOut ? -1 : 0}
      aria-disabled={soldOut}
      aria-label={`${product.name}, ₱${Number(product.price).toLocaleString()}${
        stockLabel ? `, ${stockLabel}` : ''
      }`}
      style={{
        position: 'relative',
        cursor: soldOut ? 'not-allowed' : 'pointer',
        opacity: soldOut ? 0.65 : 1,
        filter: soldOut ? 'grayscale(35%)' : 'none',
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

      {/* Stock Notification - Above Product Image */}
      {qty !== null && (
        <div
          role="status"
          style={{
            position: 'absolute',
            top: '48px',
            left: '12px',
            right: '12px',
            zIndex: 6,
            boxSizing: 'border-box',
            padding: '9px 12px',
            borderRadius: '12px',
            background: soldOut
              ? '#991b1b'
              : low
                ? '#fff0c2'
                : '#dcfce7',
            color: soldOut
              ? '#ffffff'
              : low
                ? '#92400e'
                : '#166534',
            border: `1px solid ${
              soldOut
                ? '#991b1b'
                : low
                  ? '#f59e0b'
                  : '#86efac'
            }`,
            fontSize: '0.8rem',
            fontWeight: 900,
            textAlign: 'center',
            letterSpacing: '0.04em',
            boxShadow: '0 3px 8px rgba(0,0,0,0.10)',
            pointerEvents: 'none',
          }}
        >
          {soldOut ? '✕ OUT OF STOCK' : `⚠ ${stockLabel}`}
        </div>
      )}

      {/* Product Image */}
      <div className="image-frame">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            style={{
              filter: soldOut ? 'grayscale(100%)' : 'none',
            }}
          />
        ) : (
          <div
            style={{
              minHeight: '120px',
              display: 'grid',
              placeItems: 'center',
              color: '#9ca3af',
            }}
          >
            No image available
          </div>
        )}
      </div>

      {/* Product Name */}
      <h3 className="product-title">{product.name}</h3>

      {/* Stock Details */}
      {qty !== null && (
        <p
          style={{
            margin: '6px 0 0',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: soldOut
              ? '#991b1b'
              : low
                ? '#92400e'
                : '#166534',
          }}
        >
          {soldOut
            ? 'Currently unavailable'
            : `${qty} ${qty === 1 ? 'item' : 'items'} remaining`}
        </p>
      )}

      {/* Selection Prompt */}
      <div
        style={{
          fontSize: '0.8rem',
          fontWeight: 800,
          color: soldOut ? '#991b1b' : '#3b82f6',
          letterSpacing: '0.04em',
          marginTop: '8px',
          textAlign: 'center',
        }}
      >
        {soldOut ? 'UNAVAILABLE' : 'TAP TO SELECT'}
      </div>
    </div>
  );
};

export default ProductCard;