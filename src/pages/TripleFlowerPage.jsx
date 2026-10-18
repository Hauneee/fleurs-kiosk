import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { ProductGrid } from '../components/ProductGrid';
import { ProductModal } from '../components/ProductModal';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorMessage } from '../components/ErrorMessage';
import { FloralCorner } from '../components/Decorations';
import { fetchProducts } from '../services/supabase';

export const TripleFlowerPage = ({
  onBack,
  onCart,
  cartCount = 0,
  onAddToCart,
  onAdmin
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadTripleFlowers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts('triple-flower');
      setProducts(data);
    } catch (err) {
      console.error('Failed to load triple flowers:', err);
      setError('Unable to load triple flowers from the database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTripleFlowers();
  }, []);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      <FloralCorner position="top-left" />
      <FloralCorner position="top-right" />

      {/* Top Header */}
      <Header
        title="TRIPLE FLOWER"
        onBack={onBack}
        onCart={onCart}
        cartCount={cartCount}
        onAdmin={onAdmin}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <LoadingScreen message="Bundling fresh trios..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadTripleFlowers} />
        ) : (
          <div style={{ flex: 1, width: '100%' }}>
            <ProductGrid
              products={products}
              columns={3}
              onSelectProduct={(product) => setSelectedProduct(product)}
            />
          </div>
        )}
      </main>

      {/* Product Selection / Quantity Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={onAddToCart}
      />
    </div>
  );
};
