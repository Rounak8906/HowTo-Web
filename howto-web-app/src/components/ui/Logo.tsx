'use client';

import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'svg' | 'image';
}

export default function Logo({
  size = 36,
  className = '',
  style = {},
  variant = 'svg',
}: LogoProps) {
  if (variant === 'image') {
    return (
      <img
        src="/logo.png"
        alt="HowTo-Web Logo"
        width={size}
        height={size}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.2),
          objectFit: 'cover',
          ...style,
        }}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#18191e" />
          <stop offset="100%" stopColor="#0f1013" />
        </linearGradient>
        <linearGradient id="logoHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b49aff" />
          <stop offset="100%" stopColor="#9370f5" />
        </linearGradient>
      </defs>

      {/* Dark rounded base squircle */}
      <rect width="512" height="512" rx="100" fill="url(#logoBgGrad)" />

      {/* Outer Hexagon */}
      <polygon
        points="256,54 430,154.5 430,357.5 256,458 82,357.5 82,154.5"
        fill="none"
        stroke="url(#logoHexGrad)"
        strokeWidth="36"
        strokeLinejoin="round"
      />

      {/* Top Isometric Slide */}
      <polygon
        points="256,168 372,235 256,302 140,235"
        fill="#16171b"
        stroke="#edece8"
        strokeWidth="14"
        strokeLinejoin="round"
      />

      {/* Play Triangle */}
      <polygon points="244,214 278,235 244,256" fill="#edece8" />

      {/* Middle Isometric Slide Chevron */}
      <polyline
        points="140,274 256,341 372,274"
        fill="none"
        stroke="#edece8"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom Isometric Slide Chevron */}
      <polyline
        points="140,313 256,380 372,313"
        fill="none"
        stroke="#edece8"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
