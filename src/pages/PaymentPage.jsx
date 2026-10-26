import React, { useEffect, useRef, useState } from 'react';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { FloralCorner } from '../components/Decorations';
import { scrollToTop } from '../utils/scrollToTop';
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { formatPeso } from '../utils/formatPeso';
import { setPaymentInfo } from '../utils/paymentInfo';
import { supabase } from '../services/supabase';

const PAY_REF_KEY = 'fleurs_pay_ref';
const PAY_METHOD_KEY = 'fleurs_payment_method';
const QR_LIFETIME = 600;

const COLORS = {
  pink: '#E9A3B5',
  pinkDark: '#C2255C',
  cream: '#FFF8F8',
  white: '#FFFFFF',
  text: '#684854',
  muted: '#8E5368',
  border: '#F0D5DE',
  gcash: '#007DFE',
  cash: '#D94F7D',
  warningBg: '#FFF1F4',
  warningText: '#8B5969',
  errorBg: '#FFF0F0',
  errorText: '#A34455'
};

export const PaymentPage = ({
  cart = [],
  totalAmount,
  onBack,
  onPaid
}) => {
  const [method, setMethod] = useState('gcash');
  const [cashReceived, setCashReceived] = useState('');
  const [qr, setQr] = useState(null);
  const [qrState, setQrState] = useState('loading');
  const [qrError, setQrError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(QR_LIFETIME);

  const paidRef = useRef(false);
  const intentsRef = useRef([]);
  const qrRequestRef = useRef(0);

  // Keep cart changes stable without restarting QR generation
  // merely because the parent creates a new array reference.
  const cartKey = JSON.stringify(
    cart.map((item) => ({
      product_id: item.product_id || item.id,
      quantity: Number(item.quantity) || 0
    }))
  );

  useEffect(() => {
    scrollToTop();
    sessionStorage.removeItem(PAY_REF_KEY);
    sessionStorage.removeItem(PAY_METHOD_KEY);

    paidRef.current = false;
    intentsRef.current = [];

    return () => {
      qrRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(PAY_METHOD_KEY, method);
    } catch (error) {
      console.warn('Unable to save payment method:', error);
    }
  }, [method]);

  // Create a GCash QR.
  useEffect(() => {
    if (method !== 'gcash') {
      setQr(null);
      setQrError('');
      return undefined;
    }

    let cancelled = false;
    const requestId = ++qrRequestRef.current;

    setQr(null);
    setQrError('');
    setQrState('loading');
    setSecondsLeft(QR_LIFETIME);

    const createQr = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase is not configured.');
        }

        const items = JSON.parse(cartKey);

        if (!items.length || items.some(
          (item) => !item.product_id || item.quantity < 1
        )) {
          throw new Error(
            'Your cart is empty or contains an invalid item. Please return to your cart and try again.'
          );
        }

        const { data, error } = await supabase.functions.invoke(
          'paymongo-qr',
          {
            body: {
              action: 'create',
              items
            }
          }
        );

        if (error) {
          console.error('Supabase QR function error:', error);
          throw new Error(
            error.message || 'Unable to contact the payment service.'
          );
        }

        if (data?.error) {
          console.error('Payment service error:', data.error);
          throw new Error(
            typeof data.error === 'string'
              ? data.error
              : 'The payment service could not create a QR.'
          );
        }

        if (!data?.qr_image || !data?.payment_intent_id) {
          console.error('Unexpected QR response:', data);
          throw new Error(
            'The payment service did not return a QR image and payment reference.'
          );
        }

        if (cancelled || requestId !== qrRequestRef.current) {
          return;
        }

        intentsRef.current.push(data.payment_intent_id);

        // Retain only the most recent few references.
        intentsRef.current = intentsRef.current.slice(-5);

        setQr({
          id: data.payment_intent_id,
          image: data.qr_image,
          testUrl: data.test_url || ''
        });

        setQrState('ready');
      } catch (error) {
        console.error('Could not create payment QR:', error);

        if (!cancelled && requestId === qrRequestRef.current) {
          setQr(null);
          setQrError(
            error?.message ||
            'Unable to create a QR code. Please try again.'
          );
          setQrState('failed');
        }
      }
    };

    createQr();

    return () => {
      cancelled = true;
    };
  }, [method, attempt, cartKey]);

  // Check payment status only while a QR is available.
  useEffect(() => {
    if (
      method !== 'gcash' ||
      qrState !== 'ready' ||
      !qr ||
      !supabase
    ) {
      return undefined;
    }

    let cancelled = false;
    let checking = false;

    const checkPayment = async () => {
      if (paidRef.current || checking || cancelled) return;

      checking = true;

      try {
        const id = qr.id;

        const { data, error } = await supabase.functions.invoke(
          'paymongo-qr',
          {
            body: {
              action: 'status',
              payment_intent_id: id
            }
          }
        );

        if (cancelled || paidRef.current || error) return;

        if (data?.status === 'succeeded') {
          paidRef.current = true;

          sessionStorage.setItem(PAY_REF_KEY, id);
          sessionStorage.setItem(PAY_METHOD_KEY, 'gcash');

          setPaymentInfo({
            method: 'gcash',
            paymentIntentId: id
          });

          onPaid?.();
        }
      } catch (error) {
        console.warn('Unable to check payment status:', error);
      } finally {
        checking = false;
      }
    };

    const timer = setInterval(checkPayment, 3000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [method, qrState, qr, onPaid]);

  // QR countdown.
  useEffect(() => {
    if (method !== 'gcash' || qrState !== 'ready' || !qr) {
      return undefined;
    }

    setSecondsLeft(QR_LIFETIME);

    const timer = setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [method, qrState, qr]);

  // Request a replacement QR after expiration.
  useEffect(() => {
    if (
      method === 'gcash' &&
      qrState === 'ready' &&
      secondsLeft <= 0
    ) {
      setAttempt((number) => number + 1);
    }
  }, [secondsLeft, method, qrState]);

  const received = Number.parseFloat(cashReceived) || 0;
  const amount = Number(totalAmount) || 0;
  const change = received - amount;
  const cashEnough = received >= amount;

  const showConfirmButton = method === 'cash';
  const canConfirm =
    amount > 0 &&
    cashEnough &&
    !paidRef.current;

  const quickAmounts = [
    ...new Set([amount, 100, 200, 500, 1000])
  ].filter((value) => value >= amount);

  const handleConfirm = () => {
    if (!canConfirm || paidRef.current) return;

    paidRef.current = true;

    sessionStorage.setItem(PAY_METHOD_KEY, 'cash');
    sessionStorage.removeItem(PAY_REF_KEY);

    setPaymentInfo({
      method: 'cash',
      cashReceived: received,
      change
    });

    onPaid?.();
  };

  const tabStyle = (active, paymentMethod) => {
    const isGCash = paymentMethod === 'gcash';
    const activeColor = isGCash ? COLORS.gcash : COLORS.cash;

    return {
      flex: 1,
      minHeight: '58px',
      padding: '14px 10px',
      fontSize: '1.15rem',
      fontWeight: 800,
      borderRadius: '14px',
      border: `2px solid ${active ? activeColor : '#E8C7D1'}`,
      cursor: 'pointer',
      background: active ? activeColor : COLORS.white,
      color: active ? COLORS.white : activeColor,
      boxShadow: active
        ? `0 5px 14px ${
            isGCash
              ? 'rgba(0, 125, 254, 0.25)'
              : 'rgba(217, 79, 125, 0.25)'
          }`
        : 'none',
      transition: 'background 0.2s ease, box-shadow 0.2s ease'
    };
  };

  const utilityButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minHeight: '46px',
    padding: '10px 18px',
    borderRadius: '12px',
    border: `2px solid ${COLORS.border}`,
    background: COLORS.white,
    color: COLORS.pinkDark,
    fontWeight: 800,
    cursor: 'pointer'
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative',
        paddingBottom: '40px',
        background: COLORS.cream,
        color: COLORS.text
      }}
    >
      <FloralCorner position="top-left" />
      <FloralCorner position="top-right" />

      <Header
        title="Payment"
        onBack={onBack}
        showCart={false}
        variant="light"
      />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '760px',
          margin: '0 auto',
          padding: '12px 20px 28px',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div
          className="stitch-panel payment-panel"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: 'clamp(20px, 4vw, 32px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '22px',
            textAlign: 'center',
            background: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '24px',
            boxShadow: '0 12px 32px rgba(155, 65, 97, 0.12)'
          }}
        >
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button
              type="button"
              aria-pressed={method === 'gcash'}
              style={tabStyle(method === 'gcash', 'gcash')}
              onClick={() => setMethod('gcash')}
            >
              GCash
            </button>

            <button
              type="button"
              aria-pressed={method === 'cash'}
              style={tabStyle(method === 'cash', 'cash')}
              onClick={() => setMethod('cash')}
            >
              Cash
            </button>
          </div>

          <div style={{ width: '100%' }}>
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: '#000',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}
            >
              Total Amount
            </div>

            <div
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontSize: 'clamp(2.3rem, 8vw, 3rem)',
                fontWeight: 800,
                color: '#000',
                lineHeight: 1.15,
                overflowWrap: 'anywhere'
              }}
            >
              {formatPeso(amount)}
            </div>
          </div>

          {method === 'gcash' ? (
            <>
              <div
                className="payment-qr-frame"
                style={{
                  width: 'min(82vw, 340px)',
                  aspectRatio: '1 / 1',
                  boxSizing: 'border-box',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: COLORS.white,
                  border: `2px solid ${COLORS.pink}`,
                  borderRadius: '20px',
                  boxShadow: '0 8px 24px rgba(201, 111, 139, 0.12)'
                }}
              >
                {qrState === 'loading' && (
                  <div
                    style={{
                      color: COLORS.pinkDark,
                      fontWeight: 700,
                      lineHeight: 1.6
                    }}
                  >
                    <Loader2
                      size={44}
                      className="animate-spin"
                      color={COLORS.gcash}
                    />
                    <br />
                    Preparing your QR code...
                  </div>
                )}

                {qrState === 'ready' && qr && (
                  <img
                    src={qr.image}
                    alt="GCash payment QR code"
                    draggable={false}
                    onError={() => {
                      console.error('QR image failed to load:', qr.image);
                      setQrError(
                        'The QR image could not be displayed. Please get a new QR.'
                      );
                      setQrState('failed');
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                )}

                {qrState === 'failed' && (
                  <div
                    style={{
                      padding: '12px',
                      color: COLORS.pinkDark,
                      fontWeight: 700,
                      lineHeight: 1.6,
                      overflowWrap: 'anywhere'
                    }}
                  >
                    <RefreshCw
                      size={36}
                      style={{ display: 'block', margin: '0 auto 12px' }}
                    />
                    QR code unavailable.
                    <br />
                    {qrError || 'Please try again or pay in cash.'}
                  </div>
                )}
              </div>

              <div style={{ width: '100%' }}>
                <p
                  style={{
                    fontSize: '1.1rem',
                    lineHeight: 1.5,
                    fontWeight: 800,
                    color: '#000',
                    margin: '0 0 8px'
                  }}
                >
                  Scan with GCash
                </p>

                <p
                  style={{
                    fontSize: '1rem',
                    lineHeight: 1.5,
                    fontWeight: 700,
                    color: '#000',
                    margin: 0
                  }}
                >
                  The amount is already set in the QR.
                </p>

                <p
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#000',
                    margin: '12px 0 0'
                  }}
                >
                  Amount to Pay: {formatPeso(amount)}
                </p>
              </div>

              {qrState === 'ready' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#000'
                  }}
                >
                  <Loader2
                    size={20}
                    className="animate-spin"
                    color="#000"
                  />
                  <span>
                    Waiting for payment · New QR in{' '}
                    {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
                    {String(secondsLeft % 60).padStart(2, '0')}
                  </span>
                </div>
              )}

              {qrState === 'ready' && (
                <button
                  type="button"
                  onClick={() => setAttempt((number) => number + 1)}
                  style={utilityButtonStyle}
                >
                  <RefreshCw size={18} />
                  Get a new QR
                </button>
              )}

              {qrState === 'failed' && (
                <button
                  type="button"
                  onClick={() => setAttempt((number) => number + 1)}
                  style={utilityButtonStyle}
                >
                  <RefreshCw size={18} />
                  Try again
                </button>
              )}

              {qrState === 'ready' && qr?.testUrl && (
                <div
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: COLORS.warningBg,
                    color: COLORS.warningText,
                    border: `1px solid ${COLORS.border}`,
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    fontWeight: 700,
                    overflowWrap: 'anywhere'
                  }}
                >
                  TEST MODE: do not scan with a real GCash.{' '}
                  <a
                    href={qr.testUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: COLORS.pinkDark,
                      textDecorationColor: COLORS.pink
                    }}
                  >
                    Click here to simulate payment
                  </a>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: '#FFF1F5',
                  border: '1px solid #F5D1DD'
                }}
              >
                <p
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: COLORS.text,
                    margin: '0 0 6px'
                  }}
                >
                  Cash Payment
                </p>

                <p
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    color: COLORS.muted,
                    margin: 0
                  }}
                >
                  Enter the amount received from the customer.
                </p>
              </div>

              <label
                htmlFor="cash-received"
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: COLORS.pinkDark,
                  textAlign: 'left'
                }}
              >
                Cash Received (₱)
              </label>

              <input
                id="cash-received"
                type="number"
                inputMode="decimal"
                min="0"
                value={cashReceived}
                onChange={(event) => setCashReceived(event.target.value)}
                placeholder="0.00"
                style={{
                  fontSize: 'clamp(1.7rem, 6vw, 2rem)',
                  fontWeight: 800,
                  textAlign: 'center',
                  padding: '14px',
                  borderRadius: '14px',
                  border: `2px solid ${COLORS.pink}`,
                  color: COLORS.text,
                  background: COLORS.white,
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}
              >
                {quickAmounts.map((value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setCashReceived(String(value))}
                    style={{
                      minHeight: '44px',
                      padding: '10px 16px',
                      fontSize: '1rem',
                      fontWeight: 800,
                      borderRadius: '12px',
                      border: `2px solid ${COLORS.border}`,
                      background: COLORS.white,
                      color: '#000',
                      cursor: 'pointer'
                    }}
                  >
                    {value === amount ? 'Exact' : formatPeso(value)}
                  </button>
                ))}
              </div>

              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: COLORS.pinkDark
                }}
              >
                Amount to Pay: {formatPeso(amount)}
              </div>

              <div
                aria-live="polite"
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background:
                    received === 0
                      ? COLORS.warningBg
                      : cashEnough
                      ? '#EAF8EE'
                      : COLORS.errorBg,
                  color:
                    received === 0
                      ? COLORS.warningText
                      : cashEnough
                      ? '#246B3B'
                      : COLORS.errorText,
                  border: `1px solid ${
                    received === 0
                      ? '#F1D5DC'
                      : cashEnough
                      ? '#B7E2C1'
                      : '#F1C5C5'
                  }`,
                  fontSize: 'clamp(1.15rem, 4vw, 1.4rem)',
                  fontWeight: 800,
                  overflowWrap: 'anywhere'
                }}
              >
                {received === 0
                  ? 'Enter the cash received'
                  : cashEnough
                  ? `Change: ${formatPeso(change)}`
                  : `Kulang pa: ${formatPeso(-change)}`}
              </div>
            </div>
          )}

          {showConfirmButton && (
            <div style={{ width: '100%' }}>
              <Button
                variant="accent"
                size="xl"
                className="checkout-btn-full"
                onClick={handleConfirm}
                disabled={!canConfirm}
                icon={<CheckCircle2 size={24} />}
              >
                CONFIRM CASH PAYMENT
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;