'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getPresentation } from '@/lib/firestore';
import { getLocalFileUrl } from '@/lib/localFileStore';
import type { Presentation, Resource } from '@/lib/types';
import { getResourceIcon, clamp } from '@/lib/utils';
import styles from './present.module.css';

export default function PresentPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, loading } = useAuth();
  const router = useRouter();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [dividerPosition, setDividerPosition] = useState(70);
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // In-app modal preview states
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [activePdfResource, setActivePdfResource] = useState<{ name: string; url: string } | null>(null);
  const [activeCodeResource, setActiveCodeResource] = useState<Resource | null>(null);
  const [codeRunnerOutput, setCodeRunnerOutput] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!loading && id) {
      loadPresentation();
    }
  }, [id, loading, user]);

  const loadPresentation = async () => {
    try {
      const pres = await getPresentation(id);
      if (!pres) {
        router.push('/dashboard');
        return;
      }
      // Check access
      if (pres.visibility === 'private' && user && pres.ownerId !== user.uid) {
        router.push('/dashboard');
        return;
      }
      setPresentation(pres);
    } catch {
      router.push('/dashboard');
    }
  };

  const currentSlide = presentation?.slides[currentSlideIndex] || null;
  const totalSlides = presentation?.slides.length || 0;

  // Navigation
  const goNext = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when a modal is open
      if (activePdfResource || activeCodeResource || previewResource) {
        if (e.key === 'Escape') {
          setActivePdfResource(null);
          setActiveCodeResource(null);
          setPreviewResource(null);
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen?.();
        } else {
          router.back();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, isFullscreen, activePdfResource, activeCodeResource, previewResource]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  useEffect(() => {
    const handler = () => resetControlsTimer();
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [resetControlsTimer]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Divider drag
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      setDividerPosition(clamp(pct, 35, 85));
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Resolve and handle opening/previewing a resource
  const handleOpenResource = async (res: Resource) => {
    try {
      let resolvedUrl = res.url || '';
      if (!resolvedUrl && (res as any).localId) {
        resolvedUrl = (await getLocalFileUrl((res as any).localId)) || '';
      } else if (resolvedUrl.startsWith('local:')) {
        resolvedUrl = (await getLocalFileUrl(resolvedUrl)) || '';
      }

      const isPdf = res.name.toLowerCase().endsWith('.pdf') || (res.type === 'document' && res.name.toLowerCase().endsWith('.pdf'));
      if (isPdf && (resolvedUrl || res.content)) {
        setActivePdfResource({ name: res.name, url: resolvedUrl || res.content || '' });
        return;
      }

      if (res.type === 'code') {
        setActiveCodeResource(res);
        setCodeRunnerOutput('');
        return;
      }

      if (res.type === 'image') {
        setPreviewResource({ ...res, url: resolvedUrl || res.content || '' });
        return;
      }

      if (res.type === 'video' || res.type === 'audio') {
        setPreviewResource({ ...res, url: resolvedUrl || res.content || '' });
        return;
      }

      // If regular URL or document
      if (resolvedUrl) {
        window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
      } else if (res.content) {
        setPreviewResource(res);
      }
    } catch (err) {
      console.error('Error opening resource:', err);
    }
  };

  const handleRunCodeResource = (code: string) => {
    const isHtml = /<[a-z][\s\S]*>/i.test(code);
    if (isHtml) {
      setCodeRunnerOutput(code);
    } else {
      // JavaScript execution sandbox
      const wrapped = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: monospace; padding: 12px; background: #0f1117; color: #38bdf8; }
            .log { border-bottom: 1px solid #1e293b; padding: 4px 0; }
            .err { color: #f87171; }
          </style>
        </head>
        <body>
          <div id="logs"></div>
          <script>
            const logEl = document.getElementById('logs');
            const originalLog = console.log;
            const originalError = console.error;
            console.log = (...args) => {
              const div = document.createElement('div');
              div.className = 'log';
              div.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
              logEl.appendChild(div);
              originalLog(...args);
            };
            console.error = (...args) => {
              const div = document.createElement('div');
              div.className = 'log err';
              div.textContent = '❌ ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
              logEl.appendChild(div);
              originalError(...args);
            };
            try {
              ${code}
            } catch (err) {
              console.error(err.message);
            }
          <\/script>
        </body>
        </html>
      `;
      setCodeRunnerOutput(wrapped);
    }
  };

  if (!presentation) {
    return (
      <div className={styles.loadingPage}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="animate-spin" style={{ fontSize: '2rem', color: '#f97316' }}>⬡</div>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>Loading Studio Presentation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.present} onMouseMove={resetControlsTimer}>
      {/* Presentation Main Canvas */}
      <div className={styles.presentBody} ref={containerRef}>
        {/* Slide Area */}
        <div
          className={styles.slideArea}
          style={{ width: `calc(${dividerPosition}% - 14px)` }}
        >
          <div
            className={styles.slide}
            style={{ background: currentSlide?.background.value || '#12141a' }}
          >
            {currentSlide?.elements.map((el) => (
              <div
                key={el.id}
                className={styles.slideElement}
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: `${el.width}%`,
                  height: `${el.height}%`,
                  ...el.style,
                }}
              >
                {el.type === 'text' && (
                  <div style={el.style} dangerouslySetInnerHTML={{ __html: el.content }} />
                )}
                {el.type === 'image' && (
                  <img src={el.content} alt="" className={styles.slideImage} draggable={false} />
                )}
                {el.type === 'table' && el.tableData && (
                  <div className={styles.tableWrapper}>
                    <table className={styles.slideTable}>
                      <tbody>
                        {el.tableData.rows.map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx === 0 ? styles.tableHeaderRow : undefined}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {el.type === 'shape' && (
                  <div
                    className={`${styles.slideShape} ${styles['shape_' + (el.shapeType || 'rect')]}`}
                    style={el.style}
                  >
                    {el.content && <span>{el.content}</span>}
                  </div>
                )}
                {el.type === 'code' && (
                  <div className={styles.codeBlockElement}>
                    <div className={styles.codeBlockHeader}>
                      <span className={styles.codeDot} style={{ background: '#f87171' }} />
                      <span className={styles.codeDot} style={{ background: '#fbbf24' }} />
                      <span className={styles.codeDot} style={{ background: '#34d399' }} />
                      <span className={styles.codeLang}>snippet</span>
                    </div>
                    <pre className={styles.codePre}><code>{el.content}</code></pre>
                  </div>
                )}
                {el.type === 'excalidraw' && (
                  <div
                    className={styles.excalidrawWrapper}
                    dangerouslySetInnerHTML={{ __html: el.content }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Signature Diagonal Slash Divider */}
        <div
          className={`${styles.diagonalDivider} ${isDragging ? styles.dividerActive : ''}`}
          onMouseDown={handleDividerMouseDown}
          onDoubleClick={() => setDividerPosition(70)}
          title="Drag to adjust presentation / resource split (Double-click to reset)"
        >
          <svg
            className={styles.slashSvg}
            preserveAspectRatio="none"
            viewBox="0 0 28 1000"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="presentSlashGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                <stop offset="25%" stopColor="#f97316" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#fb923c" stopOpacity="1" />
                <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
              </linearGradient>
              <filter id="presentSlashGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <line
              x1="22"
              y1="0"
              x2="6"
              y2="1000"
              stroke="#f97316"
              strokeWidth="5"
              opacity="0.2"
              filter="url(#presentSlashGlow)"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="22"
              y1="0"
              x2="6"
              y2="1000"
              stroke="url(#presentSlashGrad)"
              strokeWidth="2.5"
              filter="url(#presentSlashGlow)"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className={styles.slashPillHandle}>
            <span className={styles.slashRatioLabel}>
              {Math.round(dividerPosition)} / {Math.round(100 - dividerPosition)}
            </span>
          </div>
        </div>

        {/* 30% Interactive Resources Panel */}
        <div
          className={styles.resources}
          style={{ width: `calc(${100 - dividerPosition}% - 14px)` }}
        >
          <div className={styles.resourceHeader}>
            <span className={styles.resourceHeaderTitle}>
              <span>📁</span> Slide Resources & Handouts
            </span>
            <button
              className={styles.resActionBtn}
              onClick={() => setDividerPosition(70)}
              title="Reset split to standard 70/30"
            >
              ↺ 70/30
            </button>
          </div>

          <div className={styles.resourceScroll}>
            {/* Notes & Pro-tips */}
            {currentSlide && (currentSlide.notes || []).length > 0 && (
              <div className={styles.resourceSection}>
                <span className={styles.resourceSectionTitle}>Speaker Notes & Comic Tips</span>
                {(currentSlide.notes || []).map((note, nIdx) => (
                  <div key={note.id} className={styles.noteCard}>
                    <div className={styles.comicBadge}>
                      <span>{nIdx % 2 === 0 ? '⚡ PRO-TIP' : '💬 NOTE'}</span>
                    </div>
                    <p>{note.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Attached Files & Live Previews */}
            {currentSlide && (currentSlide.resources || []).length > 0 && (
              <div className={styles.resourceSection}>
                <span className={styles.resourceSectionTitle}>Attached Handouts & Links</span>
                {(currentSlide.resources || []).map((res) => {
                  const isPdf = res.name.toLowerCase().endsWith('.pdf') || (res.type === 'document' && res.name.toLowerCase().endsWith('.pdf'));
                  const isCode = res.type === 'code';
                  return (
                    <div key={res.id} className={styles.resourceItem}>
                      <span className={styles.resIcon}>{getResourceIcon(res.type)}</span>
                      <div className={styles.resMeta}>
                        <span className={styles.resName}>{res.name}</span>
                        <span className={styles.resTypeTag}>
                          {isPdf ? 'PDF Handout' : isCode ? 'Live Code' : res.type}
                        </span>
                      </div>
                      <button
                        className={styles.resActionBtn}
                        onClick={() => handleOpenResource(res)}
                      >
                        {isPdf ? '📄 Open PDF' : isCode ? '▶ Run' : res.type === 'image' ? '👁 View' : 'Open'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {(!currentSlide || ((currentSlide.notes || []).length === 0 && (currentSlide.resources || []).length === 0)) && (
              <div className={styles.emptyResources}>
                <span style={{ fontSize: 24 }}>📑</span>
                <p>No extra resources attached to this slide.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Controls Bar */}
      <div className={`${styles.controls} ${showControls ? styles.controlsVisible : ''}`}>
        <button className={styles.ctrlBtn} onClick={() => router.back()}>
          ✕ Exit Studio
        </button>

        <div className={styles.navControls}>
          <button
            className={styles.ctrlBtn}
            onClick={goPrev}
            disabled={currentSlideIndex === 0}
            title="Previous Slide (Left Arrow)"
          >
            ← Previous
          </button>
          <span className={styles.slideCounter}>
            {currentSlideIndex + 1} / {totalSlides}
          </span>
          <button
            className={styles.ctrlBtn}
            onClick={goNext}
            disabled={currentSlideIndex === totalSlides - 1}
            title="Next Slide (Right Arrow or Space)"
          >
            Next →
          </button>
        </div>

        <div className={styles.rightControls}>
          <button className={styles.ctrlBtn} onClick={() => setDividerPosition(70)} title="Reset layout">
            ↺ 70/30
          </button>
          <button className={styles.ctrlBtn} onClick={toggleFullscreen}>
            {isFullscreen ? '⊡ Exit Fullscreen' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${((currentSlideIndex + 1) / totalSlides) * 100}%` }}
        />
      </div>

      {/* In-App PDF Preview Modal */}
      {activePdfResource && (
        <>
          <div className={styles.modalBackdrop} onClick={() => setActivePdfResource(null)} />
          <div className={styles.previewModal}>
            <div className={styles.previewModalHeader}>
              <span className={styles.previewModalTitle}>
                <span>📄</span> {activePdfResource.name}
              </span>
              <button className={styles.previewModalClose} onClick={() => setActivePdfResource(null)}>✕</button>
            </div>
            <div className={styles.previewModalBody}>
              <iframe
                src={activePdfResource.url}
                className={styles.pdfFrame}
                title={activePdfResource.name}
              />
            </div>
          </div>
        </>
      )}

      {/* In-App Code Runner Preview Modal */}
      {activeCodeResource && (
        <>
          <div className={styles.modalBackdrop} onClick={() => setActiveCodeResource(null)} />
          <div className={styles.previewModal}>
            <div className={styles.previewModalHeader}>
              <span className={styles.previewModalTitle}>
                <span>💻</span> {activeCodeResource.name}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={styles.resActionBtn}
                  onClick={() => handleRunCodeResource(activeCodeResource.content || activeCodeResource.url || '')}
                >
                  ▶ Run Code
                </button>
                <button className={styles.previewModalClose} onClick={() => setActiveCodeResource(null)}>✕</button>
              </div>
            </div>
            <div className={styles.previewModalBody}>
              <pre style={{
                maxHeight: '30vh',
                overflow: 'auto',
                padding: 12,
                background: '#0d1117',
                borderRadius: 8,
                color: '#e6edf3',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 12,
                marginBottom: 12,
              }}>
                <code>{activeCodeResource.content || activeCodeResource.url}</code>
              </pre>
              {codeRunnerOutput && (
                <iframe
                  srcDoc={codeRunnerOutput}
                  className={styles.codeRunnerOutput}
                  title="Code Runner Result"
                  sandbox="allow-scripts"
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* General Media Preview Modal */}
      {previewResource && (
        <>
          <div className={styles.modalBackdrop} onClick={() => setPreviewResource(null)} />
          <div className={styles.previewModal}>
            <div className={styles.previewModalHeader}>
              <span className={styles.previewModalTitle}>{previewResource.name}</span>
              <button className={styles.previewModalClose} onClick={() => setPreviewResource(null)}>✕</button>
            </div>
            <div className={styles.previewModalBody} style={{ alignItems: 'center', justifyContent: 'center' }}>
              {previewResource.type === 'image' && (
                <img
                  src={previewResource.url || previewResource.content}
                  alt={previewResource.name}
                  style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: 8, objectFit: 'contain' }}
                />
              )}
              {previewResource.type === 'video' && previewResource.url && (
                <video controls style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: 8 }}>
                  <source src={previewResource.url} />
                </video>
              )}
              {previewResource.type === 'audio' && previewResource.url && (
                <audio controls style={{ width: '100%', maxWidth: 500, margin: '24px 0' }}>
                  <source src={previewResource.url} />
                </audio>
              )}
              {previewResource.content && previewResource.type !== 'image' && (
                <div style={{ color: '#f3f4f6', lineHeight: 1.6, padding: 16, width: '100%' }}>
                  {previewResource.content}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
