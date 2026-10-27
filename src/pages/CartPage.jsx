// src/pages/CartPage.jsx
import React, { useState } from 'react';
import { Header } from '../components/Header';
import { CartItem } from '../components/CartItem';
import { Button } from '../components/Button';
import {
  ShoppingBag,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import '../styles/light.css';

const MAX_ITEMS = 10;

export const CartPage = ({
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  onContinueShopping,
  onProceed
}) => {
  const [notice, setNotice] = useState('');

  const totalItems = cart.reduce(
    (sum, item) =>
      sum + Math.max(0, Number(item.quantity) || 0),
    0
  );

  const isAtLimit = totalItems >= MAX_ITEMS;
  const isOverLimit = totalItems > MAX_ITEMS;

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

  const handleCheckout = () => {
    if (totalItems > MAX_ITEMS) {
      setNotice(
        `Maximum of ${MAX_ITEMS} items per order only. ` +
        `Please remove ${totalItems - MAX_ITEMS} item(s) before checkout.`
      );
      return;
    }

    if (totalItems === 0) {
      setNotice('Please add an item before checkout.');
      return;
    }

    setNotice('');
    onProceed?.();
  };

  const handleUpdateQuantity = (id, quantity) => {
    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return;
    }

    const otherItems = cart
      .filter((item) => item.id !== id)
      .reduce(
        (sum, item) =>
          sum + Math.max(0, Number(item.quantity) || 0),
        0
      );

    if (otherItems + requestedQuantity > MAX_ITEMS) {
      setNotice(
        `Maximum of ${MAX_ITEMS} items per order only.`
      );
      return;
    }

    setNotice('');
    onUpdateQuantity?.(id, requestedQuantity);
  };

  const handleRemoveItem = (id) => {
    setNotice('');
    onRemoveItem?.(id);
  };

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
            <div
              role="status"
              aria-live="polite"
              style={{
                padding: '12px 16px',
                marginBottom: '16px',
                borderRadius: '10px',
                background: isOverLimit
                  ? '#FEE2E2'
                  : isAtLimit
                    ? '#FEF3C7'
                    : '#DCFCE7',
                color: isOverLimit
                  ? '#991B1B'
                  : isAtLimit
                    ? '#92400E'
                    : '#166534'
              }}
            >
              <strong>
                {totalItems}/{MAX_ITEMS} items
              </strong>

              <p style={{ margin: '4px 0 0' }}>
                {isOverLimit
                  ? `Maximum of ${MAX_ITEMS} items per order only. Remove ${
                      totalItems - MAX_ITEMS
                    } item(s) to continue.`
                  : isAtLimit
                    ? `You've reached the maximum of ${MAX_ITEMS} items per order.`
                    : `${MAX_ITEMS - totalItems} more item(s) available.`}
              </p>
            </div>

            {notice && (
              <div
                role="alert"
                aria-live="assertive"
                style={{
                  padding: '12px 16px',
                  marginBottom: '16px',
                  borderRadius: '10px',
                  background: '#FEE2E2',
                  color: '#991B1B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={20} />
                <span>{notice}</span>
              </div>
            )}

            <div className="fl-cart__list">
              {cart.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  canIncrease={totalItems < MAX_ITEMS}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
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
                  onClick={handleCheckout}
                  disabled={isOverLimit || totalItems === 0}
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