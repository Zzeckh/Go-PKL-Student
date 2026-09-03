import React from 'react';

interface LogoProps {
  className?: string;
  /** true = lagi di background navy/dark → logo navy diputihkan via filter */
  onDark?: boolean;
}
export const Logo: React.FC<LogoProps> = ({
  className = 'w-11 h-11',
  onDark = false,
}) => (
  <img
    src="/image.png"
    alt="Go-PKL"
    className={`${className} object-contain select-none ${
      onDark ? '[filter:brightness(0)_invert(1)]' : ''
    }`}
    draggable={false}
  />
);