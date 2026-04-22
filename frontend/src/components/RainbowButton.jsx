import React from 'react';

/**
 * RainbowButton — porta do Magic UI rainbow-button para Vite/React puro.
 * Pode ser usado como componente ou via CSS class .btn-primary (já estilizado globalmente).
 */
export function RainbowButton({ children, className = '', style = {}, ...props }) {
  return (
    <button
      className={`rainbow-btn ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}

export default RainbowButton;
