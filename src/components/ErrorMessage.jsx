import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const ErrorMessage = ({
  message = 'Unable to connect to the server. Please check the connection and try again.',
  onRetry = null,
  actionLabel = 'TRY AGAIN'
}) => {
  return (
    <div
      style={{
        background: 'rgba(239, 68, 68, 0.12)',
        border: '2px dashed #f87171',
        borderRadius: '24px',
        padding: '32px 24px',
        maxWidth: '560px',
        margin: '30px auto',
        textAlign: 'center',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.2)',
          color: '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}
      >
        <AlertTriangle size={36} />
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.6rem',
          color: '#ffffff',
          fontWeight: 700,
          marginBottom: '10px'
        }}
      >
        Notice
      </h3>

      <p
        style={{
          fontSize: '1.15rem',
          color: '#fecaca',
          lineHeight: 1.5,
          marginBottom: onRetry ? '24px' : '0',
          fontWeight: 600
        }}
      >
        {message}
      </p>

      {onRetry && (
        <Button
          variant="primary"
          size="md"
          onClick={onRetry}
          icon={<RefreshCw size={20} />}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
