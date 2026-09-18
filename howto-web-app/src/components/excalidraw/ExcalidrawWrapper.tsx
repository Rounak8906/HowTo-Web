'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Excalidraw, exportToSvg } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import styles from './excalidraw.module.css';

export interface ExcalidrawSavePayload {
  svgString: string;
  elements: readonly any[];
  appState: any;
  files: any;
  name: string;
}

export interface ExcalidrawWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ExcalidrawSavePayload) => void;
  initialData?: {
    elements?: readonly any[];
    appState?: any;
    files?: any;
    name?: string;
  } | null;
  defaultTheme?: 'dark' | 'light';
}

export default function ExcalidrawWrapper({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultTheme = 'dark',
}: ExcalidrawWrapperProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [diagramName, setDiagramName] = useState<string>(initialData?.name || 'Hand-drawn Diagram');
  const [theme, setTheme] = useState<'dark' | 'light'>(defaultTheme);
  const [transparentBg, setTransparentBg] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Initialize with initial elements if editing existing component
  useEffect(() => {
    if (excalidrawAPI && initialData) {
      if (initialData.name) setDiagramName(initialData.name);
      if (initialData.elements && initialData.elements.length > 0) {
        excalidrawAPI.updateScene({
          elements: initialData.elements,
          appState: {
            ...initialData.appState,
            theme: defaultTheme,
          },
        });
        if (initialData.files) {
          excalidrawAPI.addFiles(Object.values(initialData.files));
        }
      }
    }
  }, [excalidrawAPI, initialData, defaultTheme]);

  const handleExportAndSave = useCallback(async () => {
    if (!excalidrawAPI) return;
    setIsExporting(true);

    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      if (!elements || elements.length === 0) {
        alert('Please draw at least one shape, arrow, or text before saving.');
        setIsExporting(false);
        return;
      }

      // Generate clean vector SVG
      const svgElement = await exportToSvg({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: theme === 'dark',
          exportBackground: !transparentBg,
          viewBackgroundColor: transparentBg ? 'transparent' : appState.viewBackgroundColor || '#0f1422',
          exportPadding: 24,
        },
        files,
      });

      // Ensure SVG is responsive by adding preserveAspectRatio and responsive viewBox
      svgElement.setAttribute('width', '100%');
      svgElement.setAttribute('height', '100%');
      svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svgElement.style.display = 'block';

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);

      onSave({
        svgString,
        elements,
        appState: {
          theme,
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
        },
        files,
        name: diagramName.trim() || 'Hand-drawn Diagram',
      });
      onClose();
    } catch (err) {
      console.error('Failed to export Excalidraw diagram:', err);
      alert('Error generating diagram SVG. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [excalidrawAPI, theme, transparentBg, diagramName, onSave, onClose]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Top Header Controls */}
        <header className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <span className={styles.badge}>
              <span>✏️</span> Excalidraw Component
            </span>
            <input
              type="text"
              className={styles.titleInput}
              value={diagramName}
              onChange={(e) => setDiagramName(e.target.value)}
              placeholder="Diagram name (e.g. Architecture Flow)"
              title="Click to rename diagram"
            />
          </div>

          <div className={styles.modalHeaderRight}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${theme === 'dark' ? styles.toggleBtnActive : ''}`}
              onClick={() => {
                const nextTheme = theme === 'dark' ? 'light' : 'dark';
                setTheme(nextTheme);
                if (excalidrawAPI) {
                  excalidrawAPI.updateScene({ appState: { theme: nextTheme } });
                }
              }}
              title="Toggle Dark / Light canvas theme"
            >
              <span>{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</span>
            </button>

            <button
              type="button"
              className={`${styles.toggleBtn} ${transparentBg ? styles.toggleBtnActive : ''}`}
              onClick={() => setTransparentBg(!transparentBg)}
              title="Transparent background matches your slide background perfectly"
            >
              <span>{transparentBg ? '◻ Transparent' : '◼ Solid BG'}</span>
            </button>

            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>

            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleExportAndSave}
              disabled={isExporting}
              title="Insert diagram directly onto your slide"
            >
              <span>{isExporting ? '⏳ Saving...' : '💾 Save as Slide Component'}</span>
            </button>
          </div>
        </header>

        {/* Excalidraw Interactive Canvas */}
        <div className={styles.canvasContainer}>
          <Excalidraw
            excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
            theme={theme}
            UIOptions={{
              canvasActions: {
                loadScene: false,
                saveToActiveFile: false,
                export: false,
                saveAsImage: false,
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
