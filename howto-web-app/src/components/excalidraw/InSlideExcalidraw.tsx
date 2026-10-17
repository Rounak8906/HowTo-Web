'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { InSlideExcalidrawProps } from './InSlideExcalidrawInner';

const DynamicInSlideExcalidraw = dynamic(
  () => import('./InSlideExcalidrawInner'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 20, 34, 0.95)',
          borderRadius: 8,
          border: '1px dashed #6366f1',
          color: '#cbd5e1',
          fontSize: 13,
          gap: 10,
        }}
      >
        <span style={{ fontSize: 24, animation: 'spin 1.5s linear infinite' }}>✏️</span>
        <span>Loading slide drawing canvas...</span>
      </div>
    ),
  }
);

export default function InSlideExcalidraw(props: InSlideExcalidrawProps) {
  return <DynamicInSlideExcalidraw {...props} />;
}

export type { InSlideExcalidrawProps };
