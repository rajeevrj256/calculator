import React from 'react';

/**
 * Minimal line icons, hand-drawn as SVG paths. No external image files, no
 * icon-library dependency, transparent background by construction — this is
 * the "sticker" problem solved without any background-removal step.
 */

type IconProps = {size?: number; color?: string; strokeWidth?: number};

const base = (size = 48, strokeWidth = 2.5) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const CheckIcon: React.FC<IconProps> = ({size, color = '#fff', strokeWidth}) => (
  <svg {...base(size, strokeWidth)} stroke={color}>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export const QuestionIcon: React.FC<IconProps> = ({size, color = '#fff', strokeWidth}) => (
  <svg {...base(size, strokeWidth)} stroke={color}>
    <path d="M9 9a3 3 0 1 1 4 2.83c-.9.34-1.5 1.2-1.5 2.17v.5" />
    <circle cx="12" cy="18" r="0.9" fill={color} stroke="none" />
  </svg>
);

export const BankIcon: React.FC<IconProps> = ({size, color = '#fff', strokeWidth}) => (
  <svg {...base(size, strokeWidth)} stroke={color}>
    <path d="M3 10l9-6 9 6" />
    <path d="M5 10v9M9.5 10v9M14.5 10v9M19 10v9" />
    <path d="M3 19h18" />
  </svg>
);

export const AppIcon: React.FC<IconProps> = ({size, color = '#fff', strokeWidth}) => (
  <svg {...base(size, strokeWidth)} stroke={color}>
    <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </svg>
);

export const ShieldIcon: React.FC<IconProps> = ({size, color = '#fff', strokeWidth}) => (
  <svg {...base(size, strokeWidth)} stroke={color}>
    <path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" />
    <path d="M9 12l2 2 4-4.5" />
  </svg>
);

export const CartIcon: React.FC<IconProps> = ({size, color = '#fff', strokeWidth}) => (
  <svg {...base(size, strokeWidth)} stroke={color}>
    <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" />
    <circle cx="9.5" cy="20.5" r="1.1" fill={color} stroke="none" />
    <circle cx="17" cy="20.5" r="1.1" fill={color} stroke="none" />
  </svg>
);

export const TrainIcon: React.FC<IconProps> = ({size, color = '#fff', strokeWidth}) => (
  <svg {...base(size, strokeWidth)} stroke={color}>
    <rect x="5" y="3" width="14" height="13" rx="3" />
    <path d="M5 11h14M9 16l-2.5 4M15 16l2.5 4" />
    <circle cx="9" cy="13" r="0.6" fill={color} stroke="none" />
    <circle cx="15" cy="13" r="0.6" fill={color} stroke="none" />
  </svg>
);

export const PhoneCallIcon: React.FC<IconProps> = ({size, color = '#fff', strokeWidth}) => (
  <svg {...base(size, strokeWidth)} stroke={color}>
    <path d="M5.5 4h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5v3c0 1.1-.9 2-2 2C10.5 20.5 3.5 13.5 3.5 6c0-1.1.9-2 2-2z" />
  </svg>
);

export const FuelIcon: React.FC<IconProps> = ({size, color = '#fff', strokeWidth}) => (
  <svg {...base(size, strokeWidth)} stroke={color}>
    <rect x="4" y="4" width="10" height="16" rx="1.5" />
    <path d="M4 10h10" />
    <path d="M14 8l3 2v6.5a1.5 1.5 0 0 0 3 0V10l-2.5-2.5" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({size, color = '#fff', strokeWidth}) => (
  <svg {...base(size, strokeWidth)} stroke={color}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);
