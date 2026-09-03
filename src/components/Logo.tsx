import React from 'react';

interface LogoProps {
  className?: string;
  /** true = lagi di background navy/dark → logo navy diputihkan via filter */
  onDark?: boolean;
}
export const Logo: React.FC<LogoProps> = ({
  className = 'w-11 h-11',
}) => (
  <img
    src="/image.png"
    alt="Go-PKL"
    className={`${className} object-contain select-none`}
    draggable={false}
  />
);