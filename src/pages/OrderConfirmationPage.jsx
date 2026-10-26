
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  RotateCcw,
  SearchCheck
} from 'lucide-react';
import '../styles/confirmation.css';

const COLORS = {
  pink: '#E879A5',
  lightPink: '#F8C9DA',
  darkPink: '#C2255C',
  white: '#FFFFFF',
};

export const OrderConfirmationPage = ({
  order,
  proofUrl,
  onNewOrder,
  onTrack
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: [
          COLORS.darkPink,
          COLORS.pink,
          COLORS.lightPink,
          COLORS.white
        ]
      });
    } catch (e) {
      // Ignore if canvas is unavailable
    }
  }, []);

  if (!order) return null;

  
const formattedDate = new Date(
  order.created_at || Date.now()
).toLocaleString('en-PH', {
  timeZone: 'Asia/Manila',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});


  return (
    <div className="fl-done">
      <div className="fl-done__card">
        <div className="fl-done__check">
          <CheckCircle2 size={48} strokeWidth={2.4} />
        </div>

        <h1 className="fl-done__title">
          Your order is placed
        </h1>

        <p className="fl-done__lead">
          Thank you! We are preparing your flowers now.
        </p>

        <div className="fl-done__id">
          <span className="fl-done__id-label">
            Order number
          </span>

          <span className="fl-done__id-value">
            {order.order_number}
          </span>

          <span className="fl-done__id-date">
            {formattedDate}
          </span>
        </div>

        <p className="fl-done__hint">
          Remember this number. Use it to track your order.
        </p>

        <div className="fl-done__items">
          <h2>Your items</h2>

          {(order.order_items || []).map((item, idx) => (
            <div className="fl-done__row" key={idx}>
              <span>
                {item.product_name || item.name}
                <b> × {item.quantity}</b>
              </span>

              <span>
                ₱
                {Number(
                  item.subtotal ||
                  item.unit_price * item.quantity
                ).toLocaleString()}
              </span>
            </div>
          ))}

          <div className="fl-done__total">
            <span>Total</span>

            <span>
              ₱{Number(order.total_amount).toLocaleString()}
            </span>
          </div>
        </div>

        {proofUrl && (
          <section className="fl-photo fl-photo--done">
            <h2>Proof of delivery</h2>

            <div className="fl-photo__frame">
              <img
                src={proofUrl}
                alt="Photo taken with your order"
                className="fl-photo__video"
              />
            </div>

            <p>
              You can see this photo again in Track My Order.
            </p>
          </section>
        )}

        <div className="fl-done__actions">
          {onTrack && (
            <button
              type="button"
              className="fl-btn fl-btn--soft"
              onClick={onTrack}
            >
              <SearchCheck size={22} />
              Track this order
            </button>
          )}

          <button
            type="button"
            className="fl-btn fl-btn--rose"
            onClick={onNewOrder}
          >
            <RotateCcw size={22} />
            Back to menu
          </button>
        </div>
      </div>
    </div>
  );
};
