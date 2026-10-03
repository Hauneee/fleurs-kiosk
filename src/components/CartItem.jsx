import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

export const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '2px dashed #93c5fd',
        borderRadius: '20px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        boxShadow: '0 4px 14px rgba(10, 25, 52, 0.08)'
      }}
    >
      {/* Product Image Thumbnail */}
      <div
        style={{
          width: '84px',
          height: '84px',
          borderRadius: '14px',
          background: '#f0f7ff',
          border: '1.5px dashed #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          flexShrink: 0
        }}
      >
        <img
          src={item.image_url}
          alt={item.name}
          style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
        />
      </div>

      {/* Product Details */}
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: '#3b82f6',
            letterSpacing: '0.06em'
          }}
        >
          {item.category?.replace('-', ' ')}
        </span>
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.45rem',
            fontWeight: 800,
            color: '#0d2547',
            textTransform: 'uppercase',
            margin: '2px 0 6px 0'
          }}
        >
          {item.name}
        </h3>
        <div style={{ fontSize: '1.1rem', color: '#1e40af', fontWeight: 700 }}>
          ₱{Number(item.price).toLocaleString()} each
        </div>
      </div>

      {/* Quantity Touch Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            border: '2px dashed #3b82f6',
            background: item.quantity <= 1 ? '#f1f5f9' : '#e0f2fe',
            color: item.quantity <= 1 ? '#94a3b8' : '#1e3a8a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer'
          }}
          aria-label="Decrease quantity"
        >
          <Minus size={22} strokeWidth={3} />
        </button>

        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#0f274a',
            minWidth: '40px',
            textAlign: 'center'
          }}
        >
          {item.quantity}
        </span>

        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            border: '2px dashed #3b82f6',
            background: '#e0f2fe',
            color: '#1e3a8a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          aria-label="Increase quantity"
        >
          <Plus size={22} strokeWidth={3} />
        </button>
      </div>

      {/* Subtotal */}
      <div style={{ textAlign: 'right', minWidth: '120px' }}>
        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>SUBTOTAL</div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.6rem',
            fontWeight: 800,
            color: '#0f274a'
          }}
        >
          ₱{(item.price * item.quantity).toLocaleString()}
        </div>
      </div>

      {/* Delete Item Button */}
      <button
        onClick={() => onRemove(item.id)}
        style={{
          background: 'none',
          border: 'none',
          color: '#ef4444',
          cursor: 'pointer',
          padding: '12px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Remove item"
        aria-label={`Remove ${item.name} from cart`}
      >
        <Trash2 size={24} />
      </button>
    </div>
  );
};
