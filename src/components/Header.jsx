import React from 'react';
import { BackButton } from './BackButton';
import { CartButton } from './CartButton';
import { ButterflySvg } from './Decorations';
import { ShieldCheck, ShieldAlert, Sliders } from 'lucide-react';

export const Header = ({
  title,
  onBack,
  onCart,
  cartCount = 0,
  onAdmin,
  isConnected = null,
  showCart = true
}) => {
  return (
    <header
      style={{
        width: '100%',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 20
      }}
    >
      {/* Left Slot: Back Button */}
      <div style={{ minWidth: '130px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onBack && <BackButton onClick={onBack} />}
      </div>

      {/* Center Slot: Title with Decorative Bow / Butterfly */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <ButterflySvg style={{ width: '36px', height: '28px', opacity: 0.85 }} className="animate-float" />
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#ffffff',
              textShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
              textTransform: 'uppercase'
            }}
          >
            {title}
          </h1>
          <ButterflySvg
            style={{
              width: '36px',
              height: '28px',
              opacity: 0.85,
              transform: 'scaleX(-1)'
            }}
            className="animate-float-delayed"
          />
        </div>
        <div
          style={{
            width: '120px',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #93c5fd, transparent)',
            marginTop: '6px'
          }}
        />
      </div>

      {/* Right Slot: Cart and discreet Admin portal */}
      <div
        style={{
          minWidth: '130px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px'
        }}
      >
        {onAdmin && (
          <button
            onClick={onAdmin}
            title="Staff / Admin Dashboard"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1.5px dashed rgba(147, 197, 253, 0.5)',
              borderRadius: '50%',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#93c5fd',
              cursor: 'pointer'
            }}
            aria-label="Staff Portal"
          >
            <Sliders size={20} />
          </button>
        )}

        {showCart && onCart && <CartButton onClick={onCart} count={cartCount} />}
      </div>
    </header>
  );
};
