import React from 'react';
import { ProductCard } from './ProductCard';

export const ProductGrid = ({ products, onSelectProduct, columns = 2 }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: columns === 2 ? 'repeat(auto-fit, minmax(320px, 1fr))' : 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '28px',
        width: '100%',
        maxWidth: '1080px',
        margin: '0 auto',
        padding: '16px 24px 60px 24px'
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
