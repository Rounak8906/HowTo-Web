'use client';

import React, { useEffect, useRef } from 'react';

interface TechGridBackgroundProps {
  className?: string;
}

export default function TechGridBackground({ className }: TechGridBackgroundProps) {
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

    // Techy Data Pulses moving along grid lines
    const pulses: Array<{
      x: number;
      y: number;
      length: number;
      speed: number;
      dir: 'x' | 'y';
      color: string;
      alpha: number;
    }> = [];

    const gridSize = 48; // Spacing of the tech grid

    for (let i = 0; i < 7; i++) {
      pulses.push({
        x: Math.floor((Math.random() * width) / gridSize) * gridSize,
        y: Math.floor((Math.random() * height) / gridSize) * gridSize,
        length: 40 + Math.random() * 60,
        speed: 1.2 + Math.random() * 1.5,
        dir: Math.random() > 0.5 ? 'x' : 'y',
        color: i % 2 === 0 ? 'rgba(99, 102, 241, ' : 'rgba(56, 189, 248, ',
        alpha: 0.25 + Math.random() * 0.35,
      });
    }

    const render = () => {
      // True deep black tech base
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient dark charcoal halo to elevate center profile area
      const radial = ctx.createRadialGradient(
        width * 0.5,
        height * 0.28,
        30,
        width * 0.5,
        height * 0.35,
        width * 0.65
      );
      radial.addColorStop(0, 'rgba(28, 32, 45, 0.35)');
      radial.addColorStop(0.5, 'rgba(10, 12, 18, 0.15)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      // ─── Subtle Tech Grid Lines ───
      ctx.save();
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.032)';

      // Vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ─── Tech Grid Node Crosshairs (+) ───
      const crossSize = 3;
      ctx.lineWidth = 0.75;

      for (let x = gridSize; x < width; x += gridSize * 2) {
        for (let y = gridSize; y < height; y += gridSize * 2) {
          // Fade nodes towards screen edges
          const dx = (x - width / 2) / (width / 2);
          const dy = (y - height / 2) / (height / 2);
          const distSq = dx * dx + dy * dy;
          if (distSq > 1.3) continue;

          const nodeAlpha = Math.max(0, 0.09 - distSq * 0.045);
          ctx.strokeStyle = `rgba(226, 232, 240, ${nodeAlpha.toFixed(3)})`;

          ctx.beginPath();
          ctx.moveTo(x - crossSize, y);
          ctx.lineTo(x + crossSize, y);
          ctx.moveTo(x, y - crossSize);
          ctx.lineTo(x, y + crossSize);
          ctx.stroke();
        }
      }

      // ─── Gentle Moving Data Pulses along grid lines ───
      for (let i = 0; i < pulses.length; i++) {
        const p = pulses[i];

        ctx.beginPath();
        if (p.dir === 'x') {
          p.x += p.speed;
          if (p.x - p.length > width) {
            p.x = -p.length;
            p.y = Math.floor((Math.random() * height) / gridSize) * gridSize;
          }

          const grad = ctx.createLinearGradient(p.x - p.length, p.y, p.x, p.y);
          grad.addColorStop(0, `${p.color}0)`);
          grad.addColorStop(1, `${p.color}${p.alpha})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
          ctx.moveTo(p.x - p.length, p.y);
          ctx.lineTo(p.x, p.y);
        } else {
          p.y += p.speed;
          if (p.y - p.length > height) {
            p.y = -p.length;
            p.x = Math.floor((Math.random() * width) / gridSize) * gridSize;
          }

          const grad = ctx.createLinearGradient(p.x, p.y - p.length, p.x, p.y);
          grad.addColorStop(0, `${p.color}0)`);
          grad.addColorStop(1, `${p.color}${p.alpha})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
          ctx.moveTo(p.x, p.y - p.length);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        // Glowing pulse head point
        ctx.fillStyle = p.color === 'rgba(99, 102, 241, ' ? '#c7d2fe' : '#7dd3fc';
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
