'use client';

import React from 'react';
import styles from './developedByButton.module.css';

interface DevelopedByButtonProps {
  variant?: 'default' | 'compact' | 'hero';
  className?: string;
  style?: React.CSSProperties;
}

export default function DevelopedByButton({
  variant = 'default',
  className = '',
  style = {},
}: DevelopedByButtonProps) {
  const variantClass =
    variant === 'compact'
      ? styles.compact
      : variant === 'hero'
      ? styles.hero
      : '';

  return (
    <a
      href="https://portfolio-2x8sol792-rounak8906s-projects.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.developerBtn} ${variantClass} ${className}`}
      style={style}
      title="Developed by Rounak Singh — Visit Portfolio"
      aria-label="Developed by Rounak Singh — Visit Portfolio"
    >
      <span className={styles.sparkleDot} aria-hidden="true" />
      <span className={styles.devText}>
        <span className={styles.fullPrefix}>developed </span>by{' '}
        <strong className={styles.devAuthor}>Rounak Singh</strong>
      </span>
      <span className={styles.devBtnArrow} aria-hidden="true">↗</span>
    </a>
  );
}
