import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { checkSupabaseConnection, isSupabaseConfigured, seedDefaultProducts } from '../services/supabase';
import { Database, CheckCircle, AlertTriangle, Key, Link as LinkIcon, RefreshCw } from 'lucide-react';

export const SupabaseConfigModal = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(
    localStorage.getItem('fleurs_supabase_url') || import.meta.env.VITE_SUPABASE_URL || ''
  );
  const [key, setKey] = useState(
    localStorage.getItem('fleurs_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );
  const [status, setStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleTest();
    }
  }, [isOpen]);

  const handleTest = async () => {
    setIsTesting(true);
    const res = await checkSupabaseConnection();
    setStatus(res);
    setIsTesting(false);
  };

  const handleSave = () => {
    localStorage.setItem('fleurs_supabase_url', url.trim());
    localStorage.setItem('fleurs_supabase_anon_key', key.trim());
    window.location.reload();
  };

  const handleClear = () => {
    localStorage.removeItem('fleurs_supabase_url');
    localStorage.removeItem('fleurs_supabase_anon_key');
    window.location.reload();
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    const success = await seedDefaultProducts();
    if (success) {
      alert('Successfully seeded initial Bouquet and Flower products into your Supabase database!');
      handleTest();
    } else {
      alert('Could not seed products. Please ensure the schema has been executed in the Supabase SQL Editor.');
    }
    setIsSeeding(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', color: '#0f274a' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#3b82f6',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Database size={26} />
          </div>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: '#0d2547',
                margin: 0
              }}
            >
              Supabase Connection Settings
            </h2>
            <div style={{ fontSize: '0.9rem', color: '#3b5a82' }}>
              Fleurs by Blossoms Craft Persistent Database
            </div>
          </div>
        </div>

        {/* Live Status Card */}
        <div
          style={{
            background: status?.connected ? '#dcfce7' : '#fef3c7',
            border: `2px dashed ${status?.connected ? '#22c55e' : '#f59e0b'}`,
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          {status?.connected ? (
            <CheckCircle size={28} color="#16a34a" />
          ) : (
            <AlertTriangle size={28} color="#d97706" />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: status?.connected ? '#15803d' : '#92400e' }}>
              {status?.connected ? 'CONNECTED TO SUPABASE' : 'SUPABASE NOT CONNECTED'}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#334155' }}>
              {status?.message || 'Checking status...'}
            </div>
          </div>
          <button
            onClick={handleTest}
            disabled={isTesting}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={16} className={isTesting ? 'animate-spin' : ''} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>TEST</span>
          </button>
        </div>

        {/* Config Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LinkIcon size={16} /> VITE_SUPABASE_URL:
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '2px solid #93c5fd',
                fontSize: '1rem',
                marginTop: '4px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={16} /> VITE_SUPABASE_ANON_KEY:
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '2px solid #93c5fd',
                fontSize: '1rem',
                marginTop: '4px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="accent" size="md" onClick={handleSave} style={{ flex: 1 }}>
            SAVE & RELOAD
          </Button>

          {status?.connected && (
            <Button variant="primary" size="md" onClick={handleSeed} disabled={isSeeding}>
              {isSeeding ? 'SEEDING...' : 'SEED PRODUCTS'}
            </Button>
          )}

          <Button variant="navy" size="md" onClick={handleClear}>
            RESET TO DEMO
          </Button>

          <Button variant="outline" size="md" onClick={onClose}>
            CLOSE
          </Button>
        </div>
      </div>
    </div>
  );
};
