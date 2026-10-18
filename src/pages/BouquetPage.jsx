import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { ProductGrid } from '../components/ProductGrid';
import { ProductModal } from '../components/ProductModal';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorMessage } from '../components/ErrorMessage';
import { FloralCorner } from '../components/Decorations';
import { fetchProducts } from '../services/supabase';

export const BouquetPage = ({
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

  const loadBouquets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts('bouquet');
      setProducts(data);
    } catch (err) {
      console.error('Failed to load bouquets:', err);
      setError('Unable to load bouquets from the database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBouquets();
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

      {/* Top Header: Back, BOUQUET, Cart */}
      <Header
        title="BOUQUET"
        onBack={onBack}
        onCart={onCart}
        cartCount={cartCount}
        onAdmin={onAdmin}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <LoadingScreen message="Arranging signature bouquets..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadBouquets} />
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
