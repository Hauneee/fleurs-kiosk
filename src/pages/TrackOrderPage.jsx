import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BowSvg, FloralCorner } from '../components/Decorations';
import { Button } from '../components/Button';
import {
  SearchCheck,
  ArrowLeft,
  XCircle,
  CalendarDays,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { trackOrder, supabase } from '../services/supabase';

const REFRESH_MS = 15000;
const IDLE_MS = 120000;
const MAX_MISSES = 5;
const LOCK_MS = 30000;

const PAYMENT_INFO = {
  paid: { label: 'Payment verified', tone: 'good' },
  payment_submitted: {
    label: 'Payment being verified',
    tone: 'wait'
  },
  pending: {
    label: 'Payment being verified',
    tone: 'wait'
  },
  unpaid: {
    label: 'Payment not received - please see our staff',
    tone: 'bad'
  },
  rejected: {
    label: 'Payment could not be verified - please see our staff',
    tone: 'bad'
  },
  failed: {
    label: 'Payment could not be verified - please see our staff',
    tone: 'bad'
  },
  refunded: { label: 'Payment refunded', tone: 'wait' }
};

const prettify = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatOrderDate = (value) => {
  if (!value) return 'Date unavailable';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const sameOrderData = (current, next) =>
  current != null &&
  JSON.stringify(current) === JSON.stringify(next);

export const TrackOrderPage = ({
  initialOrderNumber = '',
  onBack
}) => {
  const [orderNumber, setOrderNumber] = useState(
    String(initialOrderNumber).replace(/\D/g, '')
  );

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [misses, setMisses] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  const [proofUrl, setProofUrl] = useState('');
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState(false);
  const [showProof, setShowProof] = useState(false);

  const orderInputRef = useRef(null);
  const lookupRef = useRef({ number: '' });
  const onBackRef = useRef(onBack);
  const proofRequestRef = useRef(0);
  const lookupRequestRef = useRef(0);

  onBackRef.current = onBack;

  const locked = lockedUntil > now;

  // Update countdown only while the user is locked out.
  useEffect(() => {
    if (!locked) return undefined;

    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(id);
  }, [locked]);

  // Focus the input when an initial order number is provided.
  useEffect(() => {
    if (initialOrderNumber && orderInputRef.current) {
      orderInputRef.current.focus();
    }
  }, [initialOrderNumber]);

  // Return to the previous page after inactivity.
  useEffect(() => {
    let timer;

    const reset = () => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        onBackRef.current?.();
      }, IDLE_MS);
    };

    const events = ['pointerdown', 'keydown', 'touchstart'];

    reset();

    events.forEach((event) => {
      window.addEventListener(event, reset);
    });

    return () => {
      clearTimeout(timer);

      events.forEach((event) => {
        window.removeEventListener(event, reset);
      });
    };
  }, []);

  // Load proof photo for the current order.
  const loadProofPhoto = useCallback(async (order) => {
    const requestId = ++proofRequestRef.current;

    if (!supabase || !order?.order_number) {
      setProofUrl('');
      setProofLoading(false);
      setProofError(false);
      return;
    }

    setProofLoading(true);
    setProofError(false);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'get_order_proof',
        {
          p_order_number: order.order_number
        }
      );

      if (rpcError) throw rpcError;

      const record = Array.isArray(data) ? data[0] : data;

      const proofPath =
        typeof record === 'string'
          ? record
          : record?.proof_path ||
            record?.path ||
            record?.photo_path ||
            record?.p_path ||
            record?.url ||
            '';

      if (!proofPath) {
        if (requestId === proofRequestRef.current) {
          setProofUrl('');
        }

        return;
      }

      // Use an existing URL directly.
      if (/^https?:\/\//i.test(proofPath)) {
        if (requestId === proofRequestRef.current) {
          setProofUrl(proofPath);
        }

        return;
      }

      const storage = supabase.storage.from('order-proofs');

      // Generate a signed URL for a private bucket.
      const {
        data: signedData,
        error: signedError
      } = await storage.createSignedUrl(proofPath, 3600);

      if (requestId !== proofRequestRef.current) return;

      if (!signedError && signedData?.signedUrl) {
        setProofUrl(signedData.signedUrl);
        return;
      }

      // Public bucket fallback.
      const { data: publicData } = storage.getPublicUrl(proofPath);

      if (requestId === proofRequestRef.current) {
        setProofUrl(publicData?.publicUrl || '');
      }
    } catch (err) {
      console.error('Unable to load order proof photo:', err);

      if (requestId === proofRequestRef.current) {
        setProofUrl('');
        setProofError(true);
      }
    } finally {
      if (requestId === proofRequestRef.current) {
        setProofLoading(false);
      }
    }
  }, []);

  // Find an order. Silent lookups do not change the visible loading state.
  const runLookup = useCallback(
    async (number, silent = false) => {
      const normalizedNumber = String(number || '').trim();

      if (!normalizedNumber) return false;

      const requestId = ++lookupRequestRef.current;

      if (!silent) {
        setLoading(true);
        setError('');
      }

      try {
        const data = await trackOrder(normalizedNumber);

        // Ignore stale responses from earlier lookups.
        if (requestId !== lookupRequestRef.current) {
          return false;
        }

        if (data) {
          setResult((current) =>
            sameOrderData(current, data) ? current : data
          );

          setMisses(0);
          lookupRef.current = { number: normalizedNumber };

          return true;
        }

        if (!silent) {
          setResult(null);
          setProofUrl('');
          setProofError(false);

          setError(
            'We could not find that order. Please check your order number and try again.'
          );

          setMisses((current) => {
            const next = current + 1;

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
        if (
          requestId === lookupRequestRef.current &&
          !silent
        ) {
          setResult(null);
          setProofUrl('');
          setProofError(false);

          setError(
            err.message || 'Something went wrong. Please try again.'
          );
        }

        return false;
      } finally {
        if (
          requestId === lookupRequestRef.current &&
          !silent
        ) {
          setLoading(false);
        }
      }
    },
    []
  );

  const handleCheck = () => {
    if (loading || locked || !orderNumber.trim()) {
      if (!orderNumber.trim()) {
        setError('Please enter your order number.');
      }

      return;
    }

    runLookup(orderNumber.trim(), false);
  };

  // Load the proof only when the displayed order number changes.
  useEffect(() => {
    if (!result?.order_number) {
      ++proofRequestRef.current;
      setProofUrl('');
      setProofLoading(false);
      setProofError(false);
      return;
    }

    loadProofPhoto(result);
  }, [result?.order_number, loadProofPhoto]);

  // Refresh order status without reloading its proof photo.
  useEffect(() => {
    if (!result?.order_number) return undefined;

    let active = true;
    let refreshing = false;

    const refreshOrder = async () => {
      if (
        !active ||
        refreshing ||
        document.hidden ||
        !lookupRef.current.number
      ) {
        return;
      }

      refreshing = true;

      try {
        await runLookup(lookupRef.current.number, true);
      } finally {
        refreshing = false;
      }
    };

    const id = setInterval(refreshOrder, REFRESH_MS);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [result?.order_number, runLookup]);

  const handleClear = () => {
    // Invalidate requests that are still in progress.
    ++lookupRequestRef.current;
    ++proofRequestRef.current;

    lookupRef.current = { number: '' };

    setResult(null);
    setError('');
    setOrderNumber('');
    setLoading(false);
    setProofUrl('');
    setProofLoading(false);
    setProofError(false);
    setShowProof(false);
    setMisses(0);

    setTimeout(() => {
      orderInputRef.current?.focus();
    }, 0);
  };

  const onEnter = (event) => {
    if (event.key === 'Enter') {
      handleCheck();
    }
  };

  const isCancelled =
    String(result?.status || '').toLowerCase() === 'cancelled';

  const info = result
    ? isCancelled
      ? {
          title: 'Order Cancelled',
          text: 'This order was cancelled. Please ask our staff if you have questions.'
        }
      : {
          title: 'Order Completed',
          text: 'Your order is complete. Thank you for shopping with Fleurs by Blossoms Craft!'
        }
    : null;

  const pay = result
    ? PAYMENT_INFO[
        String(result.payment_status || '').toLowerCase()
      ] || {
        label: prettify(result.payment_status),
        tone: 'wait'
      }
    : null;

  const secondsLeft = Math.max(
    0,
    Math.ceil((lockedUntil - now) / 1000)
  );

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
              Enter your order number to check your order status.
            </p>

            <label
              className="track-label"
              htmlFor="track-order-number"
            >
              ORDER NUMBER
            </label>

            <input
              id="track-order-number"
              ref={orderInputRef}
              className="track-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. #123456"
              maxLength={12}
              value={orderNumber ? `#${orderNumber}` : ''}
              onChange={(event) => {
                setOrderNumber(
                  event.target.value.replace(/\D/g, '')
                );

                setError('');
              }}
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
                <span>
                  Too many tries. Please wait {secondsLeft} seconds,
                  then try again.
                </span>
              </div>
            )}

            <div className="track-actions">
              <Button
                variant="accent"
                size="xl"
                onClick={handleCheck}
                disabled={loading || locked}
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
                style={{
                  width: '100%',
                  padding: '16px 32px'
                }}
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

              <span className="track-order-id-value">
                {result.order_number}
              </span>
            </div>

            <div
              style={{
                margin: '12px auto 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#475569',
                fontSize: '0.95rem'
              }}
            >
              <CalendarDays size={20} />

              <span>
                <strong>Order Date: </strong>
                {formatOrderDate(result.created_at)}
              </span>
            </div>

            {isCancelled ? (
              <div className="track-cancelled">
                CANCELLED
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  margin: '12px auto',
                  borderRadius: '999px',
                  background: '#DCFCE7',
                  color: '#166534',
                  fontWeight: 800,
                  fontSize: '1rem',
                  letterSpacing: '0.05em'
                }}
              >
                <span aria-hidden="true">✓</span>
                COMPLETED
              </div>
            )}

            <div className="track-status-title">
              {info.title}
            </div>

            <p className="track-status-text">
              {info.text}
            </p>

            <div className={`track-pay track-pay-${pay.tone}`}>
              {pay.label}
            </div>

            {/* Proof of Delivery */}
            <section
              aria-label="Transaction photo"
              style={{
                margin: '24px auto',
                width: '100%',
                maxWidth: '420px',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: '#684854',
                  marginBottom: '14px'
                }}
              >
                <ImageIcon size={22} />
               TRANSACTION PHOTO
              </div>

              {proofLoading ? (
                <p style={{ color: '#684854' }}>
                  Loading proof photo...
                </p>
              ) : proofUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowProof(true)}
                    aria-label="View proof of delivery photo"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: 0,
                      border: '2px solid #F0D5DE',
                      borderRadius: '18px',
                      background: '#FFFFFF',
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                  >
                    <img
                      src={proofUrl}
                      alt={`Proof of delivery for order ${result.order_number}`}
                      onError={() => {
                        console.error(
                          'Could not display the order proof image.'
                        );

                        setProofUrl('');
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        maxHeight: '480px',
                        objectFit: 'contain',
                        background: '#FFFFFF'
                      }}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowProof(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                      marginTop: '10px',
                      padding: '10px 14px',
                      border: '1px solid #E8C7D1',
                      borderRadius: '12px',
                      background: '#FFF8F8',
                      color: '#8E5368',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <ExternalLink size={17} />
                    View photo larger
                  </button>
                </>
              ) : (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: '#FFF8F8',
                    border: '1px dashed #E8C7D1',
                    color: '#684854'
                  }}
                >
                  <ImageIcon
                    size={32}
                    style={{
                      display: 'block',
                      margin: '0 auto 10px'
                    }}
                  />

                  <p style={{ margin: 0, fontWeight: 700 }}>
                    {proofError
                      ? 'Unable to load the proof photo.'
                      : 'No proof photo available yet.'}
                  </p>

                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: '0.9rem',
                      lineHeight: 1.5
                    }}
                  >
                    {proofError
                      ? 'Please try checking this order again later.'
                      : 'The photo may not have been saved or linked to this order.'}
                  </p>
                </div>
              )}
            </section>

            {/* Order items */}
            <div className="track-items">
              {(result.order_items || []).map((item, index) => (
                <div key={index} className="track-item">
                  <span>
                    {item.product_name}
                    <strong> × {item.quantity}</strong>
                  </span>

                  <span>
                    ₱{Number(item.subtotal).toLocaleString('en-PH')}
                  </span>
                </div>
              ))}

              <div className="track-total">
                <span>TOTAL</span>

                <span>
                  ₱{Number(result.total_amount).toLocaleString('en-PH')}
                </span>
              </div>
            </div>

            <div className="track-actions">
              <Button
                variant="primary"
                size="xl"
                onClick={handleClear}
                icon={<SearchCheck size={24} />}
                style={{
                  width: '100%',
                  padding: '16px 32px'
                }}
              >
                CHECK ANOTHER ORDER
              </Button>

              <Button
                variant="accent"
                size="xl"
                onClick={onBack}
                icon={<ArrowLeft size={24} />}
                style={{
                  width: '100%',
                  padding: '16px 32px'
                }}
              >
                DONE
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Enlarged proof photo */}
      {showProof && proofUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Proof of delivery photo"
          onClick={() => setShowProof(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setShowProof(false);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box',
            background: 'rgba(25, 12, 18, 0.88)'
          }}
        >
          <button
            type="button"
            aria-label="Close enlarged photo"
            onClick={() => setShowProof(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: '50%',
              background: '#FFFFFF',
              color: '#684854',
              cursor: 'pointer'
            }}
          >
            <XCircle size={28} />
          </button>

          <img
            src={proofUrl}
            alt={`Proof of delivery for order ${result.order_number}`}
            onClick={(event) => event.stopPropagation()}
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '12px',
              background: '#FFFFFF'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TrackOrderPage;