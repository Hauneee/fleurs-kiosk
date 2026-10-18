import React from 'react';
import { BackButton } from './BackButton';
import { CartButton } from './CartButton';
import { ButterflySvg } from './Decorations';
import { Sliders } from 'lucide-react';

// Responsive rules that inline styles cannot express
const headerCss = `
  .fl-hdr-title {
    margin: 0;
    min-width: 0;
    text-align: center;
    line-height: 1.1;
    white-space: normal;
    overflow-wrap: anywhere;
    font-size: clamp(0.95rem, 4.6vw, 2.5rem);
    letter-spacing: clamp(0.01em, 0.4vw, 0.05em);
  }
  .fl-hdr-title-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(4px, 1.5vw, 14px);
    max-width: 100%;
  }
  .fl-hdr-butterfly {
    pointer-events: none;
  }
  @media (max-width: 600px) {
    .fl-hdr-butterfly { display: none !important; }
  }
`;

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
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + clamp(10px, 3vw, 24px))',
        paddingBottom: 'clamp(10px, 3vw, 24px)',
        paddingLeft: 'clamp(10px, 3vw, 32px)',
        paddingRight: 'clamp(10px, 3vw, 32px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'clamp(6px, 2vw, 16px)',
        position: 'relative',
        zIndex: 20,
        boxSizing: 'border-box'
      }}
    >
      <style>{headerCss}</style>

      {/* Left Slot: Back Button (same width as the right slot, so the title stays centered) */}
      <div
        style={{
          flex: '1 1 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '8px'
        }}
      >
        {onBack && <BackButton onClick={onBack} />}
      </div>

      {/* Center Slot: Title */}
      <div
        style={{
          flex: '0 1 auto',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <div className="fl-hdr-title-row">
          <ButterflySvg
            style={{ width: 'clamp(16px, 5vw, 36px)', height: 'auto', opacity: 0.85, flexShrink: 0 }}
            className="animate-float fl-hdr-butterfly"
          />
          <h1
            className="fl-hdr-title"
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 800,
              color: '#ffffff',
              textShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
              textTransform: 'uppercase'
            }}
          >
            {title}
          </h1>
          <ButterflySvg
            style={{
              width: 'clamp(16px, 5vw, 36px)',
              height: 'auto',
              opacity: 0.85,
              transform: 'scaleX(-1)',
              flexShrink: 0
            }}
            className="animate-float-delayed fl-hdr-butterfly"
          />
        </div>
        <div
          style={{
            width: 'clamp(60px, 20vw, 120px)',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #93c5fd, transparent)',
            marginTop: '6px'
          }}
        />
      </div>

      {/* Right Slot: Cart and discreet Admin portal */}
      <div
        style={{
          flex: '1 1 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '8px'
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
              width: '40px',
              height: '40px',
              flexShrink: 0,
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