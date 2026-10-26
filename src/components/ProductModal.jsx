import React, { useState } from 'react';
import { QuantitySelector } from './QuantitySelector';
import { Button } from './Button';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export const ProductModal = ({ product, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fl-pm" onClick={(e) => e.stopPropagation()}>
        <div className="fl-pm__photo">
          <img src={product.image_url} alt={product.name} />
        </div>

        <h2 className="fl-pm__name">{product.name}</h2>
        <div className="fl-pm__price">₱{Number(product.price).toLocaleString()}</div>

        {product.description && <p className="fl-pm__desc">{product.description}</p>}

        <div className="fl-pm__qty">
          <div className="fl-pm__qty-label">Choose quantity</div>
          <QuantitySelector
            quantity={quantity}
            onChange={setQuantity}
            min={1}
            max={product.stock || 50}
          />
        </div>

        <div className="fl-pm__actions">
          <Button
            variant="accent"
            size="xl"
            onClick={handleAddToCart}
            icon={<ShoppingBag size={24} strokeWidth={2.5} />}
          >
            Add to cart · ₱{(product.price * quantity).toLocaleString()}
          </Button>
          <Button variant="navy" size="md" onClick={onClose} icon={<ArrowLeft size={20} />}>
            Back to products
          </Button>
        </div>
      </div>
    </div>
  );
};
