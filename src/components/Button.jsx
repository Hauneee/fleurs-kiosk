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

  const getSizeStyle = () => {
    switch (size) {
      case 'xl':
        return { padding: '22px 42px', fontSize: '1.45rem', minHeight: '74px' };
      case 'lg':
        return { padding: '18px 34px', fontSize: '1.25rem', minHeight: '62px' };
      case 'md':
        return { padding: '14px 26px', fontSize: '1.05rem', minHeight: '52px' };
      default:
        return { padding: '18px 34px', fontSize: '1.25rem', minHeight: '62px' };
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
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
