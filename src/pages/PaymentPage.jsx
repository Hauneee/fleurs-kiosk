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
const QR_LIFETIME = 600; // each QR lasts 10 minutes, then a new one is made

export const PaymentPage = ({ cart = [], totalAmount, onBack, onPaid }) => {
  const [method, setMethod] = useState('gcash'); // 'gcash' | 'cash'
  const [cashReceived, setCashReceived] = useState('');

  // Dynamic QR (PayMongo)
  const [qr, setQr] = useState(null); // { id, image, testUrl }
  const [qrState, setQrState] = useState('loading'); // loading | ready | failed
  const [attempt, setAttempt] = useState(0);
  const paidRef = useRef(false);
  const intentsRef = useRef([]); // every QR made in this visit
  const [secondsLeft, setSecondsLeft] = useState(QR_LIFETIME);

  useEffect(() => {
    scrollToTop();
    sessionStorage.removeItem(PAY_REF_KEY);
  }, []);

  // Ask the server for a QR with the exact cart total
  useEffect(() => {
    if (method !== 'gcash') return;
    let cancelled = false;
    setQr(null);
    setQrState('loading');

    (async () => {
      try {
        if (!supabase) throw new Error('Supabase is not configured');
        const { data, error } = await supabase.functions.invoke('paymongo-qr', {
          body: {
            action: 'create',
            items: cart.map((i) => ({
              product_id: i.product_id || i.id,
              quantity: i.quantity
            }))
          }
        });
        if (error || !data?.qr_image) {
          throw new Error(error?.message || data?.error || 'No QR returned');
        }
        intentsRef.current.push(data.payment_intent_id);
        if (!cancelled) {
          setQr({ id: data.payment_intent_id, image: data.qr_image, testUrl: data.test_url });
          setQrState('ready');
        }
      } catch (e) {
        console.warn('Could not create a payment QR, using the shop QR instead:', e);
        if (!cancelled) setQrState('failed');
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, attempt]);

  // Check every 2 seconds if the QR has been paid
  useEffect(() => {
    if (method !== 'gcash' || qrState !== 'ready' || !qr) return;
    const timer = setInterval(async () => {
      if (paidRef.current) return;
      // check this QR and the last few older ones (an old QR may be paid late)
      for (const id of intentsRef.current.slice(-5)) {
        try {
          const { data } = await supabase.functions.invoke('paymongo-qr', {
            body: { action: 'status', payment_intent_id: id }
          });
          if (data?.status === 'succeeded' && !paidRef.current) {
            paidRef.current = true;
            sessionStorage.setItem(PAY_REF_KEY, id);
            setPaymentInfo({ method: 'gcash' });
            onPaid();
            return;
          }
        } catch (e) {
          // keep checking
        }
      }
    }, 2000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, qrState, qr]);

  // 10 minute countdown for the QR on screen
  useEffect(() => {
    if (method !== 'gcash' || qrState !== 'ready') return;
    setSecondsLeft(QR_LIFETIME);
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [method, qrState, qr]);

  // time is up: make a new QR automatically
  useEffect(() => {
    if (method === 'gcash' && qrState === 'ready' && secondsLeft <= 0) {
      setAttempt((n) => n + 1);
    }
  }, [secondsLeft, method, qrState]);

  const received = parseFloat(cashReceived) || 0;
  const change = received - totalAmount;
  const cashEnough = received >= totalAmount;
  const showConfirmButton = method === 'cash';
  const canConfirm = cashEnough;

  const quickAmounts = [totalAmount, 100, 200, 500, 1000].filter(
    (v, i, arr) => v >= totalAmount && arr.indexOf(v) === i
  );

  const handleConfirm = () => {
    if (!canConfirm) return;
    setPaymentInfo({ method: 'cash', cashReceived: received, change });
    onPaid();
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: '14px 10px',
    fontSize: '1.2rem',
    fontWeight: 800,
    borderRadius: '14px',
    border: '2px dashed #60a5fa',
    cursor: 'pointer',
    background: active ? '#1d4ed8' : '#fff',
    color: active ? '#fff' : '#1d4ed8'
  });

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

      <Header title="PAYMENT" onBack={onBack} showCart={false} />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '760px',
          margin: '0 auto',
          padding: '8px 24px',
          zIndex: 10
        }}
      >
        <div
          className="stitch-panel"
          style={{
            padding: '26px 32px 32px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button style={tabStyle(method === 'gcash')} onClick={() => setMethod('gcash')}>
              GCash
            </button>
            <button style={tabStyle(method === 'cash')} onClick={() => setMethod('cash')}>
              Cash
            </button>
          </div>

          <div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#3b5a82',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              Total Amount
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '3rem',
                fontWeight: 800,
                color: '#1d4ed8',
                lineHeight: 1.1
              }}
            >
              {formatPeso(totalAmount)}
            </div>
          </div>

          {method === 'gcash' ? (
            <>
              <div className="payment-qr-frame">
                {qrState === 'loading' && (
                  <div className="payment-qr-missing">
                    <Loader2 size={44} className="animate-spin" color="#1d4ed8" />
                    <br />
                    Preparing your QR code...
                  </div>
                )}

                {qrState === 'ready' && qr && (
                  <img src={qr.image} alt="Payment QR code" draggable={false} />
                )}

                {qrState === 'failed' && (
                  <div className="payment-qr-missing">
                    QR code unavailable.
                    <br />
                    Please try again or pay in cash.
                  </div>
                )}
              </div>

              <div>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0d2547', marginBottom: '6px' }}>
                  Scan with GCash. The amount is already set in the QR.
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e40af' }}>
                  Amount to Pay: {formatPeso(totalAmount)}
                </p>
              </div>

              {qrState === 'ready' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#1e40af'
                  }}
                >
                  <Loader2 size={22} className="animate-spin" />
                  Waiting for your payment... new QR in {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
                </div>
              )}

              {qrState === 'ready' && (
                <button
                  onClick={() => setAttempt((n) => n + 1)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: '2px dashed #60a5fa',
                    background: '#fff',
                    color: '#1d4ed8',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={18} /> Get a new QR
                </button>
              )}

              {qrState === 'ready' && qr?.testUrl && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: '#fef9c3',
                    color: '#854d0e',
                    fontSize: '0.95rem',
                    fontWeight: 700
                  }}
                >
                  TEST MODE: do not scan with a real GCash.{' '}
                  <a href={qr.testUrl} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>
                    Click here to simulate payment
                  </a>
                </div>
              )}

              {qrState === 'failed' && (
                <button
                  onClick={() => setAttempt((n) => n + 1)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: '2px dashed #60a5fa',
                    background: '#fff',
                    color: '#1d4ed8',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={18} /> Try again
                </button>
              )}
            </>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0d2547' }}>
                Pay in cash to the staff.
              </p>

              <label style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
                Cash Received
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0.00"
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '2px dashed #60a5fa',
                  color: '#0d2547',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCashReceived(String(amt))}
                    style={{
                      padding: '10px 16px',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      borderRadius: '12px',
                      border: '2px dashed #60a5fa',
                      background: '#fff',
                      color: '#1d4ed8',
                      cursor: 'pointer'
                    }}
                  >
                    {amt === totalAmount ? 'Exact' : formatPeso(amt)}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e40af' }}>
                Amount to Pay: {formatPeso(totalAmount)}
              </div>

              <div
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background: cashEnough ? '#dcfce7' : '#fee2e2',
                  color: cashEnough ? '#166534' : '#991b1b',
                  fontSize: '1.6rem',
                  fontWeight: 800
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
            <Button
              variant="accent"
              size="xl"
              className="checkout-btn-full"
              onClick={handleConfirm}
              disabled={!canConfirm}
              icon={<CheckCircle2 size={28} />}
            >
              CONFIRM CASH PAYMENT
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};
