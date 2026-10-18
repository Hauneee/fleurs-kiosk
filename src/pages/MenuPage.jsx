import React from 'react';
import { Header } from '../components/Header';
import { FloralCorner } from '../components/Decorations';
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

      <Header
        title="MENU"
        onBack={onBack}
        onCart={onCart}
        cartCount={cartCount}
        onAdmin={onAdmin}
      />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '1040px',
          margin: '0 auto',
          padding: '20px 24px',
          zIndex: 10
        }}
      >
        <p
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#93c5fd',
            letterSpacing: '0.04em',
            textAlign: 'center',
            marginBottom: '32px'
          }}
        >
          SELECT A CATEGORY TO BROWSE OUR BLOOMS
        </p>

        <div className="category-grid">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectCategory(cat.id);
              }}
              className="category-menu-card tile"
              role="button"
              tabIndex={0}
              aria-label={`Open ${cat.title} category`}
            >
              <div className="tile-img">
                <img src={cat.image} alt={cat.title} />
              </div>

              <div>
                <h2 className="cat-title">{cat.title}</h2>
                <div className="cat-subtitle">{cat.subtitle}</div>
              </div>

              <div className="tile-arrow">
                <ChevronRight size={30} strokeWidth={3} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};