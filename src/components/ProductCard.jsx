
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
      {/* Decorative bow */}
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

      {/* Product price */}
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

      {/* Product image */}
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
          <div
            style={{
              padding: '30px 8px',
              textAlign: 'center',
              color: '#9d7180',
            }}
          >
            No image available
          </div>
        )}
      </div>

      {/* Product name */}
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

      {/* Stock status */}
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

      {/* Soft pink Tap to Select */}
      {!unavailable && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            boxSizing: 'border-box',
            padding: '11px 14px',
            borderRadius: '12px',
            background:
              'linear-gradient(135deg, #fff0f6 0%, #fce7f3 100%)',
            border: '1px solid #f4b8d0',
            color: '#be185d',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.09em',
            textAlign: 'center',
            boxShadow: '0 3px 8px rgba(190, 24, 93, 0.08)',
          }}
        >
          <span aria-hidden="true">♡</span>
          <span>TAP TO SELECT</span>
          <span aria-hidden="true">♡</span>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
