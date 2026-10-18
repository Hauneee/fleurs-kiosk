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

export const PaymentConfirmationPage = ({
  cart,
  customer,
  totalAmount,
  onBack,
  onOrderSuccess
}) => {
  const isCash = getPaymentInfo().method === 'cash';
  // Set by the payment page only after PayMongo confirmed the QR payment
  const paidRef = sessionStorage.getItem(PAY_REF_KEY) || '';
  const canSave = isCash || Boolean(paidRef);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const submittingRef = useRef(false);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    scrollToTop();
  }, []);

  const handleConfirm = async () => {
    if (submittingRef.current || cart.length === 0 || !canSave) return;

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

  // Save the order right away (cash, or QR already paid)
  useEffect(() => {
    if (canSave && !autoStartedRef.current) {
      autoStartedRef.current = true;
      handleConfirm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
      <FloralCorner position="top-left" />
      <FloralCorner position="top-right" />

      <Header
        title="PAYMENT CONFIRMATION"
        onBack={isSubmitting || paidRef ? undefined : onBack}
        showCart={false}
      />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '820px',
          margin: '0 auto',
          padding: '8px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          zIndex: 10
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
            padding: '40px 36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '22px',
            textAlign: 'center',
            background: '#ffffff'
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.2rem',
              fontWeight: 800,
              color: '#0d2547',
              letterSpacing: '0.04em'
            }}
          >
            {isCash ? 'CASH PAYMENT' : 'PAYMENT CONFIRMATION'}
          </h2>

          <p
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              color: '#1e3a8a',
              lineHeight: 1.5,
              maxWidth: '620px'
            }}
          >
            {isCash
              ? 'Saving your order. Please pay in cash to the staff.'
              : paidRef
              ? 'Payment received! Saving your order...'
              : 'We could not find a confirmed payment. Please go back and try again.'}
          </p>

          <div
            style={{
              background: '#e0f2fe',
              border: '2px dashed #60a5fa',
              borderRadius: '18px',
              padding: '14px 28px'
            }}
          >
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e40af' }}>
              {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'} ·{' '}
              {isCash ? 'AMOUNT TO PAY' : 'AMOUNT PAID'}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2.2rem',
                fontWeight: 800,
                color: '#0f274a'
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
              gap: '18px'
            }}
          >
            {isSubmitting && <Loader2 size={44} className="animate-spin" color="#1d4ed8" />}
            {(!canSave || (errorMessage && isCash)) && (
              <Button
                variant="navy"
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
