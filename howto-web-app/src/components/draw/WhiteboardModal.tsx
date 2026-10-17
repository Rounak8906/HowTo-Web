'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import '@excalidraw/excalidraw/index.css';
import { Camera, X, Download, FolderPlus, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Dynamically import Excalidraw without SSR
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090d16',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: 16,
          fontWeight: 500,
          gap: 12,
        }}
      >
        <RefreshCw className="animate-spin" size={24} style={{ color: '#6366f1' }} />
        <span>Loading Whiteboard Studio...</span>
      </div>
    ),
  }
);

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportToSlide: (imageDataUrl: string) => void;
  onSaveAsResource?: (imageDataUrl: string) => void;
  theme?: 'dark' | 'light';
  slideNumber: number;
}

export default function WhiteboardModal({
  isOpen,
  onClose,
  onExportToSlide,
  onSaveAsResource,
  theme = 'dark',
  slideNumber,
}: WhiteboardModalProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExportToSlide = async () => {
    if (!excalidrawAPI) {
      toast.error('Whiteboard is still initializing.');
      return;
    }

    const elements = excalidrawAPI.getSceneElements();
    if (!elements || elements.length === 0) {
      toast.error('The whiteboard is empty. Draw something before exporting to slide!');
      return;
    }

    setIsExporting(true);
    try {
      const { exportToBlob } = await import('@excalidraw/excalidraw');
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      const blob = await exportToBlob({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: theme === 'dark',
          exportBackground: true,
          viewBackgroundColor: theme === 'dark' ? '#0b0f19' : '#ffffff',
        },
        files,
        mimeType: 'image/png',
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onExportToSlide(dataUrl);
        toast.success(`Whiteboard drawing captured & exported to Slide ${slideNumber}! 🎨`);
        setIsExporting(false);
        onClose();
      };
      reader.onerror = () => {
        toast.error('Failed to read whiteboard image.');
        setIsExporting(false);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      console.error('Whiteboard export error:', err);
      toast.error(err?.message || 'Failed to capture whiteboard image.');
      setIsExporting(false);
    }
  };

  const handleSaveToResources = async () => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    if (!elements || elements.length === 0) {
      toast.error('Whiteboard is empty.');
      return;
    }

    try {
      const { exportToBlob } = await import('@excalidraw/excalidraw');
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      const blob = await exportToBlob({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: theme === 'dark',
          exportBackground: true,
        },
        files,
        mimeType: 'image/png',
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        if (onSaveAsResource) {
          onSaveAsResource(dataUrl);
          toast.success(`Saved drawing to Slide ${slideNumber} Resources! 📁`);
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      toast.error('Failed to save to resources.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Action Bar */}
      <div
        style={{
          height: 60,
          background: '#090d16',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            ✏️
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Whiteboard Studio</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                }}
              >
                Target: Slide {slideNumber}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
              Draw shapes, sketches, or mind maps, then capture directly into your slide deck
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleSaveToResources}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#cbd5e1',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Attach snapshot to Slide Resources without inserting onto slide canvas"
          >
            <FolderPlus size={15} style={{ color: '#38bdf8' }} />
            <span>Save to Resources</span>
          </button>

          <button
            type="button"
            onClick={handleExportToSlide}
            disabled={isExporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #38bdf8 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 700,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            <Camera size={16} />
            <span>{isExporting ? 'Capturing...' : '📸 Export to Slide (PPT)'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginLeft: 6,
            }}
            title="Close Whiteboard (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div style={{ flex: 1, width: '100%', height: 'calc(100% - 60px)', position: 'relative' }}>
        <Excalidraw
          theme={theme}
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
              export: { saveFileToDisk: true },
              toggleTheme: true,
            },
          }}
        />
      </div>
    </div>
  );
}
