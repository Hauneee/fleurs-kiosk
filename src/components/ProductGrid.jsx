import React from 'react';
import { ProductCard } from './ProductCard';
import { getStockInfo } from '../pages/stock';

export const ProductGrid = ({
  products = [],
  onSelectProduct,
  columns = 2,
  maxQuantity = 10,
}) => {
  const minCard = columns === 2 ? 300 : 240;
  const safeProducts = Array.isArray(products) ? products : [];

  // Debug: check whether stock data is reaching the product cards.
  console.table(
    safeProducts.map((product) => ({
      name: product.name,
      stock: product.stock,
      category: product.category,
      is_active: product.is_active,
      computedQty: getStockInfo(product).qty,
    }))
  );

  return (
    <div
      className="product-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minCard}px), 1fr))`,
        gap: 'clamp(14px, 4vw, 28px)',
        width: '100%',
        maxWidth: '1080px',
        margin: '0 auto',
        padding:
          'clamp(8px, 3vw, 16px) clamp(12px, 4vw, 24px) 60px',
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

export default ProductGrid;