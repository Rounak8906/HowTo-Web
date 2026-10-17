'use client';

import React, { useEffect, useRef } from 'react';

interface SearchRadarBackgroundProps {
  className?: string;
}

export default function SearchRadarBackground({ className }: SearchRadarBackgroundProps) {
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

    // Network / Constellation Nodes for Discovery
    const nodeCount = 38;
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      baseAlpha: number;
    }> = [];

    const colors = ['#ffffff', '#e2e8f0', '#94a3b8', '#38bdf8', '#818cf8'];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: 1.2 + Math.random() * 1.8,
        color: colors[i % colors.length],
        baseAlpha: 0.3 + Math.random() * 0.4,
      });
    }

    let radarAngle = 0;
    let pingRadius = 0;

    const render = () => {
      radarAngle += 0.008;
      pingRadius = (pingRadius + 0.8) % (width * 0.6);

      // True deep black base
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const radarCenterX = width * 0.5;
      const radarCenterY = height * 0.32;

      // Soft deep atmospheric center halo
      const ambientGlow = ctx.createRadialGradient(
        radarCenterX,
        radarCenterY,
        10,
        radarCenterX,
        radarCenterY,
        width * 0.65
      );
      ambientGlow.addColorStop(0, 'rgba(25, 25, 42, 0.35)');
      ambientGlow.addColorStop(0.45, 'rgba(10, 12, 20, 0.15)');
      ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);

      // ─── Subtle Concentric Discovery Rings ───
      ctx.save();
      const ringDistances = [120, 240, 380, 540, 720];
      for (let r of ringDistances) {
        ctx.beginPath();
        ctx.arc(radarCenterX, radarCenterY, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.038)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 12]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Expanding Radar Pulse Ring
      const pingAlpha = Math.max(0, 0.12 * (1 - pingRadius / (width * 0.6)));
      ctx.beginPath();
      ctx.arc(radarCenterX, radarCenterY, pingRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(186, 230, 253, ${pingAlpha.toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Soft Rotary Sweep Beam
      const sweepLength = width * 0.55;
      const sweepGrad = ctx.createRadialGradient(
        radarCenterX,
        radarCenterY,
        10,
        radarCenterX,
        radarCenterY,
        sweepLength
      );
      sweepGrad.addColorStop(0, 'rgba(129, 140, 248, 0.06)');
      sweepGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.025)');
      sweepGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.moveTo(radarCenterX, radarCenterY);
      ctx.arc(radarCenterX, radarCenterY, sweepLength, radarAngle, radarAngle + 0.35);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // ─── Connected Constellation Nodes ───
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        // Bounce boundaries
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Draw connections between nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 115) {
            const lineAlpha = (1 - dist / 115) * 0.14;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(165, 180, 252, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = node.baseAlpha;
        ctx.fill();
        ctx.globalAlpha = 1;
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
