import React from 'react';
import { BowSvg } from './Decorations';
import { getStockInfo } from '../pages/stock';

export const ProductCard = ({ product, onSelect }) => {
  const stockInfo = getStockInfo(product);
  const { soldOut, qty } = stockInfo;

  const stockUnknown = qty === null;
  const unavailable = soldOut || stockUnknown;

  const handleSelect = () => {
    // Huwag buksan ang product kapag walang stock
    // o hindi alam ang stock.
    if (unavailable) return;

    if (typeof onSelect === 'function') {
      onSelect({ ...product, stockInfo });
    }
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
      tabIndex={unavailable ? -1 : 0}
      aria-disabled={unavailable}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px',
        cursor: unavailable ? 'not-allowed' : 'pointer',
        opacity: soldOut ? 0.65 : 1,
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
              filter: soldOut ? 'grayscale(100%)' : 'none',
            }}
          />
        ) : (
          <div style={{ padding: '30px 8px', textAlign: 'center' }}>
            No image available
          </div>
        )}
      </div>

      {/* PRODUCT NAME */}
      <h3 className="product-title" style={{ margin: 0 }}>
        {product.name}
      </h3>

      {/* STOCK TEXT: directly below the product name */}
      <div
        role="status"
        aria-live="polite"
        style={{
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 8px',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '0.9rem',
          fontWeight: 900,
          lineHeight: 1.4,
          background: stockUnknown
            ? '#e5e7eb'
            : soldOut
              ? '#fee2e2'
              : qty <= 10
                ? '#fef3c7'
                : '#dcfce7',
          color: stockUnknown
            ? '#374151'
            : soldOut
              ? '#991b1b'
              : qty <= 10
                ? '#92400e'
                : '#166534',
          border: `1px solid ${
            unavailable ? '#fecaca' : '#d1d5db'
          }`,
        }}
      >
        {stockUnknown
          ? 'STOCK UNAVAILABLE'
          : soldOut
            ? 'NO STOCK'
            : `ONLY ${qty} STOCK REMAINING`}
      </div>

      {/* DISABLED LABEL WHEN OUT OF STOCK */}
      <div
        style={{
          marginTop: '4px',
          textAlign: 'center',
          fontSize: '0.8rem',
          fontWeight: 800,
          color: unavailable ? '#991b1b' : '#3b82f6',
          cursor: unavailable ? 'not-allowed' : 'pointer',
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