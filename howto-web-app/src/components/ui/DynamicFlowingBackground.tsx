'use client';

import React, { useEffect, useRef } from 'react';

interface DynamicFlowingBackgroundProps {
  lineCount?: number;
  className?: string;
}

export default function DynamicFlowingBackground({
  lineCount = 28,
  className,
}: DynamicFlowingBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    let time = 0;

    const render = () => {
      time += 0.004;

      // Dark obsidian background fill
      ctx.fillStyle = '#0b0d12';
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient atmospheric glow
      const radialGlow = ctx.createRadialGradient(
        width * 0.25,
        height * 0.4,
        50,
        width * 0.3,
        height * 0.45,
        width * 0.65
      );
      radialGlow.addColorStop(0, 'rgba(30, 36, 52, 0.35)');
      radialGlow.addColorStop(0.6, 'rgba(15, 18, 26, 0.15)');
      radialGlow.addColorStop(1, 'rgba(11, 13, 18, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // Dynamic Flowing Curves (like the referenced executive tech wave image)
      ctx.save();
      for (let i = 0; i < lineCount; i++) {
        ctx.beginPath();
        const progress = i / lineCount;

        // Spread lines across diagonal slant
        const startX = -width * 0.1;
        const startY = height * 0.08 + i * 16;
        const endX = width * 1.1;
        const endY = height * 0.72 + i * 14;

        ctx.moveTo(startX, startY);

        // Calculate fluid undulating bezier control points
        const cp1x = width * 0.28;
        const cp1y =
          startY +
          Math.sin(time + i * 0.09) * 45 +
          Math.cos(time * 0.7 + i * 0.06) * 35;

        const cp2x = width * 0.68;
        const cp2y =
          endY -
          Math.cos(time * 0.85 + i * 0.08) * 55 -
          Math.sin(time * 1.1 + i * 0.05) * 40;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);

        // Translucent gradient stroke for depth
        const alpha = Math.sin(progress * Math.PI) * 0.18 + 0.04;
        ctx.strokeStyle = `rgba(220, 228, 245, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [lineCount]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
