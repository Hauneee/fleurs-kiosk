import React from 'react';
import { ButterflySvg, BowSvg, FloralCorner } from '../components/Decorations';
import { Button } from '../components/Button';
import { Sparkles, Sliders } from 'lucide-react';
import { FLOWER_IMAGES } from '../assets/flowerAssets';

export const HomePage = ({ onStartOrder, onAdmin }) => {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 24px',
        position: 'relative',
        minHeight: '100vh',
        textAlign: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Decorative Botanical Corners */}
      <FloralCorner position="top-left" />
      <FloralCorner position="top-right" />
      <FloralCorner position="bottom-left" />
      <FloralCorner position="bottom-right" />

      {/* Floating Butterflies */}
      <div style={{ position: 'absolute', top: '15%', left: '12%' }} className="animate-float">
        <ButterflySvg style={{ width: '56px', height: '44px' }} />
      </div>
      <div style={{ position: 'absolute', top: '22%', right: '14%' }} className="animate-float-delayed">
        <ButterflySvg style={{ width: '48px', height: '38px', transform: 'scaleX(-1)' }} />
      </div>

      {/* Admin quick access in corner */}
      <div style={{ position: 'absolute', top: '24px', right: '28px', zIndex: 10 }}>
        <button
          onClick={onAdmin}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1.5px dashed rgba(147, 197, 253, 0.4)',
            borderRadius: '9999px',
            padding: '8px 18px',
            color: '#93c5fd',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Sliders size={18} />
          <span>STAFF PORTAL</span>
        </button>
      </div>

      {/* Main Showcase Panel */}
      <div
        className="stitch-panel"
        style={{
          width: '100%',
          maxWidth: '820px',
          padding: '48px 36px',
          margin: '20px auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'linear-gradient(165deg, #eaf3fe 0%, #d2e4fa 100%)'
        }}
      >
        {/* Top Decorative Bow */}
        <div style={{ marginBottom: '16px' }}>
          <BowSvg style={{ width: '76px', height: '46px' }} />
        </div>

        {/* Center Floral Hero Graphic */}
        <div
          style={{
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '3px dashed #60a5fa',
            boxShadow: '0 12px 28px rgba(11, 28, 56, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            marginBottom: '28px'
          }}
        >
          <img
            src={FLOWER_IMAGES['blue-bouquet']}
            alt="Fleurs Signature Blue Bouquet"
            style={{
              maxWidth: '92%',
              maxHeight: '92%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))'
            }}
          />
        </div>

        {/* Store Title */}
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '3.4rem',
            fontWeight: 800,
            color: '#0d2547',
            letterSpacing: '0.04em',
            marginBottom: '10px',
            textTransform: 'uppercase',
            lineHeight: 1.15
          }}
        >
          Fleurs by Blossoms Craft
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '1.45rem',
            fontWeight: 700,
            color: '#2563eb',
            fontStyle: 'italic',
            letterSpacing: '0.03em',
            marginBottom: '38px'
          }}
        >
          “Handmade Flowers, Made With Love”
        </p>

        {/* Large Touch START ORDER Button */}
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <Button
            variant="accent"
            size="xl"
            onClick={onStartOrder}
            icon={<Sparkles size={30} />}
            className="stitch-box"
            style={{
              width: '100%',
              fontSize: '1.6rem',
              padding: '24px 44px',
              boxShadow: '0 14px 32px rgba(217, 119, 6, 0.45)'
            }}
          >
            START ORDER
          </Button>
        </div>

        {/* Subtle kiosk hint */}
        <div
          style={{
            marginTop: '24px',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#4b6b94',
            letterSpacing: '0.05em'
          }}
        >
          TOUCH SCREEN TO BEGIN YOUR ORDER
        </div>
      </div>
    </div>
  );
};
