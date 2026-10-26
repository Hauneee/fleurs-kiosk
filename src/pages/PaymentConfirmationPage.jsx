
import React, { useEffect, useRef, useState } from 'react';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { FloralCorner } from '../components/Decorations';
import { scrollToTop } from '../utils/scrollToTop';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createOrder } from '../services/supabase';
import { formatPeso } from '../utils/formatPeso';
import { getPaymentInfo } from '../utils/paymentInfo';

const PAY_REF_KEY = 'fleurs_pay_ref';

const COLORS = {
  pink: '#E879A5',
  lightPink: '#F8C9DA',
  blush: '#FCE7EF',
  darkPink: '#C2255C',
  wine: '#9C1A47',
  darkText: '#3F1424',
  mutedText: '#684854',
  white: '#FFFFFF',
};

export const PaymentConfirmationPage = ({
  cart,
  customer,
  totalAmount,
  onBack,
  onOrderSuccess
}) => {
  const isCash = getPaymentInfo().method === 'cash';
  const paidRef = sessionStorage.getItem(PAY_REF_KEY) || '';
  const canSave = isCash || Boolean(paidRef);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    scrollToTop();
  }, []);

  const handleConfirm = async () => {
    if (submittingRef.current || cart.length === 0 || !canSave) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const completedOrder = await createOrder(
        {
          total_amount: totalAmount,
          customer,
          payment_reference: isCash ? 'CASH' : paidRef
        },
        cart
      );

      sessionStorage.removeItem(PAY_REF_KEY);
      onOrderSuccess(completedOrder);
    } catch (err) {
      console.error('Order confirmation failed:', err);

      setErrorMessage(
        err.message ||
          'Unable to connect to the server. Please check the connection and try again.'
      );

      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const itemCount = cart.reduce(
    (sum, item) => sum + item.quantity,
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
        paddingBottom: '72px',
        background: '#FFFAFC',
      }}
    >
      <FloralCorner position="top-left" />
      <FloralCorner position="top-right" />

      <Header
        title="PAYMENT CONFIRMATION"
        onBack={isSubmitting || paidRef ? undefined : onBack}
        showCart={false}
        variant="light"
      />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '820px',
          boxSizing: 'border-box',
          margin: '0 auto',
          padding: '8px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        {errorMessage && (
          <ErrorMessage
            message={errorMessage}
            onRetry={handleConfirm}
            actionLabel="TRY AGAIN"
          />
        )}

        <div
          className="stitch-panel"
          style={{
            boxSizing: 'border-box',
            width: '100%',
            padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 36px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '22px',
            textAlign: 'center',
            background: COLORS.white,
            border: '1px solid #F8C9DA',
            borderRadius: '24px',
            boxShadow: '0 10px 30px rgba(194, 37, 92, 0.08)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
              fontWeight: 800,
              color: COLORS.darkText,
              letterSpacing: '0.04em',
            }}
          >
            {isCash ? 'CASH PAYMENT' : 'PAYMENT CONFIRMATION'}
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: 'clamp(1rem, 3vw, 1.2rem)',
              fontWeight: 700,
              color: COLORS.mutedText,
              lineHeight: 1.5,
              maxWidth: '620px',
            }}
          >
            {isCash
              ? 'Please confirm your order. Pay in cash to the staff.'
              : paidRef
              ? 'Payment received! Please confirm your order.'
              : 'We could not find a confirmed payment. Please go back and try again.'}
          </p>

          <div
            style={{
              boxSizing: 'border-box',
              maxWidth: '100%',
              background: COLORS.blush,
              border: `2px dashed ${COLORS.pink}`,
              borderRadius: '18px',
              padding: '14px clamp(16px, 5vw, 28px)',
            }}
          >
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: COLORS.wine,
                letterSpacing: '0.03em',
              }}
            >
              {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'} ·{' '}
              {isCash ? 'AMOUNT TO PAY' : 'AMOUNT PAID'}
            </div>

            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.7rem, 6vw, 2.2rem)',
                fontWeight: 800,
                color: COLORS.darkText,
                overflowWrap: 'anywhere',
              }}
            >
              {formatPeso(totalAmount)}
            </div>
          </div>

          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '18px',
            }}
          >
            {isSubmitting && (
              <Loader2
                size={44}
                className="animate-spin"
                color={COLORS.darkPink}
                aria-label="Processing order"
              />
            )}

            {canSave && (
              <Button
                variant="primary"
                size="xl"
                onClick={handleConfirm}
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting
                  ? 'PROCESSING ORDER...'
                  : 'CONFIRM ORDER'}
              </Button>
            )}

            {!canSave && (
              <Button
                variant="primary"
                size="xl"
                onClick={onBack}
                icon={<ArrowLeft size={24} />}
              >
                BACK TO PAYMENT
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
