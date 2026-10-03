import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorMessage } from '../components/ErrorMessage';
import {
  fetchAllAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../services/supabase';
import { FLOWER_IMAGES } from '../assets/flowerAssets';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Package,
  Layers,
  Image as ImageIcon
} from 'lucide-react';

export const AdminInventoryPage = ({ onBackToDashboard }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit / Create modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('bouquet');
  const [price, setPrice] = useState('500');
  const [stock, setStock] = useState('20');
  const [description, setDescription] = useState('');
  const [selectedImageKey, setSelectedImageKey] = useState('blue-bouquet');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllAdminProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setError('Failed to fetch inventory from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('bouquet');
    setPrice('500');
    setStock('25');
    setDescription('');
    setSelectedImageKey('blue-bouquet');
    setCustomImageUrl('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setPrice(String(product.price));
    setStock(String(product.stock || 20));
    setDescription(product.description || '');
    setCustomImageUrl(product.image_url?.startsWith('http') ? product.image_url : '');
    setIsActive(product.is_active);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please provide a product name.');

    const finalImageUrl = customImageUrl.trim()
      ? customImageUrl.trim()
      : FLOWER_IMAGES[selectedImageKey] || FLOWER_IMAGES['blue-bouquet'];

    const payload = {
      name: name.trim().toUpperCase(),
      category,
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      description: description.trim(),
      image_url: finalImageUrl,
      is_active: isActive
    };

    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, payload);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p))
        );
      } else {
        const created = await createProduct({
          ...payload,
          id: `prod-${Date.now()}`
        });
        setProducts((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(`Failed to save product: ${err.message}`);
    }
  };

  const handleDelete = async (id, productName) => {
    if (window.confirm(`Are you sure you want to remove "${productName}" from inventory?`)) {
      try {
        await deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        alert(`Failed to delete product: ${err.message}`);
      }
    }
  };

  const toggleProductActive = async (product) => {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: !product.is_active } : p))
      );
    } catch (err) {
      alert(`Could not toggle status: ${err.message}`);
    }
  };

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
      {/* Top Bar */}
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
            onClick={onBackToDashboard}
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
            <span>BACK TO ORDERS</span>
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
              INVENTORY MANAGEMENT
            </h1>
            <div style={{ fontSize: '0.95rem', color: '#93c5fd' }}>
              Manage Products, Pricing, Images & Stock Levels in Supabase
            </div>
          </div>
        </div>

        <Button
          variant="accent"
          size="md"
          onClick={openCreateModal}
          icon={<Plus size={22} />}
        >
          ADD NEW PRODUCT
        </Button>
      </div>

      {/* Main Table or Card List */}
      {loading ? (
        <LoadingScreen message="Loading flower catalog from Supabase..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadProducts} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}
        >
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                background: '#ffffff',
                color: '#0f274a',
                borderRadius: '24px',
                border: '2px dashed #93c5fd',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                opacity: p.is_active ? 1 : 0.65
              }}
            >
              {/* Product Header & Image */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '16px',
                    background: '#f0f7ff',
                    border: '1.5px dashed #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    flexShrink: 0
                  }}
                >
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: '#2563eb',
                      textTransform: 'uppercase'
                    }}
                  >
                    {p.category}
                  </span>
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: '#0d2547',
                      lineHeight: 1.2
                    }}
                  >
                    {p.name}
                  </h3>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: '#1d4ed8'
                    }}
                  >
                    ₱{Number(p.price).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Stock and Status Details */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.95rem'
                }}
              >
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>STOCK: </span>
                  <strong style={{ color: p.stock > 5 ? '#16a34a' : '#ea580c' }}>
                    {p.stock} units
                  </strong>
                </div>

                <button
                  onClick={() => toggleProductActive(p)}
                  style={{
                    border: 'none',
                    background: p.is_active ? '#dcfce7' : '#fee2e2',
                    color: p.is_active ? '#15803d' : '#991b1b',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: 'auto',
                  borderTop: '1px dashed #e2e8f0',
                  paddingTop: '12px'
                }}
              >
                <button
                  onClick={() => openEditModal(p)}
                  style={{
                    flex: 1,
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #7dd3fc',
                    borderRadius: '9999px',
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Edit2 size={16} />
                  <span>EDIT</span>
                </button>

                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '9999px',
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '580px', color: '#0f274a' }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0d2547',
                marginBottom: '18px',
                textAlign: 'center'
              }}
            >
              {editingProduct ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}
            </h2>

            <form
              onSubmit={handleSaveProduct}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a' }}>
                  PRODUCT NAME:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. BLUE BOUQUET"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid #93c5fd',
                    fontSize: '1.05rem',
                    marginTop: '4px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a' }}>
                    CATEGORY:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid #93c5fd',
                      fontSize: '1rem',
                      marginTop: '4px',
                      background: '#ffffff'
                    }}
                  >
                    <option value="bouquet">Bouquet (₱500 default)</option>
                    <option value="solo-flower">Solo Flower</option>
                    <option value="triple-flower">Triple Flower</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a' }}>
                    PRICE (₱):
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="1"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid #93c5fd',
                      fontSize: '1.05rem',
                      marginTop: '4px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a' }}>
                    INITIAL STOCK:
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    min="0"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid #93c5fd',
                      fontSize: '1.05rem',
                      marginTop: '4px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a' }}>
                    STATUS:
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ fontWeight: 700 }}>Visible on Kiosk</span>
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a' }}>
                  FLOWER GRAPHIC / PRESET:
                </label>
                <select
                  value={selectedImageKey}
                  onChange={(e) => setSelectedImageKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid #93c5fd',
                    fontSize: '1rem',
                    marginTop: '4px',
                    background: '#ffffff'
                  }}
                >
                  <option value="blue-bouquet">Blue Bouquet Graphic</option>
                  <option value="red-bouquet">Red Bouquet Graphic</option>
                  <option value="tulip-bouquet">Tulip Bouquet Graphic</option>
                  <option value="purple-bouquet">Purple Bouquet Graphic</option>
                  <option value="brown-bouquet">Brown Bouquet Graphic</option>
                  <option value="rose">Solo Rose</option>
                  <option value="sunflower">Solo Sunflower</option>
                  <option value="tulip">Solo Tulip</option>
                  <option value="lily">Solo Lily</option>
                  <option value="daisy">Solo Daisy</option>
                  <option value="carnation">Solo Carnation</option>
                  <option value="triple-rose">Triple Rose Trio</option>
                  <option value="triple-sunflower">Triple Sunflower Trio</option>
                  <option value="triple-tulip-lily">Triple Tulip & Lily Trio</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a' }}>
                  OR CUSTOM IMAGE URL (Supabase Storage URL):
                </label>
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '2px solid #93c5fd',
                    fontSize: '0.95rem',
                    marginTop: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a' }}>
                  DESCRIPTION:
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  placeholder="Product description for kiosk display..."
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '2px solid #93c5fd',
                    fontSize: '0.95rem',
                    marginTop: '4px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <Button
                  type="submit"
                  variant="accent"
                  size="md"
                  style={{ flex: 1 }}
                >
                  SAVE CHANGES
                </Button>
                <Button
                  type="button"
                  variant="navy"
                  size="md"
                  onClick={() => setIsModalOpen(false)}
                >
                  CANCEL
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
