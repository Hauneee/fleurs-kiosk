
import React from 'react';
import { BowSvg } from './Decorations';
import { getStockInfo } from '../utils/stock';

export const ProductCard = ({ product, onSelect }) => {
  const stockInfo = product.stockInfo || getStockInfo(product);
  const { soldOut, low, qty } = stockInfo;
  const stockUnknown = qty === null;

  const handleSelect = () => {
    if (soldOut || stockUnknown) return;
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
      className={`product-card${soldOut ? ' product-card--sold-out' : ''}`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={soldOut || stockUnknown ? -1 : 0}
      aria-disabled={soldOut || stockUnknown}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px',
        cursor: soldOut || stockUnknown ? 'not-allowed' : 'pointer',
        opacity: soldOut ? 0.7 : 1,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '10px',
          left: '14px',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <BowSvg style={{ width: '42px', height: '26px' }} />
      </div>

      <div
        className="price-badge"
        style={{ alignSelf: 'flex-end', position: 'relative', zIndex: 3 }}
      >
        ₱{Number(product.price).toLocaleString()}
      </div>

      <div
        role="status"
        style={{
          width: '100%',
          padding: '10px 8px',
          borderRadius: '10px',
          boxSizing: 'border-box',
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: 900,
          background: stockUnknown
            ? '#e5e7eb'
            : soldOut
              ? '#991b1b'
              : low
                ? '#fff0c2'
                : '#dcfce7',
          color: stockUnknown
            ? '#374151'
            : soldOut
              ? '#ffffff'
              : low
                ? '#92400e'
                : '#166534',
          border: '1px solid #d1d5db',
        }}
      >
        {stockUnknown
          ? 'STOCK UNKNOWN'
          : soldOut
            ? 'OUT OF STOCK'
            : `ONLY ${qty} LEFT`}
      </div>

      <div
        className="image-frame"
        style={{ width: '100%', overflow: 'hidden', position: 'relative' }}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            style={{
              display: 'block',
              width: '100%',
              filter: soldOut ? 'grayscale(100%)' : 'none',
            }}
          />
        ) : (
          <div style={{ padding: '30px 8px', textAlign: 'center' }}>
            No image available
          </div>
        )}
      </div>

      <h3 className="product-title" style={{ margin: 0 }}>
        {product.name}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: '0.85rem',
          fontWeight: 700,
          color: stockUnknown || soldOut ? '#991b1b' : low ? '#92400e' : '#166534',
        }}
      >
        {stockUnknown
          ? 'Stock information unavailable'
          : soldOut
            ? 'Currently unavailable'
            : `${qty} ${qty === 1 ? 'item' : 'items'} remaining`}
      </p>

      <div
        style={{
          marginTop: '4px',
          textAlign: 'center',
          fontSize: '0.8rem',
          fontWeight: 800,
          color: soldOut || stockUnknown ? '#991b1b' : '#3b82f6',
        }}
      >
        {soldOut
          ? 'OUT OF STOCK'
          : stockUnknown
            ? 'UNAVAILABLE'
            : 'TAP TO SELECT'}
      </div>
    </div>
  );
};

export default ProductCard;
