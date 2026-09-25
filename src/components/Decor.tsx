import React from 'react';

export const CURVE = 'M0,96 C240,40 480,40 720,96 C960,150 1200,150 1440,96';
export const WAVE_TOP_FILL = `${CURVE} L1440,0 L0,0 Z`;
export const WAVE_BOTTOM_FILL = `${CURVE} L1440,190 L0,190 Z`;

export const TopoPattern: React.FC = () => (
  <svg
    className="absolute inset-0 h-full w-full opacity-[0.12]"
    viewBox="0 0 400 500"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
  >
    <g stroke="#FFFFFF" strokeWidth="1.2">
      <g className="topo-anim">
        <path d="M70 90c40-35 110-30 145 10s25 105-25 125-120 5-145-40 5-60 25-95Z" />
        <path d="M85 105c32-27 88-23 116 9s20 84-20 100-96 4-116-32 4-49 20-77Z" />
        <path d="M100 120c24-20 66-17 87 7s15 63-15 75-72 3-87-24 3-37 15-58Z" />
      </g>
      <g className="topo-anim-rev">
        <path d="M300 300c35-30 95-25 125 8s20 90-22 107-103 4-124-34 6-51 21-81Z" />
        <path d="M315 315c27-23 74-19 97 7s16 70-17 83-80 3-96-27 5-40 16-63Z" />
      </g>
      <g className="topo-anim-slow">
        <path d="M40 330c25-22 70-18 92 6s15 66-16 78-76 3-91-25 5-37 15-59Z" />
      </g>
      <g className="topo-anim-rev-slow">
        <path d="M250 60c20-18 55-15 73 5s12 52-13 62-60 2-72-20 4-29 12-47Z" />
      </g>
    </g>
  </svg>
);
