import React, { useState, useEffect } from 'react';
import { OrderCard } from '../components/OrderCard';
import { Button } from '../components/Button';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorMessage } from '../components/ErrorMessage';
import {
  fetchOrders,
  updateOrderStatus,
  checkSupabaseConnection
} from '../services/supabase';
import {
  RefreshCw,
  ArrowLeft,
  Package,
  Layers,
  Database,
  Filter
} from 'lucide-react';

export const AdminDashboardPage = ({ onBackToKiosk, onOpenInventory }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [connectionStatus, setConnectionStatus] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrders();
      setOrders(data);
      const conn = await checkSupabaseConnection();
      setConnectionStatus(conn);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to retrieve orders from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000); // auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
    } catch (err) {
      alert(`Could not update order status: ${err.message}`);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    if (activeFilter === 'all') return true;
    return ord.status === activeFilter;
  });

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #07101f 0%, #0d1b30 100%)',
        color: '#ffffff',
        padding: '24px 32px'
      }}
    >
      {/* Top Admin Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '2px dashed rgba(147, 197, 253, 0.3)',
          paddingBottom: '20px',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBackToKiosk}
            className="kiosk-btn"
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              border: '2px dashed #93c5fd',
              padding: '10px 20px',
              fontSize: '1rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ArrowLeft size={20} />
            <span>BACK TO KIOSK</span>
          </button>

          <div>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2.4rem',
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}
            >
              STAFF ORDER DASHBOARD
            </h1>
            <div style={{ fontSize: '0.95rem', color: '#93c5fd' }}>
              Fleurs by Blossoms Craft Management Portal
            </div>
          </div>
        </div>

        {/* Action Controls: Refresh, Inventory, Database status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {connectionStatus && (
            <span
              style={{
                background: connectionStatus.connected
                  ? 'rgba(34, 197, 94, 0.18)'
                  : 'rgba(234, 179, 8, 0.18)',
                color: connectionStatus.connected ? '#86efac' : '#fde047',
                border: `1.5px solid ${connectionStatus.connected ? '#22c55e' : '#eab308'}`,
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Database size={14} />
              {connectionStatus.connected ? 'SUPABASE LIVE' : 'OFFLINE CACHE'}
            </span>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={onOpenInventory}
            icon={<Layers size={20} />}
          >
            INVENTORY
          </Button>

          <Button
            variant="navy"
            size="md"
            onClick={loadOrders}
            icon={<RefreshCw size={20} className={loading ? 'animate-spin' : ''} />}
          >
            REFRESH
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '28px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}
      >
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={16} /> STATUS:
        </span>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((tab) => {
          const isActive = activeFilter === tab;
          const count =
            tab === 'all'
              ? orders.length
              : orders.filter((o) => o.status === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              style={{
                background: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                color: isActive ? '#ffffff' : '#93c5fd',
                border: isActive ? '2px solid #60a5fa' : '1px dashed rgba(147, 197, 253, 0.4)',
                borderRadius: '9999px',
                padding: '8px 18px',
                fontSize: '0.95rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab}</span>
              <span
                style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem'
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {loading && orders.length === 0 ? (
        <LoadingScreen message="Loading live orders from Supabase..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadOrders} />
      ) : filteredOrders.length === 0 ? (
        <div
          className="stitch-panel"
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#cbd5e1'
          }}
        >
          <Package size={52} style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '8px' }}>
            No Orders Found
          </h3>
          <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>
            {activeFilter === 'all'
              ? 'New orders placed from the kiosk will automatically appear here.'
              : `No orders currently match status "${activeFilter}".`}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px'
          }}
        >
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
