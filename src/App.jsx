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

const EMPTY_CUSTOMER = { name: '', email: '', phone: '', section: '' };

// Opened from the link in the rating email: yoursite.com/?rate=TOKEN
const RATING_TOKEN = new URLSearchParams(window.location.search).get('rate');

// Checkout steps that only make sense while the cart has items
const CHECKOUT_PAGES = ['customer-info', 'payment', 'payment-confirm'];

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

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [connStatus, setConnStatus] = useState(null);
  const [pendingInfo, setPendingInfo] = useState(null); // customer info waiting for the confirm popup

  useEffect(() => {
    try {
      sessionStorage.setItem('fleurs_kiosk_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Could not persist session cart', e);
    }
  }, [cart]);

  useEffect(() => {
    checkSupabaseConnection().then(setConnStatus);
  }, []);

  useEffect(() => {
    if (cart.length === 0 && CHECKOUT_PAGES.includes(currentPage)) {
      setCurrentPage('cart');
    }
  }, [cart, currentPage]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal =
    Math.round(
      cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0) * 100
    ) / 100;

  const handleAddToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            product_id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            quantity: quantity,
            image_url: product.image_url
          }
        ];
      }
    });

    setToastMessage(`${product.name} added to cart!`);
    setToastVisible(true);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // The form only asks for name, email and phone. The section is no longer used,
  // so a placeholder is saved with the order.
  // Step 1: the customer filled the form -> show the confirmation popup
  const handleCustomerInfoSubmit = (info) => {
    setPendingInfo({ ...info, section: info.section || 'N/A' });
  };

  // Step 2: the customer pressed CONFIRM in the popup -> go to payment
  const handleConfirmOrder = () => {
    setCustomerInfo(pendingInfo);
    setPendingInfo(null);
    setCurrentPage('payment');
  };

  const handleOrderSuccess = (orderData) => {
    // Send the rating email (runs in the background, never blocks the order)
    if (supabase && orderData?.order_number) {
      supabase.functions
        .invoke('super-api', {
          body: { order_number: orderData.order_number, site_url: window.location.origin }
        })
        .catch((e) => console.warn('Rating email failed', e));
    }

    setConfirmedOrder(orderData);
    setCart([]);
    setCustomerInfo(EMPTY_CUSTOMER);
    sessionStorage.removeItem('fleurs_kiosk_cart');
    setCurrentPage('confirmation');
  };

  const handleNewOrder = () => {
    setCart([]);
    setCustomerInfo(EMPTY_CUSTOMER);
    setConfirmedOrder(null);
    sessionStorage.removeItem('fleurs_kiosk_cart');
    setCurrentPage('menu');
  };

  // Customer opened the rating link from their email
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
            alignItems: 'center'
          }}
        >
          <button
            onClick={() => setIsConfigModalOpen(true)}
            style={{
              background: 'rgba(11, 21, 40, 0.85)',
              backdropFilter: 'blur(8px)',
              border: `1.5px dashed ${connStatus?.connected ? '#22c55e' : '#f59e0b'}`,
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
            <span>{connStatus?.connected ? 'Supabase Live' : 'Demo Mode (Setup DB)'}</span>
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

      {currentPage === 'cart' && (
        <CartPage
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onContinueShopping={() => setCurrentPage('menu')}
          onProceed={() => setCurrentPage('customer-info')}
        />
      )}

      {currentPage === 'customer-info' && (
        <CustomerInfoPage
          initialValues={customerInfo}
          onBack={() => setCurrentPage('cart')}
          onContinue={handleCustomerInfoSubmit}
        />
      )}

      {currentPage === 'payment' && (
        <PaymentPage
          cart={cart}
          totalAmount={cartTotal}
          onBack={() => setCurrentPage('customer-info')}
          onPaid={() => setCurrentPage('payment-confirm')}
        />
      )}

      {currentPage === 'payment-confirm' && (
        <PaymentConfirmationPage
          cart={cart}
          customer={customerInfo}
          totalAmount={cartTotal}
          onBack={() => setCurrentPage('payment')}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {currentPage === 'confirmation' && (
        <OrderConfirmationPage
          order={confirmedOrder}
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
              color: '#0d2547',
              textAlign: 'center',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <h2
              id="confirm-title"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.8rem',
                fontWeight: 800,
                marginBottom: '8px'
              }}
            >
              CONFIRM YOUR ORDER
            </h2>
            <p
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#1e3a8a',
                marginBottom: '16px'
              }}
            >
              Please click CONFIRM to proceed to payment.
            </p>

            <div
              style={{
                background: '#ffffff',
                border: '2px dashed #60a5fa',
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
                    fontWeight: 700
                  }}
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatPeso(Number(item.price) * item.quantity)}</span>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '2px dashed #93c5fd',
                  marginTop: '8px',
                  paddingTop: '10px',
                  fontSize: '1.3rem',
                  fontWeight: 800
                }}
              >
                <span>TOTAL</span>
                <span style={{ color: '#1d4ed8' }}>{formatPeso(cartTotal)}</span>
              </div>
            </div>

            <div
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#3b5a82',
                marginBottom: '18px',
                textAlign: 'left',
                wordBreak: 'break-word'
              }}
            >
              <div>Name: {pendingInfo.name}</div>
              <div>Email: {pendingInfo.email}</div>
              <div>Phone: {pendingInfo.phone}</div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}
            >
              <button
                className="kiosk-btn kiosk-btn-navy"
                onClick={() => setPendingInfo(null)}
              >
                CANCEL
              </button>
              <button
                className="kiosk-btn kiosk-btn-accent"
                onClick={handleConfirmOrder}
              >
                CONFIRM
              </button>
            </div>
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
