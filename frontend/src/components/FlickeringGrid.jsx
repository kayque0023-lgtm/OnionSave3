import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * FlickeringGrid — Porta do Magic UI flickering-grid para Vite/React puro.
 * Desenha uma grade de quadrados que piscam aleatoriamente.
 */
export default function FlickeringGrid({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.1,
  color = "rgb(107, 114, 128)",
  maxOpacity = 0.3,
  className = "",
}) {
  const canvasRef = useRef(null);
  const [isInView, setIsInView] = useState(true);

  const memoizedColor = useCallback(() => {
    if (color.startsWith("rgb")) return color;
    // Simple hex to rgb conversion if needed
    return color; 
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const cols = Math.ceil(canvas.offsetWidth / (squareSize + gridGap));
    const rows = Math.ceil(canvas.offsetHeight / (squareSize + gridGap));
    const squares = new Float32Array(cols * rows);

    // Initialize random opacities
    for (let i = 0; i < squares.length; i++) {
      squares[i] = Math.random() * maxOpacity;
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const index = i * rows + j;
          
          // Randomly flicker
          if (Math.random() < flickerChance) {
            squares[index] = Math.random() * maxOpacity;
          }

          ctx.fillStyle = memoizedColor();
          ctx.globalAlpha = squares[index];
          ctx.fillRect(
            i * (squareSize + gridGap),
            j * (squareSize + gridGap),
            squareSize,
            squareSize
          );
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [squareSize, gridGap, flickerChance, memoizedColor, maxOpacity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        ... (className.includes('absolute') ? {} : { position: 'absolute' })
      }}
    />
  );
}
