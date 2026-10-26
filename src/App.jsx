import React, { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { BouquetPage } from './pages/BouquetPage';
import { SoloFlowerPage } from './pages/SoloFlowerPage';
import { TripleFlowerPage } from './pages/TripleFlowerPage';
import { CartPage } from './pages/CartPage';
import { CustomerInfoPage } from './pages/CustomerInfoPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentConfirmationPage } from './pages/PaymentConfirmationPage';
import { PhotoProofPage } from './pages/PhotoProofPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { RatingPage } from './pages/RatingPage';
import { Toast } from './components/Toast';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { checkSupabaseConnection, supabase } from './services/supabase';
import { Database } from 'lucide-react';
import { formatPeso } from './utils/formatPeso';

import './styles/kiosk.css';
import './styles/checkout.css';
import './styles/track.css';

const EMPTY_CUSTOMER = {
  name: '',
  email: '',
  phone: '',
  section: ''
};

const RATING_TOKEN = new URLSearchParams(
  window.location.search
).get('rate');

const CHECKOUT_PAGES = [
  'customer-info',
  'payment',
  'payment-confirm'
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const [cart, setCart] = useState(() => {
    try {
      const saved = sessionStorage.getItem('fleurs_kiosk_cart');
      return saved ? JSON.parse(saved) : [];
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

  // Save the cart for the current session.
  useEffect(() => {
    try {
      sessionStorage.setItem(
        'fleurs_kiosk_cart',
        JSON.stringify(cart)
      );
    } catch (e) {
      console.warn('Could not persist session cart', e);
    }
  }, [cart]);

  // Check the Supabase connection.
  useEffect(() => {
    checkSupabaseConnection().then(setConnStatus);
  }, []);

  // Return to the cart if it becomes empty during checkout.
  useEffect(() => {
    if (cart.length === 0 && CHECKOUT_PAGES.includes(currentPage)) {
      setCurrentPage('cart');
    }
  }, [cart, currentPage]);

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const cartTotal =
    Math.round(
      cart.reduce(
        (sum, item) =>
          sum + Number(item.price) * item.quantity,
        0
      ) * 100
    ) / 100;

  // Add a product to the cart.
  const handleAddToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.id === product.id
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };

        return updated;
      }

      return [
        ...prevCart,
        {
          id: product.id,
          product_id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          quantity,
          image_url: product.image_url
        }
      ];
    });

    setToastMessage(`${product.name} added to cart!`);
    setToastVisible(true);
  };

  // Update the quantity of a cart item.
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remove a product from the cart.
  const handleRemoveItem = (productId) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.id !== productId)
    );
  };

  // Step 1: Customer submits their information.
  const handleCustomerInfoSubmit = (info) => {
    setPendingInfo({
      ...info,
      section: info.section || 'N/A'
    });

    setAcceptedTerms(false);
    setShowFullTerms(false);
  };

  // Step 2: Proceed only after the customer accepts the terms.
  const handleConfirmOrder = () => {
    if (!pendingInfo || !acceptedTerms) return;

    setCustomerInfo(pendingInfo);
    setPendingInfo(null);
    setShowFullTerms(false);
    setCurrentPage('payment');
  };

  // Handle a successfully created order.
  const handleOrderSuccess = (orderData) => {
    if (supabase && orderData?.order_number) {
      supabase.functions
        .invoke('super-api', {
          body: {
            order_number: orderData.order_number,
            site_url: window.location.origin
          }
        })
        .catch((e) => console.warn('Rating email failed', e));
    }

    setConfirmedOrder(orderData);
    setCart([]);
    setCustomerInfo(EMPTY_CUSTOMER);
    setPendingInfo(null);
    setAcceptedTerms(false);

    sessionStorage.removeItem('fleurs_kiosk_cart');

    setProofUrl('');
    setCurrentPage('proof');
  };

  // Start a new order.
  const handleNewOrder = () => {
    setCart([]);
    setCustomerInfo(EMPTY_CUSTOMER);
    setConfirmedOrder(null);
    setPendingInfo(null);
    setAcceptedTerms(false);
    setShowFullTerms(false);
    setProofUrl('');

    sessionStorage.removeItem('fleurs_kiosk_cart');
    setCurrentPage('menu');
  };

  if (RATING_TOKEN) {
    return <RatingPage token={RATING_TOKEN} />;
  }

  return (
    <div className="kiosk-app-container">
      {/* Development-only Supabase status button */}
      {import.meta.env.DEV && (
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            zIndex: 100,
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          <button
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
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

      {/* Home page */}
      {currentPage === 'home' && (
        <HomePage
          onStartOrder={() => setCurrentPage('menu')}
          onTrackOrder={() => {
            setTrackPrefill('');
            setCurrentPage('track');
          }}
        />
      )}

      {/* Menu page */}
      {currentPage === 'menu' && (
        <MenuPage
          onBack={() => setCurrentPage('home')}
          onSelectCategory={(categoryId) =>
            setCurrentPage(categoryId)
          }
          onCart={() => setCurrentPage('cart')}
          cartCount={cartCount}
        />
      )}

      {/* Product categories */}
      {currentPage === 'bouquet' && (
        <BouquetPage
          onBack={() => setCurrentPage('menu')}
          onCart={() => setCurrentPage('cart')}
          cartCount={cartCount}
          onAddToCart={handleAddToCart}
        />
      )}

      {currentPage === 'solo-flower' && (
        <SoloFlowerPage
          onBack={() => setCurrentPage('menu')}
          onCart={() => setCurrentPage('cart')}
          cartCount={cartCount}
          onAddToCart={handleAddToCart}
        />
      )}

      {currentPage === 'triple-flower' && (
        <TripleFlowerPage
          onBack={() => setCurrentPage('menu')}
          onCart={() => setCurrentPage('cart')}
          cartCount={cartCount}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart */}
      {currentPage === 'cart' && (
        <CartPage
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onContinueShopping={() => setCurrentPage('menu')}
          onProceed={() => setCurrentPage('customer-info')}
        />
      )}

      {/* Customer information */}
      {currentPage === 'customer-info' && (
        <CustomerInfoPage
          initialValues={customerInfo}
          onBack={() => setCurrentPage('cart')}
          onContinue={handleCustomerInfoSubmit}
        />
      )}

      {/* Payment */}
      {currentPage === 'payment' && (
        <PaymentPage
          cart={cart}
          totalAmount={cartTotal}
          onBack={() => setCurrentPage('customer-info')}
          onPaid={() => setCurrentPage('payment-confirm')}
        />
      )}

      {/* Payment confirmation */}
      {currentPage === 'payment-confirm' && (
        <PaymentConfirmationPage
          cart={cart}
          customer={customerInfo}
          totalAmount={cartTotal}
          onBack={() => setCurrentPage('payment')}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* Photo proof */}
      {currentPage === 'proof' && (
        <PhotoProofPage
          order={confirmedOrder}
          onDone={(url) => {
            setProofUrl(url || '');
            setCurrentPage('confirmation');
          }}
        />
      )}

      {/* Order confirmation */}
      {currentPage === 'confirmation' && (
        <OrderConfirmationPage
          order={confirmedOrder}
          proofUrl={proofUrl}
          onNewOrder={handleNewOrder}
          onTrack={() => {
            setTrackPrefill(
              confirmedOrder?.order_number || ''
            );
            setCurrentPage('track');
          }}
        />
      )}

      {/* Track order */}
      {currentPage === 'track' && (
        <TrackOrderPage
          initialOrderNumber={trackPrefill}
          onBack={() => setCurrentPage('home')}
        />
      )}

      {/* Confirm order and accept terms modal */}
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
              width: 'min(680px, 95vw)'
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
                    color: '#7d193e'
                  }}
                >
                  TERMS & CONDITIONS
                </h2>

                <div
                  style={{
                    textAlign: 'left',
                    lineHeight: 1.7,
                    marginBottom: '20px'
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
                    have read and agree to these Terms & Conditions.
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
                    color: '#7d193e'
                  }}
                >
                  CONFIRM YOUR ORDER
                </h2>

                <p
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: '#7a5261',
                    marginBottom: '16px'
                  }}
                >
                  Review your order before proceeding to payment.
                </p>

                {/* Order items and total */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '2px solid #f1d5dc',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    marginBottom: '14px'
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
                        color: '#3f1424'
                      }}
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>

                      <span>
                        {formatPeso(
                          Number(item.price) * item.quantity
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
                      color: '#7d193e'
                    }}
                  >
                    <span>TOTAL</span>
                    <span>{formatPeso(cartTotal)}</span>
                  </div>
                </div>

                {/* Customer details */}
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#654552',
                    marginBottom: '18px',
                    textAlign: 'left',
                    overflowWrap: 'anywhere'
                  }}
                >
                  <div>Name: {pendingInfo.name}</div>
                  <div>Email: {pendingInfo.email}</div>
                  <div>Phone: {pendingInfo.phone}</div>
                </div>

                {/* View full terms */}
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
                    marginBottom: '16px'
                  }}
                >
                  READ FULL TERMS & CONDITIONS
                </button>

                {/* Accept terms checkbox */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    textAlign: 'left',
                    lineHeight: 1.5,
                    marginBottom: '20px',
                    cursor: 'pointer',
                    color: '#3f1424'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) =>
                      setAcceptedTerms(e.target.checked)
                    }
                    style={{
                      width: '20px',
                      height: '20px',
                      flexShrink: 0,
                      marginTop: '2px',
                      accentColor: '#c2255c',
                      cursor: 'pointer'
                    }}
                  />

                  <span>
                    I have read and agree to the Terms & Conditions.
                    <span style={{ color: '#dc2626' }}> *</span>
                  </span>
                </label>

                {/* Buttons: confirm first, cancel second */}
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                  }}
                >
                  <button
                    type="button"
                    className="kiosk-btn kiosk-btn-accent"
                    onClick={handleConfirmOrder}
                    disabled={!acceptedTerms}
                    style={{
                      opacity: acceptedTerms ? 1 : 0.5,
                      cursor: acceptedTerms
                        ? 'pointer'
                        : 'not-allowed'
                    }}
                  >
                    CONFIRM & CONTINUE
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

      {/* Toast notifications */}
      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      {/* Supabase configuration */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}