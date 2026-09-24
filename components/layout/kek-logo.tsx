import React from 'react';
import Image from 'next/image';

interface KekLogoProps {
  className?: string;
  variant?: 'full' | 'mark' | 'white-box';
}

export function KekLogo({ className = "h-9 w-auto", variant = "full" }: KekLogoProps) {
  if (variant === 'white-box') {
    return (
      <div className="bg-white rounded-lg px-2 py-1 shadow-xs flex items-center justify-center shrink-0">
        <Image
          src="/logo-kek.png"
          alt="Logo Kawasan Ekonomi Khusus"
          width={80}
          height={28}
          className="h-7 w-auto object-contain"
          priority
        />
      </div>
    );
  }

  if (variant === 'mark') {
    return (
      <div className="bg-white rounded-lg p-1 shadow-xs flex items-center justify-center shrink-0 w-9 h-9 overflow-hidden">
        <Image
          src="/logo-kek.png"
          alt="Logo Kawasan Ekonomi Khusus"
          width={32}
          height={32}
          className="h-6 w-auto object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <Image
      src="/logo-kek.png"
      alt="Logo Kawasan Ekonomi Khusus (Indonesia SEZ)"
      width={140}
      height={45}
      className={`object-contain ${className}`}
      priority
    />
  );
}
