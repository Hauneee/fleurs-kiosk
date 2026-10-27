
import React from 'react';
import { ProductCard } from './ProductCard';
import { getStockInfo } from '../utils/stock';

export const ProductGrid = ({
  products = [],
  onSelectProduct,
  columns = 2,
  maxQuantity = 10,
}) => {
  // Keep cards responsive on phones, tablets, and larger screens.
  const minCard = columns === 2 ? 300 : 240;

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minCard}px), 1fr))`,
        gap: 'clamp(14px, 4vw, 28px)',
        width: '100%',
        maxWidth: '1080px',
        margin: '0 auto',
        padding:
          'clamp(8px, 3vw, 16px) clamp(12px, 4vw, 24px) 60px clamp(12px, 4vw, 24px)',
        boxSizing: 'border-box',
      }}
    >
      {safeProducts.map((product) => {
        const stockInfo = getStockInfo(product);

        return (
          <ProductCard
            key={product.id}
            product={{
              ...product,
              stockInfo,
            }}
            onSelect={onSelectProduct}
            maxQuantity={maxQuantity}
          />
        );
      })}
    </div>
  );
};
