'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { ExcalidrawWrapperProps } from './ExcalidrawWrapper';
import styles from './excalidraw.module.css';

// Dynamic import with SSR disabled to prevent window/canvas hydration errors in Next.js
const DynamicExcalidrawWrapper = dynamic(
  () => import('./ExcalidrawWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className={styles.modalOverlay}>
        <div className={styles.modalCard} style={{ height: 400, maxWidth: 600 }}>
          <div className={styles.loadingSpinner}>
            <div className="animate-spin" style={{ fontSize: 32 }}>⬡</div>
            <p style={{ fontWeight: 600, color: '#f8fafc' }}>Loading Excalidraw Studio...</p>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Preparing vector sketch engine</p>
          </div>
        </div>
      </div>
    ),
  }
);

export default function ExcalidrawModal(props: ExcalidrawWrapperProps) {
  if (!props.isOpen) return null;
  return <DynamicExcalidrawWrapper {...props} />;
}
