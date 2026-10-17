'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import '@excalidraw/excalidraw/index.css';

export interface InSlideExcalidrawProps {
  initialData?: any;
  onChange?: (elements: any[], appState: any, files: any) => void;
  isReadOnly?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
  style?: React.CSSProperties;
}

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);

export default function InSlideExcalidrawInner({
  initialData,
  onChange,
  isReadOnly = false,
  theme = 'dark',
  className = '',
  style = {},
}: InSlideExcalidrawProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        ...style,
      }}
    >
      <Excalidraw
        theme={theme}
        viewModeEnabled={isReadOnly}
        initialData={initialData}
        onChange={(elements, appState, files) => {
          if (onChange) {
            onChange(elements as any[], appState, files);
          }
        }}
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
  );
}
