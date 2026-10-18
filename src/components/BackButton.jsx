import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const BackButton = ({ onClick, label = 'BACK' }) => {
  return (
    <button
      onClick={onClick}
      className="kiosk-btn"
      style={{
        background: 'rgba(255, 255, 255, 0.12)',
        color: '#ffffff',
        border: '2px dashed #93c5fd',
        padding: 'clamp(6px, 2vw, 12px) clamp(10px, 3.2vw, 24px)',
        fontSize: 'clamp(0.8rem, 3.2vw, 1.15rem)',
        borderRadius: '9999px',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(6px)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'clamp(4px, 1.5vw, 8px)',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
      aria-label="Go back"
    >
      <ArrowLeft size={20} strokeWidth={2.5} />
      <span>{label}</span>
    </button>
  );
};