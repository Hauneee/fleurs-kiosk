
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { ProductGrid } from '../components/ProductGrid';
import { ProductModal } from '../components/ProductModal';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorMessage } from '../components/ErrorMessage';
import { fetchProducts, supabase } from '../services/supabase';
import { getStockInfo } from './stock';
import '../styles/shop.css';
import '../styles/light.css';

export const TripleFlowerPage = ({
  onBack,
  onCart,
  cartCount = 0,
  maxQuantity = 10,
  onLimitReached,
  onAddToCart,
  onCheckoutNow,
  onAdmin,
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadProducts = useCallback(async () => {
    try {
      setError(null);

      const data = await fetchProducts('triple-flower');

      const updatedProducts = (
        Array.isArray(data) ? data : []
      ).map((product) => ({
        ...product,
        stockInfo: getStockInfo(product),
      }));

      setProducts(updatedProducts);

      // Keep an open product modal synchronized with the latest stock.
      setSelectedProduct((current) => {
        if (!current) return null;

        return (
          updatedProducts.find(
            (product) => product.id === current.id
          ) ?? current
        );
      });
    } catch (err) {
      console.error(
        'Failed to load triple flower products:',
        err
      );

      setError(
        'Unable to load triple flowers from the database. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial product load.
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Listen for product changes from the admin inventory.
  useEffect(() => {
    if (!supabase) {
      console.error(
        '[TripleFlowerPage] Supabase client is unavailable.'
      );
      return;
    }

    const channel = supabase
      .channel('kiosk-triple-flower-stock-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.info(
            '[TripleFlowerPage] Product change detected:',
            payload.eventType
          );

          loadProducts();
        }
      )
      .subscribe((status) => {
        if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT'
        ) {
          console.error(
            '[TripleFlowerPage] Realtime status:',
            status
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProducts]);

  const handleSelectProduct = (product) => {
    const stockInfo = getStockInfo(product);

    if (stockInfo.soldOut) {
      onLimitReached?.(
        'This flower is currently out of stock.'
      );
      return;
    }

    setSelectedProduct({
      ...product,
      stockInfo,
    });
  };

  return (
    <div className="fl-shop fl-light">
      <Header
        title="Triple flower"
        variant="light"
        onBack={onBack}
        onCart={onCart}
        cartCount={cartCount}
        onAdmin={onAdmin}
      />

      <main className="fl-shop__main">
        {loading ? (
          <LoadingScreen message="Preparing triple flowers..." />
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={loadProducts}
          />
        ) : (
          <div style={{ flex: 1, width: '100%' }}>
            <ProductGrid
              products={products}
              columns={3}
              onSelectProduct={handleSelectProduct}
              maxQuantity={maxQuantity}
            />
          </div>
        )}
      </main>

      <ProductModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={onAddToCart}
        onCheckoutNow={onCheckoutNow}
        maxQuantity={maxQuantity}
        onLimitReached={onLimitReached}
      />
    </div>
  );
};

export default TripleFlowerPage;
