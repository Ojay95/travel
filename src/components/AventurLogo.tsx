"use client";

import React from 'react';

interface AventurLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  light?: boolean;
  onlyIcon?: boolean;
}

export default function AventurLogo({ 
  className = "", 
  size = 'md', 
  showTagline = true, 
  light = false,
  onlyIcon = false
}: AventurLogoProps) {
  // Dimensions based on size prop
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
  const textClass = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-3xl';
  const taglineClass = size === 'sm' ? 'text-[7px] tracking-[0.18em]' : size === 'lg' ? 'text-[11px] tracking-[0.25em]' : 'text-[9px] tracking-[0.22em]';

  const svgIcon = (
    <svg 
      viewBox="0 0 100 100" 
      className={`${iconSize} flex-shrink-0 drop-shadow-sm`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rounded square icon container with gradient matching user logo */}
      <rect width="100" height="100" rx="28" fill="url(#logo-grad-blue)" />
      
      {/* Mountain outline inside at the bottom left */}
      <path 
        d="M 28 66 L 38 52 L 48 64 L 54 56 L 63 66" 
        stroke="white" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M 33 66 L 38 59 L 43 66" 
        stroke="white" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        opacity="0.75"
      />

      {/* Airplane flight path route overlay */}
      <path 
        d="M 22 66 C 12 55 18 36 32 30 C 46 24 60 28 66 38 C 72 47 62 60 48 62 C 34 64 26 58 26 58" 
        stroke="white" 
        strokeWidth="4.5" 
        strokeLinecap="round" 
        fill="none"
      />

      {/* Airplane vector silhouette at top right */}
      <path 
        d="M 64.5 35 L 75 25.5 L 77.5 27.5 L 74 32.5 L 81.5 35.5 L 80 38.5 L 73.5 36.5 L 69.5 42 Z" 
        fill="white" 
        stroke="white"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      <defs>
        <linearGradient id="logo-grad-blue" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f52ba" />
          <stop offset="60%" stopColor="#1e60f2" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );

  if (onlyIcon) {
    return svgIcon;
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <img 
        src="/aventtur_logo_no_bg.png" 
        alt="Aventur Logo" 
        className={`h-auto object-contain select-none ${
          size === 'sm' ? 'max-h-9 md:max-h-10' : size === 'lg' ? 'max-h-18 md:max-h-20' : 'max-h-12 md:max-h-14'
        } ${light ? 'bg-white/95 py-1 px-2.5 rounded-xl shadow-xs border border-white/10' : ''}`}
      />
    </div>
  );
}
