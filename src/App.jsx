import React, { useState, useEffect } from 'react';

import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { BouquetPage } from './pages/BouquetPage';
import { SoloFlowerPage } from './pages/SoloFlowerPage';
import { TripleFlowerPage } from './pages/TripleFlowerPage';
import { CartPage } from './pages/CartPage';
import { CustomerInfoPage } from './pages/CustomerInfoPage';
import { PaymentPage } from './pages/PaymentPage';
import { PhotoProofPage } from './pages/PhotoProofPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { RatingPage } from './pages/RatingPage';

import { Toast } from './components/Toast';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';

import {
  checkSupabaseConnection,
  supabase,
  createOrder,
} from './services/supabase';

import { getPaymentInfo } from './utils/paymentInfo';
import { Database } from 'lucide-react';
import { formatPeso } from './utils/formatPeso';

import './styles/kiosk.css';
import './styles/checkout.css';
import './styles/track.css';

const MAX_ITEMS = 10;
const CART_STORAGE_KEY = 'fleurs_kiosk_cart';
const MAX_ITEMS_MESSAGE = 'Maximum order is only 10 items!';
const CHECKOUT_KEY = 'fleurs_checkout_key';

const EMPTY_CUSTOMER = {
  name: '',
  email: '',
  phone: '',
  section: '',
};

const RATING_TOKEN = new URLSearchParams(
  window.location.search
).get('rate');

const CHECKOUT_PAGES = ['customer-info', 'payment'];

const getQuantity = (item) =>
  Math.max(0, Number(item.quantity) || 0);

const getTotalItemCount = (items) =>
  items.reduce((sum, item) => sum + getQuantity(item), 0);

