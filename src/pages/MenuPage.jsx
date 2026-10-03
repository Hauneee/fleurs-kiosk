import React from 'react';
import { Header } from '../components/Header';
import { BowSvg, ButterflySvg, FloralCorner } from '../components/Decorations';
import { ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../data/defaultProducts';

export const MenuPage = ({
  onBack,
  onSelectCategory,
  onCart,
  cartCount = 0,
  onAdmin
}) => {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative',
        paddingBottom: '40px'
      }}
    >
      <FloralCorner position="top-left" />
      <FloralCorner position="top-right" />

      {/* Top Header */}
      <Header
        title="MENU"
        onBack={onBack}
        onCart={onCart}
        cartCount={cartCount}
        onAdmin={onAdmin}
      />

      {/* Main Category Selection Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '860px',
          margin: '0 auto',
          padding: '20px 24px',
          zIndex: 10
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}
        >
          <p
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#93c5fd',
              letterSpacing: '0.04em'
            }}
          >
            SELECT A CATEGORY TO BROWSE OUR BLOOMS
          </p>
        </div>

        {/* Three Large Touch Category Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '26px',
            width: '100%'
          }}
        >
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="category-menu-card"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectCategory(cat.id);
              }}
              aria-label={`Open ${cat.title} category`}
            >
              {/* Left: Decorative Bow & Image Thumbnail */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
                <div
                  style={{
                    width: '92px',
                    height: '92px',
                    borderRadius: '20px',
                    background: '#ffffff',
                    border: '2px dashed #60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    boxShadow: '0 6px 14px rgba(15, 35, 70, 0.12)',
                    flexShrink: 0
                  }}
                >
                  <img
                    src={cat.image}
                    alt={cat.title}
                    style={{
                      maxWidth: '90%',
                      maxHeight: '90%',
                      objectFit: 'contain'
                    }}
                  />
                </div>

                <div>
                  <h2 className="cat-title">{cat.title}</h2>
                  <div className="cat-subtitle">{cat.subtitle}</div>
                </div>
              </div>

              {/* Right: Decorative Bow & Arrow Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'none' }} className="md:block">
                  <BowSvg style={{ width: '48px', height: '30px' }} />
                </div>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '2px dashed #3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1e3a8a',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  <ChevronRight size={32} strokeWidth={3} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
