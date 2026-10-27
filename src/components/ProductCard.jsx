
import React from 'react';
import { BowSvg } from './Decorations';
import { getStockInfo } from '../pages/stock';

export const ProductCard = ({ product, onSelect }) => {
  const stockInfo = getStockInfo(product);
  const { soldOut, qty } = stockInfo;

  const stockUnknown = qty === null;
  const unavailable = soldOut || stockUnknown;

  const handleSelect = () => {
    if (unavailable) return;

    if (typeof onSelect === 'function') {
      onSelect({ ...product, stockInfo });
    }
  };

  const handleKeyDown = (event) => {
    if (unavailable) return;

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
      tabIndex={unavailable ? -1 : 0}
      aria-disabled={unavailable}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '12px',
        border: '1px solid #f5dce4',
        borderRadius: '16px',
        background: '#fffdfd',
        boxShadow: '0 4px 14px rgba(190, 100, 130, 0.08)',
        cursor: unavailable ? 'default' : 'pointer',
        opacity: 1,
        transition: 'box-shadow 180ms ease, transform 180ms ease',
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
        style={{
          alignSelf: 'flex-end',
          position: 'relative',
          zIndex: 3,
        }}
      >
        ₱{Number(product.price).toLocaleString()}
      </div>

      <div
        className="image-frame"
        style={{
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: '10px',
          background: '#fffafa',
          border: '1px solid #f8e8ed',
        }}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              objectFit: 'contain',
              filter: 'none',
              opacity: 1,
            }}
          />
        ) : (
          <div style={{ padding: '30px 8px', textAlign: 'center' }}>
            No image available
          </div>
        )}
      </div>

      <h3
        className="product-title"
        style={{
          margin: 0,
          textAlign: 'center',
          lineHeight: 1.35,
        }}
      >
        {product.name}
      </h3>

      <div
        role="status"
        aria-live="polite"
        style={{
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 8px',
          borderRadius: '9px',
          textAlign: 'center',
          fontSize: '0.82rem',
          fontWeight: 800,
          lineHeight: 1.4,
          letterSpacing: '0.02em',
         background: stockUnknown
  ? '#fff1f2'
  : soldOut
    ? '#fff0f3'
    : qty <= 10
      ? '#fff4c7'
      : '#fce7f3',

color: stockUnknown
  ? '#be123c'
  : soldOut
    ? '#be3455'
    : qty <= 10
      ? '#92400e'
      : '#be185d',

border: `1px solid ${
  unavailable
    ? '#f8cbd7'
    : qty <= 10
      ? '#fcd34d'
      : '#f9a8d4'
}`,
        }}
      >
        {stockUnknown
          ? 'STOCK UNAVAILABLE'
          : soldOut
            ? 'OUT OF STOCK'
            : qty <= 10
              ? `ONLY ${qty} STOCK REMAINING`
              : `${qty} IN STOCK`}
      </div>

      {!unavailable && (
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#be5678',
            padding: '4px 0',
          }}
        >
          TAP TO SELECT
        </div>
      )}
    </div>
  );
};

export default ProductCard;