const getCheckoutKey = () => {
  let key = sessionStorage.getItem(CHECKOUT_KEY);

  if (!key) {
    if (typeof crypto?.randomUUID !== 'function') {
      throw new Error(
        'Secure checkout is unavailable in this browser. Please try again using a secure connection.'
      );
    }

    key = crypto.randomUUID();
    sessionStorage.setItem(CHECKOUT_KEY, key);
  }

  return key;
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const [cart, setCart] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CART_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(parsed)) return [];

      let remaining = MAX_ITEMS;
      const result = [];
      const productIndexes = new Map();

      parsed.forEach((item) => {
        if (!item || item.id == null || remaining <= 0) {
          return;
        }

        const quantity = Number(item.quantity);

        if (!Number.isInteger(quantity) || quantity < 1) {
          return;
        }

        const acceptedQuantity = Math.min(quantity, remaining);
        const existingIndex = productIndexes.get(String(item.id));

        if (existingIndex !== undefined) {
          result[existingIndex] = {
            ...result[existingIndex],
            quantity:
              result[existingIndex].quantity + acceptedQuantity,
          };
        } else {
          productIndexes.set(String(item.id), result.length);

          result.push({
            ...item,
            quantity: acceptedQuantity,
          });
        }

        remaining -= acceptedQuantity;
      });

      return result;
    } catch {
      return [];
    }
  });

  const [customerInfo, setCustomerInfo] = useState(EMPTY_CUSTOMER);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [trackPrefill, setTrackPrefill] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [connStatus, setConnStatus] = useState(null);

  const [pendingInfo, setPendingInfo] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  useEffect(() => {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.warn('Could not persist session cart', error);
    }
  }, [cart]);

  useEffect(() => {
    let active = true;

    checkSupabaseConnection()
      .then((status) => {
        if (active) setConnStatus(status);
      })
      .catch((error) => {
        console.warn('Supabase connection check failed', error);

        if (active) {
          setConnStatus({ connected: false });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      cart.length === 0 &&
      CHECKOUT_PAGES.includes(currentPage)
    ) {
      setCurrentPage('cart');
    }
  }, [cart, currentPage]);

  const cartCount = getTotalItemCount(cart);
  const remainingSlots = Math.max(0, MAX_ITEMS - cartCount);

  const cartTotal =
    Math.round(
      cart.reduce(
        (sum, item) =>
          sum + (Number(item.price) || 0) * getQuantity(item),
        0
      ) * 100
    ) / 100;

  const handleAddToCart = (product, quantity = 1) => {
    const requestedQuantity = Number(quantity);

    if (
      !product ||
      product.id == null ||
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      showToast('Invalid product or quantity.');
      return false;
    }

    const currentCount = getTotalItemCount(cart);

    if (currentCount + requestedQuantity > MAX_ITEMS) {
      showToast(MAX_ITEMS_MESSAGE);
      return false;
    }

    setCart((previousCart) => {
      const latestCount = getTotalItemCount(previousCart);

      if (latestCount + requestedQuantity > MAX_ITEMS) {
        return previousCart;
      }

      const existingIndex = previousCart.findIndex(
        (item) => String(item.id) === String(product.id)
      );

      if (existingIndex !== -1) {
        return previousCart.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: getQuantity(item) + requestedQuantity,
              }
            : item
        );
      }

      return [
        ...previousCart,
        {
          id: product.id,
          product_id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          quantity: requestedQuantity,
          image_url: product.image_url,
        },
      ];
    });

    showToast(`${product.name} added to cart!`);
    return true;
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    const requestedQuantity = Number(newQuantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      return;
    }

    const targetIndex = cart.findIndex(
      (item) => String(item.id) === String(productId)
    );

    if (targetIndex === -1) return;

    const otherItemsCount = cart.reduce(
      (sum, item, index) => {
        if (index === targetIndex) return sum;
        return sum + getQuantity(item);
      },
      0
    );

    if (otherItemsCount + requestedQuantity > MAX_ITEMS) {
      showToast(MAX_ITEMS_MESSAGE);
      return;
    }

    if (getQuantity(cart[targetIndex]) === requestedQuantity) {
      return;
    }

    setCart((previousCart) => {
      const latestTargetIndex = previousCart.findIndex(
        (item) => String(item.id) === String(productId)
      );

      if (latestTargetIndex === -1) return previousCart;

      const latestOtherItemsCount = previousCart.reduce(
        (sum, item, index) => {
          if (index === latestTargetIndex) return sum;
          return sum + getQuantity(item);
        },
        0
      );

      if (latestOtherItemsCount + requestedQuantity > MAX_ITEMS) {
        return previousCart;
      }

      return previousCart.map((item, index) =>
        index === latestTargetIndex
          ? { ...item, quantity: requestedQuantity }
          : item
      );
    });
  };

  const handleRemoveItem = (productId) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) => String(item.id) !== String(productId)
      )
    );
  };

  const handleProceedToCheckout = () => {
    if (cartCount === 0) {
      showToast('Please add an item to your cart.');
      return;
    }

    if (cartCount > MAX_ITEMS) {
      showToast(MAX_ITEMS_MESSAGE);
      return;
    }

    setPendingInfo(null);
    setCurrentPage('customer-info');
  };

  const handleCustomerInfoSubmit = (info) => {
    if (cartCount < 1 || cartCount > MAX_ITEMS) {
      showToast(MAX_ITEMS_MESSAGE);
      setCurrentPage('cart');
      return;
    }

    setPendingInfo({
      ...info,
      section: info.section || 'N/A',
    });

    setAcceptedTerms(false);
    setShowFullTerms(false);
  };

  const handleConfirmOrder = () => {
    if (!pendingInfo || !acceptedTerms) return;

    if (cartCount < 1 || cartCount > MAX_ITEMS) {
      setPendingInfo(null);
      setAcceptedTerms(false);
      setCurrentPage('cart');
      showToast(MAX_ITEMS_MESSAGE);
      return;
    }

    setCustomerInfo(pendingInfo);
    setPendingInfo(null);
    setShowFullTerms(false);
    setCurrentPage('payment');
  };

  // Save order successfully, then go straight to Photo Proof.
  const handleOrderSuccess = (orderData) => {
    if (supabase && orderData?.order_number) {
      supabase.functions
        .invoke('super-api', {
          body: {
            order_number: orderData.order_number,
            site_url: window.location.origin,
          },
        })
        .catch((error) =>
          console.warn('Rating email failed', error)
        );
    }

    setConfirmedOrder(orderData);
    setCart([]);
    setCustomerInfo(EMPTY_CUSTOMER);
    setPendingInfo(null);
    setAcceptedTerms(false);

    sessionStorage.removeItem(CART_STORAGE_KEY);
    sessionStorage.removeItem(CHECKOUT_KEY);
    sessionStorage.removeItem('fleurs_pay_ref');
    sessionStorage.removeItem('fleurs_payment_method');

    setProofUrl('');
    setCurrentPage('proof');
  };

  // Save the order directly from the Payment page.
  const handlePaymentComplete = async () => {
    if (isSavingOrder) return;

    if (cartCount < 1 || cartCount > MAX_ITEMS) {
      showToast(MAX_ITEMS_MESSAGE);
      setCurrentPage('cart');
      return;
    }

    const paymentInfo = getPaymentInfo() || {};
    const method = String(paymentInfo.method || '')
      .trim()
      .toLowerCase();

    const isCash = method === 'cash';
    const amount = Number(cartTotal) || 0;
    const cashReceived = Number(paymentInfo.cashReceived) || 0;
    const change = Math.max(0, cashReceived - amount);
    const paidRef = sessionStorage.getItem('fleurs_pay_ref');

    if (amount <= 0) {
      showToast('Your order total is invalid.');
      return;
    }

    if (!['cash', 'gcash'].includes(method)) {
      showToast('Please select Cash or GCash.');
      return;
    }

    if (isCash && cashReceived < amount) {
      showToast('Please enter enough cash on the Payment page.');
      return;
    }

    if (!isCash && !paidRef) {
      showToast('Please complete and verify the GCash payment first.');
      return;
    }

    setIsSavingOrder(true);

    try {
      const idempotencyKey = getCheckoutKey();

      const order = await createOrder(
        {
          customer: customerInfo,
          total_amount: amount,
          amount_paid: isCash ? cashReceived : amount,
          change_amount: isCash ? change : 0,
          payment_reference: isCash ? null : paidRef,
          idempotency_key: idempotencyKey,
        },
        cart
      );

      if (!order) {
        throw new Error('Unable to save the order. Please try again.');
      }

      handleOrderSuccess(order);
    } catch (error) {
      console.error('Order save failed:', error);

      showToast(
        error?.message || 'Unable to save the order. Please try again.'
      );
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleNewOrder = () => {
    setCart([]);
    setCustomerInfo(EMPTY_CUSTOMER);
    setConfirmedOrder(null);
    setPendingInfo(null);
    setAcceptedTerms(false);
    setShowFullTerms(false);
    setProofUrl('');

    sessionStorage.removeItem(CART_STORAGE_KEY);
    sessionStorage.removeItem(CHECKOUT_KEY);
    sessionStorage.removeItem('fleurs_pay_ref');
    sessionStorage.removeItem('fleurs_payment_method');

    setCurrentPage('menu');
  };

  if (RATING_TOKEN) {
    return <RatingPage token={RATING_TOKEN} />;
  }

  return (
    <div className="kiosk-app-container">
      {import.meta.env.DEV && (
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            zIndex: 100,
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            style={{
              background: 'rgba(11, 21, 40, 0.85)',
              backdropFilter: 'blur(8px)',
              border: `1.5px dashed ${
                connStatus?.connected ? '#22c55e' : '#f59e0b'
              }`,
              borderRadius: '9999px',
              padding: '6px 14px',
              color: connStatus?.connected ? '#86efac' : '#fde047',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
            title="Configure Supabase Database"
          >
            <Database size={14} />
            <span>
              {connStatus?.connected
                ? 'Supabase Live'
                : 'Demo Mode (Setup DB)'}
            </span>
          </button>
        </div>
      )}

      {currentPage === 'home' && (
        <HomePage
          onStartOrder={() => setCurrentPage('menu')}
          onTrackOrder={() => {
            setTrackPrefill('');
            setCurrentPage('track');
          }}
        />
      )}

      {currentPage === 'menu' && (
        <MenuPage
          onBack={() => setCurrentPage('home')}
          onSelectCategory={(categoryId) => setCurrentPage(categoryId)}
          onCart={() => setCurrentPage('cart')}
          cartCount={cartCount}
        />
      )}

      {currentPage === 'bouquet' && (
        <BouquetPage
          onBack={() => setCurrentPage('menu')}
          onCart={() => setCurrentPage('cart')}
          cartCount={cartCount}
          maxQuantity={remainingSlots}
          onLimitReached={() => showToast(MAX_ITEMS_MESSAGE)}
          onAddToCart={handleAddToCart}
        />
      )}

      {currentPage === 'solo-flower' && (
        <SoloFlowerPage
          onBack={() => setCurrentPage('menu')}
          onCart={() => setCurrentPage('cart')}
          cartCount={cartCount}
          maxQuantity={remainingSlots}
          onLimitReached={() => showToast(MAX_ITEMS_MESSAGE)}
          onAddToCart={handleAddToCart}
        />
      )}

      {currentPage === 'triple-flower' && (
        <TripleFlowerPage
          onBack={() => setCurrentPage('menu')}
          onCart={() => setCurrentPage('cart')}
          cartCount={cartCount}
          maxQuantity={remainingSlots}
          onLimitReached={() => showToast(MAX_ITEMS_MESSAGE)}
          onAddToCart={handleAddToCart}
        />
      )}

      {currentPage === 'cart' && (
        <CartPage
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onContinueShopping={() => setCurrentPage('menu')}
          onProceed={handleProceedToCheckout}
        />
      )}

      {currentPage === 'customer-info' && (
        <CustomerInfoPage
          initialValues={customerInfo}
          onBack={() => setCurrentPage('cart')}
          onContinue={handleCustomerInfoSubmit}
        />
      )}

      {/* Single Payment page: Cash or GCash. */}
      {currentPage === 'payment' && (
        <PaymentPage
          cart={cart}
          totalAmount={cartTotal}
          onBack={() => setCurrentPage('customer-info')}
          onPaid={handlePaymentComplete}
        />
      )}

      {/* Opens only after payment succeeds and the order is saved. */}
      {currentPage === 'proof' && (
        <PhotoProofPage
          order={confirmedOrder}
          onDone={(url) => {
            setProofUrl(url || '');
            setCurrentPage('confirmation');
          }}
        />
      )}

      {/* Final order completion page after Photo Proof. */}
      {currentPage === 'confirmation' && (
        <OrderConfirmationPage
          order={confirmedOrder}
          proofUrl={proofUrl}
          onNewOrder={handleNewOrder}
          onTrack={() => {
            setTrackPrefill(confirmedOrder?.order_number || '');
            setCurrentPage('track');
          }}
        />
      )}

      {currentPage === 'track' && (
        <TrackOrderPage
          initialOrderNumber={trackPrefill}
          onBack={() => setCurrentPage('home')}
        />
      )}

      {/* Customer information and Terms & Conditions modal */}
      {currentPage === 'customer-info' && pendingInfo && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="modal-content"
            style={{
              color: '#3f1424',
              textAlign: 'center',
              maxHeight: '90vh',
              overflowY: 'auto',
              width: 'min(680px, 95vw)',
            }}
          >
            {showFullTerms ? (
              <>
                <h2
                  id="confirm-title"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    marginBottom: '16px',
                    color: '#7d193e',
                  }}
                >
                  TERMS &amp; CONDITIONS
                </h2>

                <div
                  style={{
                    textAlign: 'left',
                    lineHeight: 1.7,
                    marginBottom: '20px',
                  }}
                >
                  <h3>1. Order Confirmation</h3>
                  <p>
                    Please review your selected products, quantities,
                    and total amount before proceeding to payment.
                  </p>

                  <h3>2. Payments</h3>
                  <p>
                    Customers must complete the selected payment process.
                    QR payments must be successfully verified before an
                    order can be completed.
                  </p>

                  <h3>3. Flower Arrangements</h3>
                  <p>
                    Flowers and handmade arrangements may vary slightly
                    in appearance due to the availability and natural
                    characteristics of the materials.
                  </p>

                  <h3>4. Order Changes and Cancellations</h3>
                  <p>
                    Please contact the shop as soon as possible if you
                    need to request a change or cancellation. Requests
                    are subject to the shop's confirmation.
                  </p>

                  <h3>5. Customer Information</h3>
                  <p>
                    Customers are responsible for providing accurate
                    contact information for order-related communication.
                  </p>

                  <h3>6. Agreement</h3>
                  <p>
                    By checking the acceptance box, you confirm that you
                    have read and agree to these Terms &amp; Conditions.
                  </p>
                </div>

                <button
                  type="button"
                  className="kiosk-btn kiosk-btn-navy"
                  onClick={() => setShowFullTerms(false)}
                >
                  BACK TO YOUR ORDER
                </button>
              </>
            ) : (
              <>
                <h2
                  id="confirm-title"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    marginBottom: '8px',
                    color: '#7d193e',
                  }}
                >
                  CONFIRM YOUR ORDER
                </h2>

                <p
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: '#7a5261',
                    marginBottom: '16px',
                  }}
                >
                  Review your order before proceeding to payment.
                </p>

                <div
                  style={{
                    background: '#ffffff',
                    border: '2px solid #f1d5dc',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    marginBottom: '14px',
                  }}
                >
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '6px 0',
                        fontWeight: 700,
                        color: '#3f1424',
                      }}
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>

                      <span>
                        {formatPeso(
                          (Number(item.price) || 0) * getQuantity(item)
                        )}
                      </span>
                    </div>
                  ))}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #f1d5dc',
                      marginTop: '8px',
                      paddingTop: '10px',
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      color: '#7d193e',
                    }}
                  >
                    <span>TOTAL</span>
                    <span>{formatPeso(cartTotal)}</span>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#654552',
                    marginBottom: '18px',
                    textAlign: 'left',
                    overflowWrap: 'anywhere',
                  }}
                >
                  <div>Name: {pendingInfo.name}</div>
                  <div>Email: {pendingInfo.email}</div>
                  <div>Phone: {pendingInfo.phone}</div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullTerms(true)}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#c2255c',
                    textDecoration: 'underline',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    marginBottom: '16px',
                  }}
                >
                  READ FULL TERMS &amp; CONDITIONS
                </button>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    textAlign: 'left',
                    lineHeight: 1.5,
                    marginBottom: '20px',
                    cursor: 'pointer',
                    color: '#3f1424',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) =>
                      setAcceptedTerms(event.target.checked)
                    }
                    style={{
                      width: '20px',
                      height: '20px',
                      flexShrink: 0,
                      marginTop: '2px',
                      accentColor: '#c2255c',
                      cursor: 'pointer',
                    }}
                  />

                  <span>
                    I have read and agree to the Terms &amp; Conditions.
                    <span style={{ color: '#dc2626' }}> *</span>
                  </span>
                </label>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  <button
                    type="button"
                    className="kiosk-btn kiosk-btn-accent"
                    onClick={handleConfirmOrder}
                    disabled={!acceptedTerms}
                    style={{
                      opacity: acceptedTerms ? 1 : 0.5,
                      cursor: acceptedTerms ? 'pointer' : 'not-allowed',
                    }}
                  >
                    CONFIRM &amp; CONTINUE
                  </button>

                  <button
                    type="button"
                    className="kiosk-btn kiosk-btn-navy"
                    onClick={() => {
                      setPendingInfo(null);
                      setAcceptedTerms(false);
                      setShowFullTerms(false);
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}