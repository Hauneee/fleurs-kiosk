import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { BowSvg, ButterflySvg, FloralCorner } from '../components/Decorations';
import { Button } from '../components/Button';
import { CheckCircle2, RotateCcw, SearchCheck } from 'lucide-react';

export const OrderConfirmationPage = ({ order, onNewOrder, onTrack }) => {
  useEffect(() => {
    // Launch celebratory floral confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#93c5fd', '#60a5fa', '#f59e0b', '#ec4899', '#ffffff']
      });
    } catch (e) {
      // Ignore if canvas is unavailable
    }
  }, []);

  if (!order) return null;

  const formattedDate = new Date(order.created_at || Date.now()).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 24px',
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      <FloralCorner position="top-left" />
      <FloralCorner position="top-right" />
      <FloralCorner position="bottom-left" />
      <FloralCorner position="bottom-right" />

      {/* Main Confirmation Receipt Panel */}
      <div
        className="stitch-panel"
        style={{
          width: '100%',
          maxWidth: '720px',
          padding: '44px 36px',
          background: 'linear-gradient(160deg, #ffffff 0%, #edf5ff 100%)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Top Decorative Bow */}
        <div style={{ marginBottom: '16px' }}>
          <BowSvg style={{ width: '68px', height: '42px' }} />
        </div>

        {/* Checkmark Circle */}
        <div
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.35)',
            border: '3px solid #ffffff'
          }}
        >
          <CheckCircle2 size={54} strokeWidth={2.8} />
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#0d2547',
            letterSpacing: '0.04em',
            lineHeight: 1.15,
            marginBottom: '8px'
          }}
        >
          ORDER SUCCESSFULLY PLACED!
        </h1>

        <p
          style={{
            fontSize: '1.25rem',
            color: '#2563eb',
            fontWeight: 700,
            fontStyle: 'italic',
            marginBottom: '24px'
          }}
        >
          Thank you for your order!
        </p>

        {/* Order Details Badge */}
        <div
          style={{
            background: '#e0f2fe',
            border: '2px dashed #60a5fa',
            borderRadius: '18px',
            padding: '16px 24px',
            display: 'inline-flex',
            flexDirection: 'column',
            gap: '4px',
            marginBottom: '12px'
          }}
        >
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e40af' }}>
            ORDER ID
          </span>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.4rem',
              fontWeight: 800,
              color: '#0f274a',
              letterSpacing: '0.06em'
            }}
          >
            {order.order_number}
          </span>
          <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
            {formattedDate}
          </span>
        </div>

        {/* Reminder: how to track the order later */}
        <p
          style={{
            fontSize: '1.05rem',
            color: '#1e40af',
            fontWeight: 700,
            marginBottom: '28px'
          }}
        >
          Remember this number! Use it with your phone number to track your order.
        </p>

        {/* Purchased Items List */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.5px dashed #cbd5e1',
            padding: '20px 24px',
            textAlign: 'left',
            marginBottom: '28px',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: '#334155',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '8px',
              marginBottom: '12px',
              textTransform: 'uppercase'
            }}
          >
            Order Items
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(order.order_items || []).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '1.15rem'
                }}
              >
                <span style={{ color: '#0f274a', fontWeight: 700 }}>
                  {item.product_name || item.name}
                  <span style={{ color: '#2563eb', fontWeight: 800, marginLeft: '8px' }}>
                    × {item.quantity}
                  </span>
                </span>
                <span style={{ fontWeight: 800, color: '#0f274a' }}>
                  ₱{Number(item.subtotal || item.unit_price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: '2px dashed #94a3b8',
              marginTop: '16px',
              paddingTop: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#0f274a'
              }}
            >
              TOTAL AMOUNT:
            </span>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#1d4ed8'
              }}
            >
              ₱{Number(order.total_amount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* TRACK + NEW ORDER Buttons */}
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {onTrack && (
            <Button
              variant="navy"
              size="xl"
              onClick={onTrack}
              icon={<SearchCheck size={26} />}
              style={{ width: '100%', padding: '18px 32px' }}
            >
              TRACK THIS ORDER
            </Button>
          )}
          <Button
            variant="accent"
            size="xl"
            onClick={onNewOrder}
            icon={<RotateCcw size={28} />}
            style={{ width: '100%', padding: '20px 32px' }}
          >
            BACK TO MENU
          </Button>
        </div>

        <p
          style={{
            marginTop: '20px',
            fontSize: '0.95rem',
            color: '#64748b',
            fontWeight: 600
          }}
        >
          Your order has been received and is now being processed.
        </p>
      </div>
    </div>
  );
};
