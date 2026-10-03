import React, { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { BouquetPage } from './pages/BouquetPage';
import { SoloFlowerPage } from './pages/SoloFlowerPage';
import { TripleFlowerPage } from './pages/TripleFlowerPage';
import { CartPage } from './pages/CartPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminInventoryPage } from './pages/AdminInventoryPage';
import { Toast } from './components/Toast';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { checkSupabaseConnection } from './services/supabase';
import { Database } from 'lucide-react';
import './styles/kiosk.css';

export default function App() {
  // Navigation State
  const [currentPage, setCurrentPage] = useState('home');
  // Pages: 'home' | 'menu' | 'solo-flower' | 'triple-flower' | 'bouquet' | 'cart' | 'confirmation' | 'admin-orders' | 'admin-inventory'

  // Cart State
  const [cart, setCart] = useState(() => {
    try {
      const saved = sessionStorage.getItem('fleurs_kiosk_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Confirmed Order State
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Supabase Status & Config Modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [connStatus, setConnStatus] = useState(null);

  // Save cart to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('fleurs_kiosk_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Could not persist session cart', e);
    }
  }, [cart]);

  // Initial connection check
  useEffect(() => {
    checkSupabaseConnection().then(setConnStatus);
  }, []);

  // Total quantity of items in cart
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cart handlers
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

    // Show toast confirmation
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

  const handleOrderSuccess = (orderData) => {
    setConfirmedOrder(orderData);
    setCart([]);
    sessionStorage.removeItem('fleurs_kiosk_cart');
    setCurrentPage('confirmation');
  };

  const handleNewOrder = () => {
    setCart([]);
    setConfirmedOrder(null);
    sessionStorage.removeItem('fleurs_kiosk_cart');
    setCurrentPage('menu');
  };

  return (
    <div className="kiosk-app-container">
      {/* Floating Kiosk Status & Settings Indicator (Non-intrusive) */}
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

      {/* Pages Switcher */}
      {currentPage === 'home' && (
        <HomePage
          onStartOrder={() => setCurrentPage('menu')}
          onAdmin={() => setCurrentPage('admin-orders')}
        />
      )}

      {currentPage === 'menu' && (
        <MenuPage
          onBack={() => setCurrentPage('home')}
          onSelectCategory={(categoryId) => setCurrentPage(categoryId)}
          onCart={() => setCurrentPage('cart')}
          cartCount={cartCount}
          onAdmin={() => setCurrentPage('admin-orders')}
        />
      )}

      {currentPage === 'bouquet' && (
        <BouquetPage
          onBack={() => setCurrentPage('menu')}
          onCart={() => setCurrentPage('cart')}
          cartCount={cartCount}
          onAddToCart={handleAddToCart}
          onAdmin={() => setCurrentPage('admin-orders')}
        />
      )}

      {currentPage === 'solo-flower' && (
        <SoloFlowerPage
          onBack={() => setCurrentPage('menu')}
          onCart={() => setCurrentPage('cart')}
          cartCount={cartCount}
          onAddToCart={handleAddToCart}
          onAdmin={() => setCurrentPage('admin-orders')}
        />
      )}

      {currentPage === 'triple-flower' && (
        <TripleFlowerPage
          onBack={() => setCurrentPage('menu')}
          onCart={() => setCurrentPage('cart')}
          cartCount={cartCount}
          onAddToCart={handleAddToCart}
          onAdmin={() => setCurrentPage('admin-orders')}
        />
      )}

      {currentPage === 'cart' && (
        <CartPage
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onContinueShopping={() => setCurrentPage('menu')}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {currentPage === 'confirmation' && (
        <OrderConfirmationPage
          order={confirmedOrder}
          onNewOrder={handleNewOrder}
        />
      )}

      {currentPage === 'admin-orders' && (
        <AdminDashboardPage
          onBackToKiosk={() => setCurrentPage('menu')}
          onOpenInventory={() => setCurrentPage('admin-inventory')}
        />
      )}

      {currentPage === 'admin-inventory' && (
        <AdminInventoryPage
          onBackToDashboard={() => setCurrentPage('admin-orders')}
        />
      )}

      {/* Notification Toast */}
      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      {/* Supabase Connection Setup Modal */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}
