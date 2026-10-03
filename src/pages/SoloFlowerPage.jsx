import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { ProductGrid } from '../components/ProductGrid';
import { ProductModal } from '../components/ProductModal';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorMessage } from '../components/ErrorMessage';
import { FloralCorner } from '../components/Decorations';
import { fetchProducts } from '../services/supabase';

export const SoloFlowerPage = ({
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

  const loadSoloFlowers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts('solo-flower');
      setProducts(data);
    } catch (err) {
      console.error('Failed to load solo flowers:', err);
      setError('Unable to load solo flowers from the database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSoloFlowers();
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
        title="SOLO FLOWER"
        onBack={onBack}
        onCart={onCart}
        cartCount={cartCount}
        onAdmin={onAdmin}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <LoadingScreen message="Harvesting single stems..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadSoloFlowers} />
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
