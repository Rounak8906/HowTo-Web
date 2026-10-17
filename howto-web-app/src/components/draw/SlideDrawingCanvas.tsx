'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Undo2, Trash2, Check, X, Sparkles } from 'lucide-react';
import styles from './slideDrawingCanvas.module.css';

interface StrokePoint {
  x: number;
  y: number;
}

interface Stroke {
  tool: 'pen' | 'highlighter' | 'marker' | 'eraser';
  color: string;
  size: number;
  points: StrokePoint[];
}

interface SlideDrawingCanvasProps {
  isActive?: boolean;
  tool?: 'pen' | 'highlighter' | 'marker' | 'eraser';
  activeTool?: 'pen' | 'highlighter' | 'marker' | 'eraser';
  color?: string;
  size?: number;
  onSaveStroke?: (
    svgString: string,
    bounds: { x: number; y: number; width: number; height: number }
  ) => void;
  onSaveDrawing?: (svgString: string) => void;
  onClose: () => void;
}

export default function SlideDrawingCanvas({
  isActive = true,
  tool,
  activeTool = 'pen',
  color = '#4f46e5',
  size = 3,
  onSaveStroke,
  onSaveDrawing,
  onClose,
}: SlideDrawingCanvasProps) {
  const currentTool = tool || activeTool;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentPointsRef = useRef<StrokePoint[]>([]);

  // Redraw canvas whenever strokes change or canvas resizes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;

      ctx.save();
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 3.5;
      } else if (stroke.tool === 'marker') {
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 2;
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.size * 4;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
      }

      ctx.moveTo(
        (stroke.points[0].x / 100) * canvas.width,
        (stroke.points[0].y / 100) * canvas.height
      );

      for (let i = 1; i < stroke.points.length; i++) {
        const xc =
          ((stroke.points[i - 1].x + stroke.points[i].x) / 2 / 100) *
          canvas.width;
        const yc =
          ((stroke.points[i - 1].y + stroke.points[i].y) / 2 / 100) *
          canvas.height;
        ctx.quadraticCurveTo(
          (stroke.points[i - 1].x / 100) * canvas.width,
          (stroke.points[i - 1].y / 100) * canvas.height,
          xc,
          yc
        );
      }

      const lastPoint = stroke.points[stroke.points.length - 1];
      ctx.lineTo(
        (lastPoint.x / 100) * canvas.width,
        (lastPoint.y / 100) * canvas.height
      );

      ctx.stroke();
      ctx.restore();
    }
  }, [strokes]);

  // Handle Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        redrawCanvas();
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [redrawCanvas]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    currentPointsRef.current = [{ x, y }];
    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    currentPointsRef.current.push({ x, y });

    // Draw active stroke live
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pts = currentPointsRef.current;
    if (pts.length < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'highlighter') {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 3.5;
    } else if (currentTool === 'marker') {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 2;
    } else if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = size * 4;
    } else {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
    }

    const prev = pts[pts.length - 2];
    const curr = pts[pts.length - 1];
    ctx.moveTo((prev.x / 100) * canvas.width, (prev.y / 100) * canvas.height);
    ctx.lineTo((curr.x / 100) * canvas.width, (curr.y / 100) * canvas.height);
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPointsRef.current.length > 1) {
      const newStroke: Stroke = {
        tool: currentTool,
        color,
        size,
        points: [...currentPointsRef.current],
      };
      setStrokes((prev) => [...prev, newStroke]);
    }
    currentPointsRef.current = [];
  };

  // Convert current strokes to SVG string and notify parent
  const handleSaveToSlide = () => {
    if (strokes.length === 0) {
      onClose();
      return;
    }

    // Find bounding box across all strokes
    let minX = 100;
    let minY = 100;
    let maxX = 0;
    let maxY = 0;

    for (const stroke of strokes) {
      for (const pt of stroke.points) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
    }

    // Add padding around strokes
    const pad = 2;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(100, maxX + pad);
    maxY = Math.min(100, maxY + pad);

    const width = Math.max(8, maxX - minX);
    const height = Math.max(6, maxY - minY);

    // Build SVG paths normalized to 0..width and 0..height
    const svgPaths = strokes
      .filter((s) => s.tool !== 'eraser' && s.points.length >= 2)
      .map((s) => {
        const opacity = s.tool === 'highlighter' ? 0.4 : s.tool === 'marker' ? 0.85 : 1.0;
        const sw = s.tool === 'highlighter' ? s.size * 3.5 : s.tool === 'marker' ? s.size * 2 : s.size;

        const pathData = s.points.reduce((acc, pt, idx) => {
          // Normalize to bounding box coordinate space (0..1000)
          const px = ((pt.x - minX) / width) * 1000;
          const py = ((pt.y - minY) / height) * 1000;
          return idx === 0 ? `M ${px.toFixed(1)} ${py.toFixed(1)}` : `${acc} L ${px.toFixed(1)} ${py.toFixed(1)}`;
        }, '');

        return `<path d="${pathData}" stroke="${s.color}" stroke-width="${sw * 8}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" fill="none" />`;
      })
      .join('\n');

    const svgContent = `<svg viewBox="0 0 1000 1000" preserveAspectRatio="none" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible;">${svgPaths}</svg>`;

    onSaveDrawing?.(svgContent);
    onSaveStroke?.(svgContent, {
      x: Math.round(minX),
      y: Math.round(minY),
      width: Math.round(width),
      height: Math.round(height),
    });

    setStrokes([]);
  };

  if (!isActive) return null;

  return (
    <div className={styles.drawingOverlay}>
      <canvas
        ref={canvasRef}
        className={styles.drawingCanvas}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Floating Canvas Action Bar */}
      <div className={styles.drawingActionBar}>
        <div className={styles.actionInfo}>
          <Sparkles size={14} color="#6366f1" />
          <span>Draw Mode Active: Sketch on Slide</span>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={styles.actionBtn}
            onClick={() => setStrokes((prev) => prev.slice(0, -1))}
            disabled={strokes.length === 0}
            title="Undo Last Stroke"
          >
            <Undo2 size={13} />
            <span>Undo</span>
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => setStrokes([])}
            disabled={strokes.length === 0}
            title="Clear Drawing Canvas"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={handleSaveToSlide}
            title="Commit Drawing to Slide"
          >
            <Check size={14} />
            <span>Save to Slide</span>
          </button>
          <button
            className={styles.actionBtn}
            onClick={onClose}
            title="Cancel Draw Mode"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
