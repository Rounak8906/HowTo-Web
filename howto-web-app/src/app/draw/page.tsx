'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import StandaloneExcalidraw from '@/components/draw/StandaloneExcalidraw';
import HangingNavBar from '@/components/HangingNavBar';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './draw.module.css';

export default function DrawPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className={styles.drawContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading canvas...</div>
      </div>
    );
  }

  return (
    <div className={styles.drawContainer}>
      {/* Top Floating Mini Header */}
      <div className={styles.topBar}>
        <Link href="/home" className={styles.backBtn}>
          <ArrowLeft size={14} />
          <span>Home</span>
        </Link>
        <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
        <div className={styles.brandLabel}>
          <span className={styles.brandDot} />
          <span>Whiteboard</span>
        </div>
      </div>

      {/* Standalone Full-screen Excalidraw */}
      <div className={styles.drawCanvasWrapper}>
        <StandaloneExcalidraw theme={theme === 'dark' ? 'dark' : 'light'} />
      </div>

      {/* Instagram-style Hanging Navigation Bar */}
      <HangingNavBar activeTab="draw" />
    </div>
  );
}
