import React from 'react';
import { CheckCircle2, Clock, XCircle, PackageCheck } from 'lucide-react';

export const OrderCard = ({ order, onStatusChange }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return {
          bg: '#fef3c7',
          color: '#92400e',
          border: '#f59e0b',
          icon: <Clock size={16} />
        };
      case 'confirmed':
        return {
          bg: '#dbeafe',
          color: '#1e40af',
          border: '#3b82f6',
          icon: <CheckCircle2 size={16} />
        };
      case 'completed':
        return {
          bg: '#dcfce7',
          color: '#166534',
          border: '#22c55e',
          icon: <PackageCheck size={16} />
        };
      case 'cancelled':
        return {
          bg: '#fee2e2',
          color: '#991b1b',
          border: '#ef4444',
          icon: <XCircle size={16} />
        };
      default:
        return {
          bg: '#f1f5f9',
          color: '#334155',
          border: '#94a3b8',
          icon: <Clock size={16} />
        };
    }
  };

  const badge = getStatusBadge(order.status);
  const formattedDate = new Date(order.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div
      style={{
        background: '#ffffff',
        border: '2.5px dashed #93c5fd',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 8px 24px rgba(10, 25, 52, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Top Header: Order Number & Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#0d2547'
            }}
          >
            ORDER {order.order_number}
          </span>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>
            {formattedDate}
          </div>
        </div>

        <span
          style={{
            background: badge.bg,
            color: badge.color,
            border: `1.5px solid ${badge.border}`,
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.95rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {badge.icon}
          {order.status}
        </span>
      </div>

      {/* Item List */}
      <div
        style={{
          borderTop: '1px dashed #cbd5e1',
          borderBottom: '1px dashed #cbd5e1',
          padding: '12px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {(order.order_items || []).map((item, index) => (
          <div
            key={item.id || index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '1.05rem',
              color: '#1e293b'
            }}
          >
            <span style={{ fontWeight: 600 }}>
              {item.product_name} <span style={{ color: '#3b82f6', fontWeight: 800 }}>× {item.quantity}</span>
            </span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              ₱{Number(item.subtotal || item.unit_price * item.quantity).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Total & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>TOTAL AMOUNT:</span>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#1e3a8a'
            }}
          >
            ₱{Number(order.total_amount).toLocaleString()}
          </div>
        </div>

        {/* Status transition controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {order.status === 'pending' && (
            <button
              onClick={() => onStatusChange(order.id, 'confirmed')}
              style={{
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              CONFIRM ORDER
            </button>
          )}

          {order.status === 'confirmed' && (
            <button
              onClick={() => onStatusChange(order.id, 'completed')}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              MARK COMPLETED
            </button>
          )}

          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <button
              onClick={() => onStatusChange(order.id, 'cancelled')}
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fca5a5',
                padding: '10px 14px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer'
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
