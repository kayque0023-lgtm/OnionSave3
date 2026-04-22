import React from 'react';

const NUM_CIRCLES = 7;

export default function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = NUM_CIRCLES,
  color = 'var(--accent)',
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const baseOpacity = mainCircleOpacity - i * 0.03;
        const delay = `${i * 0.06}s`;
        const duration = '3.5s';

        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              border: `1px solid ${color}`,
              width: size,
              height: size,
              opacity: `calc(${Math.max(baseOpacity, 0)} * var(--ripple-opacity-multiplier, 1))`,
              animation: `ripple-expand ${duration} ease-out ${delay} infinite`,
              transform: 'scale(1)',
            }}
          />
        );
      })}
    </div>
  );
}
