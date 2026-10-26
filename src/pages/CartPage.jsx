
import React from 'react';
import { Header } from '../components/Header';
import { CartItem } from '../components/CartItem';
import { Button } from '../components/Button';
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import '../styles/light.css';

export const CartPage = ({
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  onContinueShopping,
  onProceed
}) => {
  const totalAmount = cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;

    return sum + price * quantity;
  }, 0);

  const formatPrice = (amount) =>
    `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  return (
    <div className="fl-light fl-page">
      <Header
        title="Shopping cart"
        variant="light"
        onBack={onContinueShopping}
        showCart={false}
      />

      <main className="fl-page__main">
        {cart.length === 0 ? (
          <div className="fl-empty">
            <div className="fl-empty__icon">
              <ShoppingBag size={36} />
            </div>

            <h2>Your cart is empty</h2>

            <p>
              Pick a bouquet or a ribbon rose from the menu
              to get started.
            </p>

            <Button
              variant="accent"
              size="lg"
              onClick={onContinueShopping}
              icon={<ArrowLeft size={22} />}
            >
              Browse the menu
            </Button>
          </div>
        ) : (
          <div className="fl-cart">
            <div className="fl-cart__list">
              {cart.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemoveItem}
                />
              ))}
            </div>

            <div className="fl-total">
              <div className="fl-total__row">
                <span>Total</span>

                <span className="fl-total__value">
                  {formatPrice(totalAmount)}
                </span>
              </div>

<div className="fl-total__actions">
  <Button
    variant="navy"
    size="lg"
    onClick={onContinueShopping}
  >
    Continue shopping
  </Button>

  <Button
    variant="accent"
    size="lg"
    onClick={onProceed}
  >
    Checkout
  </Button>
</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
