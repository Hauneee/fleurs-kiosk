import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BowSvg, FloralCorner } from '../components/Decorations';
import { Button } from '../components/Button';
import { SearchCheck, ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import { trackOrder } from '../services/supabase';

const REFRESH_MS = 5000; // how often the result refreshes by itself
const IDLE_MS = 120000; // go back to the start screen after 2 minutes of no touching
const MAX_MISSES = 5; // wrong tries before a short pause
const LOCK_MS = 30000;

// The three steps the customer sees
const STEPS = ['Order Received', 'Confirmed', 'Completed'];

// Status text shown to the customer. Unknown statuses fall back to a readable label.
const STATUS_INFO = {
  pending: { step: 0, title: 'Order Received', text: 'We have your order and will confirm it shortly.' },
  confirmed: { step: 1, title: 'Order Confirmed', text: 'Your order is confirmed and is being prepared.' },
  preparing: { step: 1, title: 'Being Prepared', text: 'Your order is being prepared.' },
  ready: { step: 1, title: 'Ready for Pickup', text: 'Your order is ready. Please see our staff.' },
  completed: { step: 2, title: 'Order Completed', text: 'Your order is complete. Thank you!' },
  cancelled: { step: -1, title: 'Order Cancelled', text: 'This order was cancelled. Please ask our staff if you have questions.' }
};

const PAYMENT_INFO = {
  paid: { label: 'Payment verified', tone: 'good' },
  payment_submitted: { label: 'Payment being verified', tone: 'wait' },
  pending: { label: 'Payment being verified', tone: 'wait' },
  unpaid: { label: 'Payment not received - please see our staff', tone: 'bad' },
  rejected: { label: 'Payment could not be verified - please see our staff', tone: 'bad' },
  failed: { label: 'Payment could not be verified - please see our staff', tone: 'bad' },
  refunded: { label: 'Payment refunded', tone: 'wait' }
};

const prettify = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const TrackOrderPage = ({ initialOrderNumber = '', onBack }) => {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber.replace(/\D/g, ''));
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [misses, setMisses] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [lastChecked, setLastChecked] = useState(null);

  const phoneRef = useRef(null);
  const lookupRef = useRef({ number: '', phone: '' });
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  // Tick once a second only while the "wait a moment" lock is active
  const locked = lockedUntil > now;
  useEffect(() => {
    if (!locked) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [locked]);

  // If we came from the success screen the order number is already filled in
  useEffect(() => {
    if (initialOrderNumber && phoneRef.current) phoneRef.current.focus();
  }, [initialOrderNumber]);

  // Privacy: if nobody touches the kiosk for a while, return to the start screen
  useEffect(() => {
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onBackRef.current && onBackRef.current(), IDLE_MS);
    };
    reset();
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);

  const runLookup = useCallback(async (number, phoneValue, silent) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const data = await trackOrder(number, phoneValue);
      if (data) {
        setResult(data);
        setLastChecked(new Date());
        setMisses(0);
        lookupRef.current = { number, phone: phoneValue };
        return true;
      }
      if (!silent) {
        setResult(null);
        setError(
          'We could not find that order. Please check the order number and the phone number you used.'
        );
        setMisses((m) => {
          const next = m + 1;
          if (next >= MAX_MISSES) {
            setLockedUntil(Date.now() + LOCK_MS);
            setNow(Date.now());
            return 0;
          }
          return next;
        });
      }
      return false;
    } catch (err) {
      if (!silent) {
        setResult(null);
        setError(err.message || 'Something went wrong. Please try again.');
      }
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const handleCheck = () => {
    if (loading || locked) return;
    runLookup(orderNumber, phone, false);
  };

  // Refresh the shown result automatically so the customer sees staff updates
  useEffect(() => {
    if (!result) return undefined;
    const id = setInterval(() => {
      if (document.hidden) return;
      runLookup(lookupRef.current.number, lookupRef.current.phone, true);
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [result, runLookup]);

  const handleClear = () => {
    setResult(null);
    setError('');
    setOrderNumber('');
    setPhone('');
    setLastChecked(null);
  };

  const onEnter = (e) => {
    if (e.key === 'Enter') handleCheck();
  };

  const info = result
    ? STATUS_INFO[String(result.status || '').toLowerCase()] || {
        step: 0,
        title: prettify(result.status),
        text: 'Your order is being handled by our staff.'
      }
    : null;
  const pay = result
    ? PAYMENT_INFO[String(result.payment_status || '').toLowerCase()] || {
        label: prettify(result.payment_status),
        tone: 'wait'
      }
    : null;
  const secondsLeft = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  return (
    <div className="track-page">
      <FloralCorner position="top-left" />
      <FloralCorner position="top-right" />
      <FloralCorner position="bottom-left" />
      <FloralCorner position="bottom-right" />

      <div className="stitch-panel track-panel">
        <div style={{ marginBottom: '10px' }}>
          <BowSvg style={{ width: '60px', height: '38px' }} />
        </div>
        <h1 className="track-title">TRACK MY ORDER</h1>

        {!result && (
          <>
            <p className="track-sub">
              Enter your order number and the phone number you used when ordering.
            </p>

            <label className="track-label" htmlFor="track-order-number">
              ORDER NUMBER
            </label>
            <input
              id="track-order-number"
              className="track-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 123456"
              maxLength={12}
              value={orderNumber ? `#${orderNumber}` : ''}
              onChange={(e) => setOrderNumber(e.target.value.replace(/\D/g, ''))}
              onKeyDown={onEnter}
            />

            <label className="track-label" htmlFor="track-phone">
              PHONE NUMBER
            </label>
            <input
              id="track-phone"
              ref={phoneRef}
              className="track-input"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="e.g. 09171234567"
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={onEnter}
            />

            {error && (
              <div className="track-error" role="alert">
                <XCircle size={22} />
                <span>{error}</span>
              </div>
            )}

            {locked && (
              <div className="track-error" role="alert">
                <XCircle size={22} />
                <span>Too many tries. Please wait {secondsLeft} seconds, then try again.</span>
              </div>
            )}

            <div className="track-actions">
              <Button
                variant="accent"
                size="xl"
                onClick={handleCheck}
                icon={<SearchCheck size={26} />}
                style={{
                  width: '100%',
                  padding: '18px 32px',
                  opacity: loading || locked ? 0.6 : 1
                }}
              >
                {loading ? 'CHECKING...' : 'CHECK STATUS'}
              </Button>
              <Button
                variant="primary"
                size="xl"
                onClick={onBack}
                icon={<ArrowLeft size={26} />}
                style={{ width: '100%', padding: '16px 32px' }}
              >
                BACK
              </Button>
            </div>
          </>
        )}

        {result && info && (
          <>
            <div className="track-order-id">
              <span className="track-order-id-label">ORDER</span>
              <span className="track-order-id-value">{result.order_number}</span>
            </div>

            {info.step >= 0 ? (
              <div className="track-steps">
                {STEPS.map((label, i) => (
                  <div
                    key={label}
                    className={`track-step ${i < info.step ? 'done' : ''} ${
                      i === info.step ? 'current' : ''
                    }`}
                  >
                    <div className="track-step-dot">{i < info.step ? '✓' : i + 1}</div>
                    <div className="track-step-label">{label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="track-cancelled">CANCELLED</div>
            )}

            <div className="track-status-title">{info.title}</div>
            <p className="track-status-text">{info.text}</p>

            <div className={`track-pay track-pay-${pay.tone}`}>{pay.label}</div>

            <div className="track-items">
              {(result.order_items || []).map((item, idx) => (
                <div key={idx} className="track-item">
                  <span>
                    {item.product_name}
                    <strong> × {item.quantity}</strong>
                  </span>
                  <span>₱{Number(item.subtotal).toLocaleString()}</span>
                </div>
              ))}
              <div className="track-total">
                <span>TOTAL</span>
                <span>₱{Number(result.total_amount).toLocaleString()}</span>
              </div>
            </div>

            <div className="track-refresh-note">
              <RefreshCw size={14} /> Updates automatically
              {lastChecked ? ` · last checked ${lastChecked.toLocaleTimeString()}` : ''}
            </div>

            <div className="track-actions">
              <Button
                variant="primary"
                size="xl"
                onClick={handleClear}
                icon={<SearchCheck size={24} />}
                style={{ width: '100%', padding: '16px 32px' }}
              >
                CHECK ANOTHER ORDER
              </Button>
              <Button
                variant="accent"
                size="xl"
                onClick={onBack}
                icon={<ArrowLeft size={24} />}
                style={{ width: '100%', padding: '16px 32px' }}
              >
                DONE
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
