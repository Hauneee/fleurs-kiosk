import React from 'react';
import { Header } from '../components/Header';
import { CartItem } from '../components/CartItem';
import { Button } from '../components/Button';
import { FloralCorner } from '../components/Decorations';
import { ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';

// Keeps the two action buttons a comfortable size on phones / the APK
const cartCss = `
  .cart-actions > * {
    min-width: 0;
  }
  .cart-actions button {
    width: 100% !important;
    min-height: 0 !important;
    height: auto !important;
    padding: 12px 16px !important;
    font-size: clamp(0.85rem, 3.6vw, 1.05rem) !important;
    letter-spacing: 0.03em !important;
    gap: 8px !important;
    white-space: normal !important;
    line-height: 1.2 !important;
  }
  .cart-actions button svg {
    width: 20px !important;
    height: 20px !important;
    flex-shrink: 0;
  }
`;

export const CartPage = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onContinueShopping,
  onProceed
}) => {
  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative',
        paddingBottom: '72px'
      }}
    >
      <style>{cartCss}</style>

      <FloralCorner position="top-left" />
      <FloralCorner position="top-right" />

      <Header
        title="SHOPPING CART"
        onBack={onContinueShopping}
        showCart={false}
      />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '920px',
          margin: '0 auto',
          padding: 'clamp(8px, 3vw, 16px) clamp(12px, 4vw, 24px)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          boxSizing: 'border-box'
        }}
      >
        {cart.length === 0 ? (
          <div
            className="stitch-panel"
            style={{
              padding: 'clamp(28px, 8vw, 60px) clamp(14px, 4vw, 24px)',
              textAlign: 'center',
              margin: 'auto 0'
            }}
          >
            <div
              style={{
                width: 'clamp(60px, 18vw, 84px)',
                height: 'clamp(60px, 18vw, 84px)',
                borderRadius: '50%',
                background: '#ffffff',
                border: '2px dashed #93c5fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
                margin: '0 auto 20px auto'
              }}
            >
              <ShoppingBag size={36} />
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.4rem, 6vw, 2.2rem)',
                color: '#0d2547',
                marginBottom: '10px'
              }}
            >
              Your Cart is Empty
            </h2>

            <p
              style={{
                fontSize: 'clamp(0.95rem, 3.8vw, 1.2rem)',
                color: '#3b5a82',
                marginBottom: '28px',
                fontWeight: 600
              }}
            >
              Explore our handmade bouquets and fresh floral stems to begin.
            </p>

            <Button
              variant="primary"
              size="lg"
              onClick={onContinueShopping}
              icon={<ArrowLeft size={24} />}
            >
              BROWSE MENU
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 4vw, 24px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 3vw, 16px)' }}>
              {cart.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemoveItem}
                />
              ))}
            </div>

            <div
              className="stitch-panel"
              style={{
                padding: 'clamp(16px, 4.5vw, 28px) clamp(14px, 4.5vw, 32px)',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(14px, 3.5vw, 20px)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  borderBottom: '2px dashed #93c5fd',
                  paddingBottom: 'clamp(10px, 3vw, 16px)'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(1.2rem, 5vw, 1.8rem)',
                    fontWeight: 800,
                    color: '#0d2547'
                  }}
                >
                  TOTAL:
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(1.6rem, 8vw, 2.6rem)',
                    fontWeight: 800,
                    color: '#1d4ed8'
                  }}
                >
                  ₱{totalAmount.toLocaleString()}
                </span>
              </div>

              <div
                className="cart-actions"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                  gap: 'clamp(8px, 2.5vw, 14px)'
                }}
              >
                <Button
                  variant="navy"
                  size="lg"
                  onClick={onContinueShopping}
                  icon={<ArrowLeft size={20} />}
                >
                  CONTINUE SHOPPING
                </Button>

                <Button
                  variant="accent"
                  size="lg"
                  onClick={onProceed}
                  icon={<ArrowRight size={20} />}
                >
                  CHECKOUT
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};