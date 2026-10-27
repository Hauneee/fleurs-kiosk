
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { ProductModal } from '../components/ProductModal';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorMessage } from '../components/ErrorMessage';
import { fetchProducts, supabase } from '../services/supabase';
import { getStockInfo } from '../pages/stock';
import '../styles/shop.css';
import '../styles/light.css';

export const SoloFlowerPage = ({
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

      const data = await fetchProducts('solo-flower');

      const safeProducts = (
        Array.isArray(data) ? data : []
      ).map((product) => ({
        ...product,
        stockInfo: getStockInfo(product),
      }));

      setProducts(safeProducts);

      // Keep the open modal synchronized with the latest product data.
      setSelectedProduct((current) => {
        if (!current) return null;

        return (
          safeProducts.find(
            (product) => product.id === current.id
          ) ?? current
        );
      });

      console.info(
        '[SoloFlowerPage] Products and stock:',
        safeProducts.map((product) => ({
          name: product.name,
          stock: product.stock,
          stockInfo: product.stockInfo,
        }))
      );
    } catch (err) {
      console.error(
        'Failed to load solo flower products:',
        err
      );

      setError(
        'Unable to load solo flowers from the database. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load products when this page opens.
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Automatically reload products after Supabase changes.
  useEffect(() => {
    if (!supabase) {
      console.error(
        '[SoloFlowerPage] Supabase client is unavailable.'
      );
      return;
    }

    const channel = supabase
      .channel('kiosk-solo-flower-stock-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.info(
            '[SoloFlowerPage] Product change detected:',
            payload.eventType
          );

          loadProducts();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(
            '[SoloFlowerPage] Realtime subscription status:',
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

    if (stockInfo.qty === null || stockInfo.soldOut) {
      onLimitReached?.(
        stockInfo.soldOut
          ? 'This flower is currently out of stock.'
          : 'Stock information is unavailable. Please try again later.'
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
        title="Solo flower"
        variant="light"
        onBack={onBack}
        onCart={onCart}
        cartCount={cartCount}
        onAdmin={onAdmin}
      />

      <main className="fl-shop__main">
        {loading ? (
          <LoadingScreen message="Preparing solo flowers..." />
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={loadProducts}
          />
        ) : products.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center' }}>
            No solo flowers found.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
              gap: '20px',
              width: '100%',
              maxWidth: '1080px',
              margin: '0 auto',
              padding: '16px 20px 60px',
              boxSizing: 'border-box',
            }}
          >
            {products.map((product) => {
              const stockInfo = getStockInfo(product);
              const { qty, soldOut } = stockInfo;
              const stockUnknown = qty === null;
              const unavailable = soldOut || stockUnknown;

              return (
                <div
                  key={product.id}
                  className={`product-card${
                    soldOut ? ' product-card--sold-out' : ''
                  }`}
                  role="button"
                  tabIndex={unavailable ? -1 : 0}
                  aria-disabled={unavailable}
                  onClick={() => handleSelectProduct(product)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {
                      event.preventDefault();
                      handleSelectProduct(product);
                    }
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    background: '#ffffff',
                    cursor: unavailable ? 'not-allowed' : 'pointer',
                    opacity: soldOut ? 0.7 : 1,
                    pointerEvents: unavailable ? 'none' : 'auto',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      overflow: 'hidden',
                      borderRadius: '8px',
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
                          height: '220px',
                          objectFit: 'cover',
                          filter: soldOut
                            ? 'grayscale(100%)'
                            : 'none',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: '220px',
                          display: 'grid',
                          placeItems: 'center',
                          background: '#f3f4f6',
                        }}
                      >
                        No image available
                      </div>
                    )}
                  </div>

                  <h3
                    className="product-title"
                    style={{ margin: 0, color: '#222222' }}
                  >
                    {product.name}
                  </h3>

                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      display: 'block',
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 8px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontWeight: 900,
                      fontSize: '14px',
                      background: stockUnknown
                        ? '#e5e7eb'
                        : soldOut
                          ? '#fee2e2'
                          : qty <= 10
                            ? '#fef3c7'
                            : '#dcfce7',
                      color: stockUnknown
                        ? '#374151'
                        : soldOut
                          ? '#991b1b'
                          : qty <= 10
                            ? '#92400e'
                            : '#166534',
                    }}
                  >
                    {stockUnknown
                      ? 'STOCK UNAVAILABLE'
                      : soldOut
                        ? 'NO STOCK'
                        : `ONLY ${qty} STOCK REMAINING`}
                  </div>

                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '18px',
                      color: '#222222',
                    }}
                  >
                    ₱{Number(product.price).toLocaleString()}
                  </div>

                  <div
                    style={{
                      textAlign: 'center',
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '13px',
                      background: unavailable
                        ? '#e5e7eb'
                        : '#eff6ff',
                      color: unavailable
                        ? '#991b1b'
                        : '#1d4ed8',
                    }}
                  >
                    {soldOut
                      ? 'OUT OF STOCK'
                      : stockUnknown
                        ? 'UNAVAILABLE'
                        : 'TAP TO SELECT'}
                  </div>
                </div>
              );
            })}
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

export default SoloFlowerPage;
