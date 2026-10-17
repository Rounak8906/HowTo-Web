import React from 'react';
import type { SlideElement } from '@/lib/types';
import { adjustColor } from '@/lib/utils';
import styles from './realisticShape.module.css';

interface RealisticShapeProps {
  element?: SlideElement;
  shapeType?: 'rect' | 'circle' | 'arrow' | 'callout' | 'star' | 'cylinder' | 'cube' | 'diamond' | 'hexagon' | 'sticky';
  style?: Record<string, string>;
  content?: string;
  shapeRealisticStyle?: 'shaded' | 'glass' | 'glossy' | 'neumorphic' | 'metallic';
  isEditable?: boolean;
  onContentChange?: (text: string) => void;
  className?: string;
}

export default function RealisticShape({
  element,
  shapeType = element?.shapeType || 'rect',
  style = (element?.style as Record<string, string>) || {},
  content = element?.content || '',
  shapeRealisticStyle = element?.shapeRealisticStyle || 'shaded',
  isEditable = false,
  onContentChange,
  className = '',
}: RealisticShapeProps) {
  // Base color extracted from background-color or default to vivid indigo
  const baseColor =
    style.backgroundColor && style.backgroundColor.startsWith('#')
      ? style.backgroundColor
      : '#4f46e5';

  const lighterColor = adjustColor(baseColor, 40);
  const lightColor = adjustColor(baseColor, 20);
  const darkerColor = adjustColor(baseColor, -35);
  const darkestColor = adjustColor(baseColor, -60);
  const textColor = style.color || '#ffffff';

  // Render SVG or structured realistic shape
  const renderShapeGeometry = () => {
    switch (shapeType) {
      case 'circle': {
        return (
          <svg viewBox="0 0 100 100" className={styles.shapeSvg} preserveAspectRatio="none">
            <defs>
              <radialGradient id={`sphereGrad_${baseColor}`} cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="20%" stopColor={lighterColor} stopOpacity="0.95" />
                <stop offset="55%" stopColor={baseColor} stopOpacity="1" />
                <stop offset="85%" stopColor={darkerColor} stopOpacity="1" />
                <stop offset="100%" stopColor={darkestColor} stopOpacity="1" />
              </radialGradient>
              <filter id={`sphereShadow_${baseColor}`} x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.25" floodColor="#0f172a" />
              </filter>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill={`url(#sphereGrad_${baseColor})`}
              filter={`url(#sphereShadow_${baseColor})`}
            />
            {/* Specular high-light reflection ellipse */}
            <ellipse
              cx="38"
              cy="30"
              rx="12"
              ry="7"
              transform="rotate(-28 38 30)"
              fill="#ffffff"
              opacity="0.65"
            />
          </svg>
        );
      }

      case 'cylinder': {
        return (
          <svg viewBox="0 0 100 100" className={styles.shapeSvg} preserveAspectRatio="none">
            <defs>
              <linearGradient id={`cylBody_${baseColor}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={darkerColor} />
                <stop offset="25%" stopColor={baseColor} />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.65" />
                <stop offset="75%" stopColor={baseColor} />
                <stop offset="100%" stopColor={darkestColor} />
              </linearGradient>
              <linearGradient id={`cylTop_${baseColor}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="50%" stopColor={lightColor} />
                <stop offset="100%" stopColor={baseColor} />
              </linearGradient>
              <filter id={`cylShadow_${baseColor}`} x="-20%" y="-10%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.25" floodColor="#0f172a" />
              </filter>
            </defs>
            {/* Cylinder Body */}
            <path
              d="M 12 24 L 12 76 A 38 14 0 0 0 88 76 L 88 24 Z"
              fill={`url(#cylBody_${baseColor})`}
              filter={`url(#cylShadow_${baseColor})`}
            />
            {/* Bottom rim specular highlight */}
            <path
              d="M 12 76 A 38 14 0 0 0 88 76"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.5"
            />
            {/* Top Elliptical Lid */}
            <ellipse
              cx="50"
              cy="24"
              rx="38"
              ry="14"
              fill={`url(#cylTop_${baseColor})`}
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1"
            />
          </svg>
        );
      }

      case 'cube': {
        return (
          <svg viewBox="0 0 100 100" className={styles.shapeSvg} preserveAspectRatio="none">
            <defs>
              <linearGradient id={`cubeTop_${baseColor}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor={lighterColor} />
              </linearGradient>
              <linearGradient id={`cubeLeft_${baseColor}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={baseColor} />
                <stop offset="100%" stopColor={darkerColor} />
              </linearGradient>
              <linearGradient id={`cubeRight_${baseColor}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={darkerColor} />
                <stop offset="100%" stopColor={darkestColor} />
              </linearGradient>
              <filter id={`cubeShadow_${baseColor}`} x="-20%" y="-10%" width="140%" height="140%">
                <feDropShadow dx="0" dy="7" stdDeviation="5" floodOpacity="0.3" floodColor="#0f172a" />
              </filter>
            </defs>
            {/* Floor Ambient Shadow */}
            <ellipse cx="50" cy="94" rx="38" ry="5" fill="rgba(15, 23, 42, 0.2)" />
            {/* Left Face */}
            <polygon
              points="10,32 50,54 50,94 10,72"
              fill={`url(#cubeLeft_${baseColor})`}
              filter={`url(#cubeShadow_${baseColor})`}
            />
            {/* Right Face */}
            <polygon
              points="50,54 90,32 90,72 50,94"
              fill={`url(#cubeRight_${baseColor})`}
            />
            {/* Top Face */}
            <polygon
              points="50,10 90,32 50,54 10,32"
              fill={`url(#cubeTop_${baseColor})`}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="0.8"
            />
          </svg>
        );
      }

      case 'arrow': {
        return (
          <svg viewBox="0 0 100 100" className={styles.shapeSvg} preserveAspectRatio="none">
            <defs>
              <linearGradient id={`arrowGrad_${baseColor}`} x1="0%" y1="0%" x2="100%" y2="50%">
                <stop offset="0%" stopColor={lightColor} />
                <stop offset="60%" stopColor={baseColor} />
                <stop offset="100%" stopColor={darkerColor} />
              </linearGradient>
              <linearGradient id={`arrowBevel_${baseColor}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
              <filter id={`arrowShadow_${baseColor}`} x="-15%" y="-15%" width="130%" height="140%">
                <feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity="0.25" floodColor="#0f172a" />
              </filter>
            </defs>
            <polygon
              points="6,34 58,34 58,16 94,50 58,84 58,66 6,66"
              fill={`url(#arrowGrad_${baseColor})`}
              filter={`url(#arrowShadow_${baseColor})`}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Top edge specular bevel */}
            <polyline
              points="6,35 58,35 58,18 92,50"
              fill="none"
              stroke={`url(#arrowBevel_${baseColor})`}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        );
      }

      case 'callout': {
        return (
          <svg viewBox="0 0 100 100" className={styles.shapeSvg} preserveAspectRatio="none">
            <defs>
              <linearGradient id={`calloutGrad_${baseColor}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={lightColor} />
                <stop offset="100%" stopColor={baseColor} />
              </linearGradient>
              <filter id={`calloutShadow_${baseColor}`} x="-15%" y="-15%" width="130%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.22" floodColor="#0f172a" />
              </filter>
            </defs>
            <path
              d="M 10 16 
                 C 10 10, 14 6, 22 6 
                 L 78 6 
                 C 86 6, 90 10, 90 16 
                 L 90 64 
                 C 90 70, 86 74, 78 74 
                 L 46 74 
                 L 28 92 
                 L 30 74 
                 L 22 74 
                 C 14 74, 10 70, 10 64 
                 Z"
              fill={`url(#calloutGrad_${baseColor})`}
              filter={`url(#calloutShadow_${baseColor})`}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.2"
            />
            {/* Top highlight line */}
            <path
              d="M 22 8 L 78 8"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        );
      }

      case 'star': {
        return (
          <svg viewBox="0 0 100 100" className={styles.shapeSvg} preserveAspectRatio="none">
            <defs>
              <filter id={`starShadow_${baseColor}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.3" floodColor="#0f172a" />
              </filter>
            </defs>
            <g filter={`url(#starShadow_${baseColor})`}>
              {/* Center point is 50,52 */}
              {/* Facet 1: Top point left */}
              <polygon points="50,52 50,8 37,35" fill={lighterColor} />
              {/* Facet 2: Top point right */}
              <polygon points="50,52 50,8 63,35" fill={lightColor} />
              {/* Facet 3: Right upper */}
              <polygon points="50,52 63,35 94,36" fill={darkerColor} />
              {/* Facet 4: Right lower */}
              <polygon points="50,52 94,36 69,57" fill={baseColor} />
              {/* Facet 5: Bottom right */}
              <polygon points="50,52 69,57 79,90" fill={darkestColor} />
              {/* Facet 6: Bottom right inner */}
              <polygon points="50,52 79,90 50,71" fill={darkerColor} />
              {/* Facet 7: Bottom left inner */}
              <polygon points="50,52 50,71 21,90" fill={baseColor} />
              {/* Facet 8: Bottom left */}
              <polygon points="50,52 21,90 31,57" fill={darkerColor} />
              {/* Facet 9: Left lower */}
              <polygon points="50,52 31,57 6,36" fill={lightColor} />
              {/* Facet 10: Left upper */}
              <polygon points="50,52 6,36 37,35" fill={lighterColor} />
            </g>
            {/* Center jewel sparkle */}
            <circle cx="50" cy="52" r="3" fill="#ffffff" opacity="0.9" />
          </svg>
        );
      }

      case 'diamond': {
        return (
          <svg viewBox="0 0 100 100" className={styles.shapeSvg} preserveAspectRatio="none">
            <defs>
              <filter id={`diaShadow_${baseColor}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="7" stdDeviation="5" floodOpacity="0.25" floodColor="#0f172a" />
              </filter>
            </defs>
            <g filter={`url(#diaShadow_${baseColor})`}>
              {/* Top Crown Facets */}
              <polygon points="26,14 74,14 62,38 38,38" fill={lighterColor} />
              <polygon points="10,38 26,14 38,38" fill={lightColor} />
              <polygon points="74,14 90,38 62,38" fill={baseColor} />
              {/* Lower Pavilion Facets */}
              <polygon points="10,38 38,38 50,92" fill={darkerColor} />
              <polygon points="38,38 62,38 50,92" fill={baseColor} />
              <polygon points="62,38 90,38 50,92" fill={darkestColor} />
            </g>
            {/* Sparkle glint on top vertex */}
            <circle cx="26" cy="14" r="2.5" fill="#ffffff" opacity="0.95" />
          </svg>
        );
      }

      case 'hexagon': {
        return (
          <svg viewBox="0 0 100 100" className={styles.shapeSvg} preserveAspectRatio="none">
            <defs>
              <linearGradient id={`hexGrad_${baseColor}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={lightColor} />
                <stop offset="60%" stopColor={baseColor} />
                <stop offset="100%" stopColor={darkerColor} />
              </linearGradient>
              <filter id={`hexShadow_${baseColor}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.25" floodColor="#0f172a" />
              </filter>
            </defs>
            <polygon
              points="50,8 88,28 88,72 50,92 12,72 12,28"
              fill={`url(#hexGrad_${baseColor})`}
              filter={`url(#hexShadow_${baseColor})`}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
            />
            {/* Inner beveled rim */}
            <polygon
              points="50,14 83,31 83,69 50,86 17,69 17,31"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
            />
          </svg>
        );
      }

      case 'sticky': {
        return (
          <div className={styles.realisticStickyCard} style={{ background: baseColor || '#fef08a' }}>
            <div className={styles.stickyPeelShadow} />
            <div className={styles.stickyCurlCorner} />
          </div>
        );
      }

      case 'rect':
      default: {
        return (
          <div
            className={`${styles.realisticRectCard} ${styles['style_' + shapeRealisticStyle]}`}
            style={{
              backgroundColor: baseColor,
              borderColor: adjustColor(baseColor, 15),
            }}
          >
            {/* Top specular highlight reflection bar */}
            <div className={styles.rectSpecularSheen} />
          </div>
        );
      }
    }
  };

  return (
    <div className={`${styles.realisticShapeWrapper} ${className}`} style={{ width: '100%', height: '100%' }}>
      {renderShapeGeometry()}

      {/* Editable or Display Text Overlay */}
      <div className={styles.shapeTextOverlay}>
        {isEditable ? (
          <div
            className={styles.shapeTextEditable}
            contentEditable
            suppressContentEditableWarning
            style={{
              color: shapeType === 'sticky' ? '#0f172a' : textColor,
              fontFamily: style.fontFamily || 'inherit',
              fontSize: style.fontSize || '1.15rem',
              fontWeight: style.fontWeight || '700',
              textAlign: (style.textAlign as any) || 'center',
            }}
            onBlur={(e) => {
              if (onContentChange) {
                onContentChange(e.currentTarget.textContent || '');
              }
            }}
          >
            {content || 'Click to type'}
          </div>
        ) : (
          <span
            className={styles.shapeTextContent}
            style={{
              color: shapeType === 'sticky' ? '#0f172a' : textColor,
              fontFamily: style.fontFamily || 'inherit',
              fontSize: style.fontSize || '1.15rem',
              fontWeight: style.fontWeight || '700',
              textAlign: (style.textAlign as any) || 'center',
            }}
          >
            {content}
          </span>
        )}
      </div>
    </div>
  );
}
