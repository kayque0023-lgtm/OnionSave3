import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Particles — Porta do Magic UI particles para Vite/React puro.
 * Cria um efeito de partículas flutuantes que reagem ao mouse (opcional).
 */
export default function Particles({
  quantity = 100,
  staticity = 50,
  ease = 50,
  color = "#ffffff",
  refresh = false,
  className = "",
}) {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: 0, y: 0 });
  const canvasSize = useRef({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  const drawCircle = useCallback((circle, ctx, update = false) => {
    const { x, y, translateX, translateY, size, alpha } = circle;
    ctx.translate(translateX, translateY);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(${hexToRgb(color)}, ${alpha})`;
    ctx.fill();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!update) {
      return;
    }
  }, [color, dpr]);

  const hexToRgb = (hex) => {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  const circleParams = useCallback(() => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const translateX = 0;
    const translateY = 0;
    const size = Math.floor(Math.random() * 2) + 0.1;
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
    const dx = (Math.random() - 0.5) * 0.2;
    const dy = (Math.random() - 0.5) * 0.2;
    const magnetism = 0.1 + Math.random() * 4;
    return { x, y, translateX, translateY, size, alpha, targetAlpha, dx, dy, magnetism };
  }, []);

  const resizeCanvas = useCallback(() => {
    if (canvasContainerRef.current && canvasRef.current) {
      particles.current = [];
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      const ctx = canvasRef.current.getContext('2d');
      ctx.scale(dpr, dpr);
    }
  }, [dpr]);

  const initParticles = useCallback(() => {
    particles.current = [];
    for (let i = 0; i < quantity; i++) {
      particles.current.push(circleParams());
    }
  }, [quantity, circleParams]);

  const animate = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
      particles.current.forEach((circle, i) => {
        // Handle alpha
        const edge = [
          circle.x + circle.translateX - circle.size,
          canvasSize.current.w - circle.x - circle.translateX - circle.size,
          circle.y + circle.translateY - circle.size,
          canvasSize.current.h - circle.y - circle.translateY - circle.size,
        ];
        const closestEdge = Math.min(...edge);
        const remapClosestEdge = parseFloat(remapValue(closestEdge, 0, 20, 0, 1).toFixed(2));
        if (remapClosestEdge > 1) {
          circle.alpha += 0.02;
          if (circle.alpha > circle.targetAlpha) circle.alpha = circle.targetAlpha;
        } else {
          circle.alpha = circle.targetAlpha * remapClosestEdge;
        }

        circle.x += circle.dx;
        circle.y += circle.dy;
        circle.translateX += (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) / ease;
        circle.translateY += (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) / ease;

        if (circle.x < -circle.size || circle.x > canvasSize.current.w + circle.size || circle.y < -circle.size || circle.y > canvasSize.current.h + circle.size) {
          particles.current[i] = circleParams();
        }
        drawCircle(circle, ctx, true);
      });
      requestAnimationFrame(animate);
    }
  }, [ease, staticity, circleParams, drawCircle]);

  const remapValue = (value, start1, stop1, start2, stop2) => {
    return (value - start1) * (stop2 - start2) / (stop1 - start1) + start2;
  };

  useEffect(() => {
    if (canvasRef.current) {
      resizeCanvas();
      initParticles();
      animate();
    }
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas, initParticles, animate]);

  useEffect(() => {
    if (refresh) {
      initParticles();
    }
  }, [refresh, initParticles]);

  const onMouseMove = (e) => {
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const { clientX, clientY } = e;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      mouse.current.x = x - canvasSize.current.w / 2;
      mouse.current.y = y - canvasSize.current.h / 2;
    }
  };

  return (
    <div
      ref={canvasContainerRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      onMouseMove={onMouseMove}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
