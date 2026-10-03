import React, { useState } from 'react';
import { Header } from '../components/Header';
import { CartItem } from '../components/CartItem';
import { Button } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { FloralCorner } from '../components/Decorations';
import { ShoppingBag, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { createOrder } from '../services/supabase';

export const CartPage = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onContinueShopping,
  onOrderSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Save order to Supabase first!
      const completedOrder = await createOrder(
        { total_amount: totalAmount },
        cart
      );

      // Only navigate to confirmation after database operation succeeds
      onOrderSuccess(completedOrder);
    } catch (err) {
      console.error('Checkout failed:', err);
      setErrorMessage(
        err.message ||
          'Unable to connect to the server. Please check the connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative',
        paddingBottom: '40px'
      }}
    >
      <FloralCorner position="top-left" />
      <FloralCorner position="top-right" />

      {/* Top Header */}
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
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10
        }}
      >
        {errorMessage && (
          <ErrorMessage
            message={errorMessage}
            onRetry={handleCheckout}
            actionLabel="RETRY CHECKOUT"
          />
        )}

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div
            className="stitch-panel"
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              margin: 'auto 0'
            }}
          >
            <div
              style={{
                width: '84px',
                height: '84px',
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
              <ShoppingBag size={42} />
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2.2rem',
                color: '#0d2547',
                marginBottom: '10px'
              }}
            >
              Your Cart is Empty
            </h2>

            <p
              style={{
                fontSize: '1.2rem',
                color: '#3b5a82',
                marginBottom: '32px',
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
          /* Cart Items List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cart.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemoveItem}
                />
              ))}
            </div>

            {/* Order Summary & Actions */}
            <div
              className="stitch-panel"
              style={{
                padding: '28px 32px',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '2px dashed #93c5fd',
                  paddingBottom: '16px'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: '#0d2547'
                  }}
                >
                  TOTAL:
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '2.6rem',
                    fontWeight: 800,
                    color: '#1d4ed8'
                  }}
                >
                  ₱{totalAmount.toLocaleString()}
                </span>
              </div>

              {/* Action Buttons: CONTINUE SHOPPING & CHECKOUT */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '18px'
                }}
              >
                <Button
                  variant="navy"
                  size="xl"
                  onClick={onContinueShopping}
                  disabled={isSubmitting}
                  icon={<ArrowLeft size={24} />}
                >
                  CONTINUE SHOPPING
                </Button>

                <Button
                  variant="accent"
                  size="xl"
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  icon={
                    isSubmitting ? (
                      <Loader2 size={26} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={26} />
                    )
                  }
                >
                  {isSubmitting ? 'SAVING ORDER...' : 'CHECKOUT'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
