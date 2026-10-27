
import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { FloralCorner } from '../components/Decorations';
import { createOrder } from '../services/orders';
import { formatPeso } from '../utils/formatPeso';
import { getPaymentInfo } from '../utils/paymentInfo';

export const PaymentConfirmationPage = ({
  cart = [],
  customer,
  totalAmount,
  onBack,
  onOrderSuccess
}) => {
  const paymentInfo = getPaymentInfo();
  const isCash = paymentInfo.method === 'cash';
  const cashReceived = Number(paymentInfo.cashReceived) || 0;
  const amount = Number(totalAmount) || 0;
  const change = Math.max(0, cashReceived - amount);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paidRef =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('fleurs_pay_ref')
      : null;

  const canSave = isCash
    ? amount > 0 && cashReceived >= amount
    : Boolean(paidRef);

  const handleConfirm = async () => {
    if (loading) return;

    if (!canSave) {
      setError(
        isCash
          ? 'Please return to Payment and enter enough cash.'
          : 'Please complete and verify the GCash payment first.'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const order = await createOrder({
        cart,
        customer,
        totalAmount: amount,
        amount_paid: isCash ? cashReceived : amount,
        change_amount: isCash ? change : 0,
        payment_method: isCash ? 'cash' : 'gcash',
        payment_reference: isCash ? null : paidRef
      });

      if (!order) {
        throw new Error('Unable to save the order. Please try again.');
      }

      onOrderSuccess?.(order);
    } catch (err) {
      console.error('Order save failed:', err);
      setError(
        err?.message || 'Unable to save the order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: '100vh',
        paddingBottom: 40,
        background: '#FFF8F8',
        color: '#684854',
        position: 'relative'
      }}
    >
      <FloralCorner position="top-left" />
      <FloralCorner position="top-right" />

      <Header
        title="Confirm Payment"
        onBack={onBack}
        showCart={false}
        variant="light"
      />

      <main
        style={{
          width: '100%',
          maxWidth: 680,
          margin: '0 auto',
          padding: '20px',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1
        }}
      >
        <section
          className="stitch-panel"
          style={{
            background: '#FFFFFF',
            border: '1px solid #F0D5DE',
            borderRadius: 24,
            padding: 'clamp(20px, 4vw, 32px)',
            boxShadow: '0 12px 32px rgba(155, 65, 97, 0.12)'
          }}
        >
          <h2 style={{ marginTop: 0, textAlign: 'center' }}>
            Payment Summary
          </h2>

          <div
            style={{
              padding: 18,
              background: '#FFF1F5',
              borderRadius: 16,
              marginBottom: 16
            }}
          >
            <p style={{ margin: '0 0 8px', fontWeight: 700 }}>
              Payment Method
            </p>
            <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              {isCash ? 'Cash' : 'GCash'}
            </p>
          </div>

          <div
            style={{
              padding: 18,
              border: '1px solid #F0D5DE',
              borderRadius: 16,
              marginBottom: 16
            }}
          >
            <p style={{ margin: '0 0 8px' }}>Total Amount</p>
            <p
              style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: 800,
                overflowWrap: 'anywhere'
              }}
            >
              {formatPeso(amount)}
            </p>
          </div>

          {isCash && (
            <div
              style={{
                padding: 18,
                background: '#EAF8EE',
                border: '1px solid #B7E2C1',
                borderRadius: 16,
                marginBottom: 16,
                color: '#246B3B'
              }}
            >
              <p style={{ margin: '0 0 8px', fontWeight: 700 }}>
                Cash Received
              </p>
              <p style={{ margin: '0 0 16px', fontSize: '1.4rem', fontWeight: 800 }}>
                {formatPeso(cashReceived)}
              </p>

              <p style={{ margin: '0 0 8px', fontWeight: 700 }}>
                Sukli
              </p>
              <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                {formatPeso(change)}
              </p>
            </div>
          )}

          {!isCash && (
            <div
              style={{
                padding: 16,
                background: '#EAF8EE',
                border: '1px solid #B7E2C1',
                borderRadius: 16,
                color: '#246B3B',
                marginBottom: 16
              }}
            >
              GCash payment verified.
            </div>
          )}

          {error && (
            <div style={{ marginBottom: 16 }}>
              <ErrorMessage message={error} />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Button
              variant="accent"
              size="xl"
              className="checkout-btn-full"
              onClick={handleConfirm}
              disabled={!canSave || loading}
            >
              {loading ? 'SAVING ORDER...' : 'SAVE AND CONTINUE'}
            </Button>

            <Button
              variant="secondary"
              size="xl"
              className="checkout-btn-full"
              onClick={onBack}
              disabled={loading}
            >
              BACK TO PAYMENT
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PaymentConfirmationPage;
