import React, { useState } from 'react';
import { QuantitySelector } from './QuantitySelector';
import { Button } from './Button';
import { BowSvg } from './Decorations';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export const ProductModal = ({ product, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ textAlign: 'center' }}
      >
        {/* Top Decorative Bow */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <BowSvg style={{ width: '56px', height: '34px' }} />
        </div>

        {/* Large Product Image Frame */}
        <div
          style={{
            width: '260px',
            height: '260px',
            margin: '0 auto 20px auto',
            background: '#ffffff',
            borderRadius: '24px',
            border: '2px dashed #93bdee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(15, 39, 74, 0.12)'
          }}
        >
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.18))'
            }}
          />
        </div>

        {/* Product Name */}
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.2rem',
            fontWeight: 800,
            color: '#0d2547',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '8px'
          }}
        >
          {product.name}
        </h2>

        {/* Price */}
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2rem',
            fontWeight: 800,
            color: '#1d4ed8',
            marginBottom: '14px'
          }}
        >
          ₱{Number(product.price).toLocaleString()}
        </div>

        {/* Description */}
        {product.description && (
          <p
            style={{
              fontSize: '1.05rem',
              color: '#3b5a82',
              lineHeight: 1.5,
              maxWidth: '460px',
              margin: '0 auto 20px auto',
              fontWeight: 600
            }}
          >
            {product.description}
          </p>
        )}

        {/* Quantity Controls */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#1e3a8a',
              marginBottom: '10px'
            }}
          >
            SELECT QUANTITY:
          </div>
          <QuantitySelector
            quantity={quantity}
            onChange={setQuantity}
            min={1}
            max={product.stock || 50}
          />
        </div>

        {/* Actions: ADD TO CART & BACK */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            width: '100%',
            maxWidth: '380px',
            margin: '0 auto'
          }}
        >
          <Button
            variant="accent"
            size="xl"
            onClick={handleAddToCart}
            icon={<ShoppingBag size={26} strokeWidth={2.5} />}
          >
            ADD TO CART — ₱{(product.price * quantity).toLocaleString()}
          </Button>

          <Button
            variant="navy"
            size="md"
            onClick={onClose}
            icon={<ArrowLeft size={20} />}
          >
            BACK TO PRODUCTS
          </Button>
        </div>
      </div>
    </div>
  );
};
