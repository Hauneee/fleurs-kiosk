import React from 'react';

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'lg',
  className = '',
  disabled = false,
  icon = null,
  type = 'button'
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'kiosk-btn-primary';
      case 'navy':
        return 'kiosk-btn-navy';
      case 'accent':
        return 'kiosk-btn-accent';
      case 'outline':
        return 'kiosk-btn-outline';
      default:
        return 'kiosk-btn-primary';
    }
  };

  // Sizes scale with the screen width, so they fit any phone
  const getSizeStyle = () => {
    switch (size) {
      case 'xl':
        return {
          padding: 'clamp(12px, 3.4vw, 22px) clamp(16px, 5vw, 42px)',
          fontSize: 'clamp(0.95rem, 3.9vw, 1.45rem)',
          minHeight: 'clamp(48px, 12vw, 74px)'
        };
      case 'md':
        return {
          padding: 'clamp(8px, 2.4vw, 14px) clamp(12px, 3.6vw, 26px)',
          fontSize: 'clamp(0.85rem, 3.3vw, 1.05rem)',
          minHeight: 'clamp(40px, 9.5vw, 52px)'
        };
      case 'lg':
      default:
        return {
          padding: 'clamp(10px, 3vw, 18px) clamp(14px, 4.5vw, 34px)',
          fontSize: 'clamp(0.9rem, 3.7vw, 1.25rem)',
          minHeight: 'clamp(44px, 11vw, 62px)'
        };
    }
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`kiosk-btn ${getVariantClass()} ${className}`}
      style={{
        ...getSizeStyle(),
        maxWidth: '100%',
        lineHeight: 1.2,
        textAlign: 'center',
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {icon && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      )}
      <span style={{ minWidth: 0 }}>{children}</span>
    </button>
  );
};