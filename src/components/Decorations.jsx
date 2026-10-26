
import React from 'react';

const COLORS = {
  pink: '#E879A5',
  lightPink: '#F8C9DA',
  blush: '#FCE7EF',
  darkPink: '#C2255C',
  wine: '#9C1A47',
  white: '#FFFFFF',
  leaf: '#A7C9A0',
  lightLeaf: '#D5E6CE',
};

export const ButterflySvg = ({ className = '', style = {} }) => (
  <svg
    viewBox="0 0 100 80"
    className={className}
    style={{ width: '48px', height: '38px', ...style }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M48 42 C15 5 2 20 12 50 C22 70 44 54 48 44 Z"
      fill={COLORS.lightPink}
      stroke={COLORS.darkPink}
      strokeWidth="2"
    />
    <path
      d="M48 46 C28 50 18 68 34 76 C44 79 48 60 48 46 Z"
      fill={COLORS.pink}
      stroke={COLORS.darkPink}
      strokeWidth="2"
    />
    <path
      d="M52 42 C85 5 98 20 88 50 C78 70 56 54 52 44 Z"
      fill={COLORS.lightPink}
      stroke={COLORS.darkPink}
      strokeWidth="2"
    />
    <path
      d="M52 46 C72 50 82 68 66 76 C56 79 52 60 52 46 Z"
      fill={COLORS.pink}
      stroke={COLORS.darkPink}
      strokeWidth="2"
    />
    <ellipse cx="50" cy="45" rx="3" ry="18" fill={COLORS.wine} />
    <circle cx="50" cy="27" r="4" fill={COLORS.wine} />
    <path
      d="M49 26 Q42 14 36 12 M51 26 Q58 14 64 12"
      stroke={COLORS.wine}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="28" cy="34" r="3" fill={COLORS.white} opacity=".8" />
    <circle cx="72" cy="34" r="3" fill={COLORS.white} opacity=".8" />
  </svg>
);

export const BowSvg = ({ className = '', style = {} }) => (
  <svg
    viewBox="0 0 100 60"
    className={className}
    style={{ width: '56px', height: '34px', ...style }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Pink ribbon bow"
  >
    {/* Ribbon tails */}
    <path
      d="M45 35 Q25 55 10 58 Q20 40 40 32 Z"
      fill={COLORS.pink}
      stroke={COLORS.darkPink}
      strokeWidth="1"
    />
    <path
      d="M55 35 Q75 55 90 58 Q80 40 60 32 Z"
      fill={COLORS.pink}
      stroke={COLORS.darkPink}
      strokeWidth="1"
    />

    {/* Ribbon loops */}
    <ellipse
      cx="30"
      cy="24"
      rx="24"
      ry="14"
      transform="rotate(-18 30 24)"
      fill={COLORS.lightPink}
      stroke={COLORS.darkPink}
      strokeWidth="2"
    />
    <ellipse
      cx="70"
      cy="24"
      rx="24"
      ry="14"
      transform="rotate(18 70 24)"
      fill={COLORS.pink}
      stroke={COLORS.darkPink}
      strokeWidth="2"
    />

    {/* Center knot */}
    <circle
      cx="50"
      cy="26"
      r="10"
      fill={COLORS.darkPink}
      stroke={COLORS.lightPink}
      strokeWidth="2"
    />
    <circle cx="47" cy="23" r="2" fill={COLORS.white} />
  </svg>
);

export const FloralCorner = ({ position = 'top-left' }) => {
  const isRight = position.includes('right');
  const isBottom = position.includes('bottom');

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: isBottom ? 'auto' : '12px',
        bottom: isBottom ? '12px' : 'auto',
        left: isRight ? 'auto' : '12px',
        right: isRight ? '12px' : 'auto',
        transform: `scale(${isRight ? -1 : 1}, ${isBottom ? -1 : 1})`,
        pointerEvents: 'none',
        opacity: 0.55,
        zIndex: 1,
      }}
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Curved floral stem */}
        <path
          d="M10 90 Q20 40 70 20 Q90 15 95 10"
          stroke={COLORS.pink}
          strokeWidth="3"
          strokeDasharray="6 4"
          strokeLinecap="round"
        />

        {/* Pink blossoms */}
        <circle cx="70" cy="20" r="10" fill={COLORS.pink} />
        <circle cx="45" cy="45" r="8" fill={COLORS.lightPink} />
        <circle cx="20" cy="70" r="7" fill={COLORS.blush} />

        {/* Green leaves */}
        <path
          d="M70 20 Q60 5 75 0 Q80 15 70 20"
          fill={COLORS.leaf}
        />
        <path
          d="M45 45 Q35 30 50 25 Q55 40 45 45"
          fill={COLORS.lightLeaf}
        />

        {/* Small floral centers */}
        <circle cx="70" cy="20" r="3" fill={COLORS.white} />
        <circle cx="45" cy="45" r="2.5" fill={COLORS.white} />
        <circle cx="20" cy="70" r="2" fill={COLORS.white} />
      </svg>
    </div>
  );
};
