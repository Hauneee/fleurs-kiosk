import React from 'react';
import { ButterflySvg } from './Decorations';

export const LoadingScreen = ({ message = 'Gathering fresh blossoms...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        minHeight: '350px'
      }}
    >
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <ButterflySvg style={{ width: '64px', height: '52px' }} className="animate-float" />
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.75rem',
          color: '#ffffff',
          fontWeight: 700,
          letterSpacing: '0.04em',
          marginBottom: '8px',
          textAlign: 'center'
        }}
      >
        FLEURS BY BLOSSOMS CRAFT
      </h3>

      <p style={{ color: '#93c5fd', fontSize: '1.1rem', fontWeight: 600 }}>
        {message}
      </p>
    </div>
  );
};
