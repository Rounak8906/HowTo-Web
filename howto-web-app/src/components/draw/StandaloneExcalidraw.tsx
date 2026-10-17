'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import '@excalidraw/excalidraw/index.css';

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
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: 15,
          fontWeight: 500,
          gap: 12,
        }}
      >
        <div className="animate-spin" style={{ fontSize: 24 }}>✏️</div>
        <span>Initializing Excalidraw Canvas...</span>
      </div>
    ),
  }
);

interface StandaloneExcalidrawProps {
  theme?: 'dark' | 'light';
}

export default function StandaloneExcalidraw({ theme = 'dark' }: StandaloneExcalidrawProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Excalidraw
        theme={theme}
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: true,
            export: { saveFileToDisk: true },
            toggleTheme: true,
          },
        }}
      />
    </div>
  );
}
