import React from 'react';

export const ButterflySvg = ({ className = '', style = {} }) => (
  <svg
    viewBox="0 0 100 80"
    className={className}
    style={{ width: '48px', height: '38px', ...style }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Left Forewing */}
    <path
      d="M48 42 C15 5 2 20 12 50 C22 70 44 54 48 44 Z"
      fill="#93c5fd"
      stroke="#60a5fa"
      strokeWidth="2.5"
    />
    <path
      d="M48 46 C28 50 18 68 34 76 C44 79 48 60 48 46 Z"
      fill="#bfdbfe"
      stroke="#60a5fa"
      strokeWidth="2"
    />
    {/* Right Forewing */}
    <path
      d="M52 42 C85 5 98 20 88 50 C78 70 56 54 52 44 Z"
      fill="#93c5fd"
      stroke="#60a5fa"
      strokeWidth="2.5"
    />
    <path
      d="M52 46 C72 50 82 68 66 76 C56 79 52 60 52 46 Z"
      fill="#bfdbfe"
      stroke="#60a5fa"
      strokeWidth="2"
    />
    {/* Body */}
    <ellipse cx="50" cy="45" rx="3" ry="18" fill="#1e3a8a" />
    <circle cx="50" cy="27" r="4" fill="#1e3a8a" />
    {/* Antennae */}
    <path d="M49 26 Q 42 14 36 12" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
    <path d="M51 26 Q 58 14 64 12" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const BowSvg = ({ className = '', style = {} }) => (
  <svg
    viewBox="0 0 100 60"
    className={className}
    style={{ width: '56px', height: '34px', ...style }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Tails */}
    <path d="M45 35 Q 25 55 10 58 Q 20 40 40 32 Z" fill="#2563eb" />
    <path d="M55 35 Q 75 55 90 58 Q 80 40 60 32 Z" fill="#2563eb" />
    {/* Loops */}
    <ellipse
      cx="30"
      cy="24"
      rx="24"
      ry="14"
      transform="rotate(-18 30 24)"
      fill="#60a5fa"
      stroke="#bfdbfe"
      strokeWidth="2"
    />
    <ellipse
      cx="70"
      cy="24"
      rx="24"
      ry="14"
      transform="rotate(18 70 24)"
      fill="#60a5fa"
      stroke="#bfdbfe"
      strokeWidth="2"
    />
    {/* Center Knot */}
    <circle cx="50" cy="26" r="10" fill="#1d4ed8" stroke="#bfdbfe" strokeWidth="2" />
  </svg>
);

export const FloralCorner = ({ position = 'top-left' }) => {
  const isRight = position.includes('right');
  const isBottom = position.includes('bottom');

  return (
    <div
      style={{
        position: 'absolute',
        top: isBottom ? 'auto' : '12px',
        bottom: isBottom ? '12px' : 'auto',
        left: isRight ? 'auto' : '12px',
        right: isRight ? '12px' : 'auto',
        transform: `scale(${isRight ? -1 : 1}, ${isBottom ? -1 : 1})`,
        pointerEvents: 'none',
        opacity: 0.6,
        zIndex: 1
      }}
    >
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
        <path
          d="M10 90 Q 20 40 70 20 Q 90 15 95 10"
          stroke="#93c5fd"
          strokeWidth="3"
          strokeDasharray="6,4"
        />
        <circle cx="70" cy="20" r="10" fill="#60a5fa" opacity="0.8" />
        <circle cx="45" cy="45" r="8" fill="#93c5fd" opacity="0.7" />
        <circle cx="20" cy="70" r="7" fill="#bfdbfe" opacity="0.6" />
        <path d="M70 20 Q 60 5 75 0 Q 80 15 70 20" fill="#3b82f6" />
        <path d="M45 45 Q 35 30 50 25 Q 55 40 45 45" fill="#3b82f6" />
      </svg>
    </div>
  );
};
