import React from 'react';
import { Header } from '../components/Header';
import { CATEGORIES } from '../data/defaultProducts';
import '../styles/menu.css';

// Photos go in the /public/images folder of the project.
// The keys are the category ids used in App.jsx.


const CATEGORY_IMAGES = {
  bouquet: '/bouquet.jpg',
  'solo-flower': '/solo-flower.jpg',
  'triple-flower': '/triple-flower.jpg',
};


export const MenuPage = ({
  onBack,
  onSelectCategory,
  onCart,
  cartCount = 0,
  onAdmin
}) => {
  return (
    <div className="fl-menu">
      <Header
        title="Menu"
        variant="light"
        onBack={onBack}
        onCart={onCart}
        cartCount={cartCount}
        onAdmin={onAdmin}
      />

      <main className="fl-menu__main">
        <h1 className="fl-menu__title">Choose your flowers</h1>
        <p className="fl-menu__lead">
          Every rose is hand-folded from satin ribbon, so it never wilts.
        </p>

        <div className="fl-menu__grid">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="fl-card"
              onClick={() => onSelectCategory(cat.id)}
              aria-label={`Open ${cat.title}`}
            >
              <span className="fl-card__photo">
                <img
                  src={CATEGORY_IMAGES[cat.id] || cat.image}
                  alt={cat.title}
                  loading="lazy"
                />
              </span>
              <span className="fl-card__body">
                <span className="fl-card__name">{cat.title}</span>
                <span className="fl-card__desc">{cat.subtitle}</span>
                <span className="fl-card__cta">Choose this</span>
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};
