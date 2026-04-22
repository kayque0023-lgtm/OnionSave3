import React from 'react';

/**
 * LightRays — Porta do Magic UI light-rays para Vite/React puro.
 * Cria feixes de luz suaves que brilham do topo.
 */
export default function LightRays({ 
  className = "", 
  color = "rgba(0, 128, 128, 0.15)" 
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      className={className}
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMin slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          opacity: 0.9,
          filter: 'blur(60px)',
        }}
      >
        <g style={{ transformOrigin: '720px 0px' }}>
          {/* Ray 1 */}
          <path
            d="M720 0L1000 900H440L720 0Z"
            fill="url(#ray-grad-1)"
            style={{ animation: 'ray-float 7s ease-in-out infinite' }}
          />
          {/* Ray 2 */}
          <path
            d="M720 0L1300 900H800L720 0Z"
            fill="url(#ray-grad-2)"
            style={{ animation: 'ray-float 10s ease-in-out infinite reverse', animationDelay: '-2s' }}
          />
          {/* Ray 3 */}
          <path
            d="M720 0L640 900H140L720 0Z"
            fill="url(#ray-grad-3)"
            style={{ animation: 'ray-float 12s ease-in-out infinite', animationDelay: '-5s' }}
          />
        </g>
        <defs>
          <linearGradient id="ray-grad-1" x1="720" y1="0" x2="720" y2="900" gradientUnits="userSpaceOnUse">
            <stop stopColor={color} stopOpacity="0.4" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ray-grad-2" x1="720" y1="0" x2="720" y2="900" gradientUnits="userSpaceOnUse">
            <stop stopColor={color} stopOpacity="0.25" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ray-grad-3" x1="720" y1="0" x2="720" y2="900" gradientUnits="userSpaceOnUse">
            <stop stopColor={color} stopOpacity="0.35" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
