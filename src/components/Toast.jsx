import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

export const Toast = ({ message, isVisible, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible || !message) return null;

  return (
    <div className="kiosk-toast" role="status" aria-live="polite">
      <CheckCircle2 size={28} color="#34d399" />
      <span>{message}</span>
    </div>
  );
};
