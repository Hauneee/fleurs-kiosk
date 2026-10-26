import React from 'react';
import { Sparkles, SearchCheck } from 'lucide-react';
import '../styles/home.css';

export const HomePage = ({ onStartOrder, onTrackOrder }) => {
  return (
    <div className="fl-home">
      <div className="fl-home__inner">
        <div className="fl-home__text">
          <h1 className="fl-home__title">Fleurs by Blossoms Craft</h1>
          <p className="fl-home__tagline">Handmade flowers, made with love.</p>
          <p className="fl-home__lead">
            Satin ribbon roses folded one petal at a time. They stay beautiful long after fresh
            flowers fade.
          </p>

          <div className="fl-home__actions">
            <button type="button" className="fl-home__btn fl-home__btn--rose" onClick={onStartOrder}>
              <Sparkles size={26} /> Start order
            </button>
            {onTrackOrder && (
              <button
                type="button"
                className="fl-home__btn fl-home__btn--soft"
                onClick={onTrackOrder}
              >
                <SearchCheck size={24} /> Track my order
              </button>
            )}
          </div>
          <p className="fl-home__hint">Touch the screen to begin your order.</p>
        </div>

        <div className="fl-home__photos">
          <img
            className="fl-home__hero"
            src="/images/bouquet.jpg"
            alt="Satin rose bouquets in red, pink and purple"
          />
          <div className="fl-home__small">
            <img src="/images/triple-flower.jpg" alt="Three satin roses" />
            <img src="/images/solo-flower.jpg" alt="A single red satin rose" />
          </div>
        </div>
      </div>
    </div>
  );
};
