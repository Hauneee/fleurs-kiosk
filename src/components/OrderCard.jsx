
import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  PackageCheck
} from 'lucide-react';

const COLORS = {
  pink: '#E879A5',
  lightPink: '#F8C9DA',
  blush: '#FCE7EF',
  darkPink: '#C2255C',
  wine: '#9C1A47',
  darkText: '#3F1424',
  mutedText: '#806B73',
  white: '#FFFFFF',
  cream: '#FFFAFC',
};

export const OrderCard = ({ order, onStatusChange }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return {
          bg: '#FFF0F5',
          color: '#9C1A47',
          border: '#E879A5',
          icon: <Clock size={16} />
        };

      case 'confirmed':
        return {
          bg: '#FCE7EF',
          color: '#9C1A47',
          border: '#C2255C',
          icon: <CheckCircle2 size={16} />
        };

      case 'completed':
        return {
          bg: '#F0F5EB',
          color: '#496B42',
          border: '#A7C9A0',
          icon: <PackageCheck size={16} />
        };

      case 'cancelled':
        return {
          bg: '#FFF0F0',
          color: '#9B303D',
          border: '#E6A0A7',
          icon: <XCircle size={16} />
        };

      default:
        return {
          bg: '#F8F1F4',
          color: '#684854',
          border: '#D9C1CB',
          icon: <Clock size={16} />
        };
    }
  };

  const badge = getStatusBadge(order.status);

  const formattedDate = new Date(
  order.created_at
).toLocaleString('en-PH', {
  timeZone: 'Asia/Manila',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});
  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const buttonStyle = {
    color: COLORS.white,
    border: 'none',
    padding: '10px 18px',
    borderRadius: '9999px',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '100%',
        background: COLORS.white,
        border: `2px dashed ${COLORS.lightPink}`,
        borderRadius: '24px',
        padding: 'clamp(16px, 3vw, 24px)',
        boxShadow: '0 8px 24px rgba(156, 26, 71, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        color: COLORS.darkText,
      }}
    >
      {/* Order number and status */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
              fontWeight: 800,
              color: COLORS.darkText,
              overflowWrap: 'anywhere',
            }}
          >
            ORDER {order.order_number}
          </div>

          <div
            style={{
              fontSize: '0.9rem',
              color: COLORS.mutedText,
              marginTop: '4px',
            }}
          >
            {formattedDate}
          </div>
        </div>

        <span
          style={{
            background: badge.bg,
            color: badge.color,
            border: `1.5px solid ${badge.border}`,
            padding: '6px 12px',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          {badge.icon}
          {order.status}
        </span>
      </div>

      {/* Order items */}
      <div
        style={{
          borderTop: `1px dashed ${COLORS.lightPink}`,
          borderBottom: `1px dashed ${COLORS.lightPink}`,
          padding: '12px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {(order.order_items || []).map((item, index) => (
          <div
            key={item.id || index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '12px',
              fontSize: '1rem',
              color: COLORS.darkText,
            }}
          >
            <span style={{ fontWeight: 600, minWidth: 0 }}>
              {item.product_name || item.name}
              <span
                style={{
                  color: COLORS.darkPink,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                {' '}× {item.quantity}
              </span>
            </span>

            <span
              style={{
                fontWeight: 700,
                color: COLORS.darkText,
                whiteSpace: 'nowrap',
              }}
            >
              ₱
              {formatAmount(
                item.subtotal ??
                (Number(item.unit_price) * Number(item.quantity))
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Total and status actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.85rem',
              color: COLORS.mutedText,
              fontWeight: 700,
            }}
          >
            TOTAL AMOUNT
          </span>

          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.4rem, 4vw, 1.75rem)',
              fontWeight: 800,
              color: COLORS.wine,
              overflowWrap: 'anywhere',
            }}
          >
            ₱{formatAmount(order.total_amount)}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {order.status === 'pending' && (
            <button
              type="button"
              onClick={() => onStatusChange(order.id, 'confirmed')}
              style={{
                ...buttonStyle,
                background: COLORS.darkPink,
              }}
            >
              CONFIRM ORDER
            </button>
          )}

          {order.status === 'confirmed' && (
            <button
              type="button"
              onClick={() => onStatusChange(order.id, 'completed')}
              style={{
                ...buttonStyle,
                background: '#6B8F60',
              }}
            >
              MARK COMPLETED
            </button>
          )}

          {order.status !== 'cancelled' &&
            order.status !== 'completed' && (
              <button
                type="button"
                onClick={() => onStatusChange(order.id, 'cancelled')}
                style={{
                  ...buttonStyle,
                  background: COLORS.blush,
                  color: COLORS.wine,
                  border: `1px solid ${COLORS.lightPink}`,
                  padding: '10px 14px',
                }}
              >
                CANCEL
              </button>
            )}
        </div>
      </div>
    </div>
  );
};
