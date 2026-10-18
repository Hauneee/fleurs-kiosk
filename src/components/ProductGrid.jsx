import React from 'react';
import { ProductCard } from './ProductCard';

export const ProductGrid = ({ products, onSelectProduct, columns = 2 }) => {
  // min(100%, X) lets one card shrink to fit any phone width.
  // Wider screens automatically fit 2 or 3 cards per row.
  const minCard = columns === 2 ? 300 : 240;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minCard}px), 1fr))`,
        gap: 'clamp(14px, 4vw, 28px)',
        width: '100%',
        maxWidth: '1080px',
        margin: '0 auto',
        padding: 'clamp(8px, 3vw, 16px) clamp(12px, 4vw, 24px) 60px clamp(12px, 4vw, 24px)',
        boxSizing: 'border-box'
      }}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={onSelectProduct}
        />
      ))}
    </div>
  );
};