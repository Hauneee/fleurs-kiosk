import React from 'react';
import { BowSvg } from './Decorations';

export const ProductCard = ({ product, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(product)}
      className="product-card"
      role="button"
      tabIndex={0}
      aria-label={`Select ${product.name} for ₱${product.price}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(product);
        }
      }}
    >
      {/* Decorative Bow Pin Top-Left */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '14px',
          zIndex: 4,
          opacity: 0.95
        }}
      >
        <BowSvg style={{ width: '42px', height: '26px' }} />
      </div>

      {/* Price Badge Prominently Displayed Near Upper-Right */}
      <div className="price-badge">
        ₱{Number(product.price).toLocaleString()}
      </div>

      {/* Large White Image Area with Centered Product Graphic */}
      <div className="image-frame">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
        />
      </div>

      {/* Product Name Near the Bottom */}
      <h3 className="product-title">
        {product.name}
      </h3>

      {/* Subtle touch prompt */}
      <div
        style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#3b82f6',
          letterSpacing: '0.05em',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <span>TAP TO SELECT</span>
      </div>
    </div>
  );
};
