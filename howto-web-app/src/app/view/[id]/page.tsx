'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPresentation, forkPresentation, checkForUpdates, pullUpdates, toggleLikePresentation } from '@/lib/firestore';
import type { Presentation, Resource } from '@/lib/types';
import { ROLE_INFO } from '@/lib/types';
import { getResourceIcon, clamp, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import styles from './view.module.css';

export default function ViewPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const router = useRouter();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [dividerPosition, setDividerPosition] = useState(70);
  const [isDragging, setIsDragging] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ hasUpdates: boolean; originalVersion: number; forkVersion: number } | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [notFound, setNotFound] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) loadPresentation();
  }, [id]);

  const loadPresentation = async () => {
    try {
      const pres = await getPresentation(id);
      if (!pres) {
        setNotFound(true);
        return;
      }
      if (pres.visibility === 'private' && pres.ownerId !== user?.uid) {
        setNotFound(true);
        return;
      }
      setPresentation(pres);

      // Check for fork updates
      if (pres.forkOf && pres.ownerId === user?.uid) {
        const info = await checkForUpdates(pres.id);
        if (info) setUpdateInfo(info);
      }
    } catch {
      setNotFound(true);
    }
  };

  const currentSlide = presentation?.slides[currentSlideIndex] || null;
  const totalSlides = presentation?.slides.length || 0;
  const isOwner = user?.uid === presentation?.ownerId;
  const isLiked = Boolean(user && presentation?.likedBy?.includes(user.uid));

  const handleToggleLike = async () => {
    if (!user) {
      toast.error('Please log in to like');
      router.push('/login');
      return;
    }
    if (!presentation) return;

    const currentlyLiked = Boolean(presentation.likedBy?.includes(user.uid));
    // Optimistic UI update
    setPresentation((prev) => {
      if (!prev) return prev;
      const currentLikedBy = prev.likedBy || [];
      const nextLikedBy = currentlyLiked
        ? currentLikedBy.filter((uid) => uid !== user.uid)
        : [...currentLikedBy, user.uid];
      const nextCount = Math.max(0, (prev.likesCount || 0) + (currentlyLiked ? -1 : 1));
      return {
        ...prev,
        likedBy: nextLikedBy,
        likesCount: nextCount,
      };
    });

    try {
      const res = await toggleLikePresentation(presentation.id, user.uid);
      if (res.liked) {
        toast.success('Liked! Creator awarded +10 points ⭐');
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      toast.error('Failed to like presentation');
      loadPresentation();
    }
  };

  const handleFork = async () => {
    if (!user) {
      toast.error('Please log in to fork');
      router.push('/login');
      return;
    }
    if (!presentation) return;
    setIsForking(true);
    try {
      const fork = await forkPresentation(
        presentation.id,
        user.uid,
        user.displayName || 'Creator',
        user.photoURL,
        user.username
      );
      toast.success('Forked! Creator awarded +25 points ⭐ Redirecting to your copy...');
      router.push(`/editor/${fork.id}`);
    } catch (err) {
      toast.error('Failed to fork presentation');
    } finally {
      setIsForking(false);
    }
  };

  const handlePullUpdates = async () => {
    if (!presentation) return;
    setIsPulling(true);
    try {
      const result = await pullUpdates(presentation.id);
      if (result.success) {
        if (result.conflicts.length > 0) {
          toast(`Pulled updates with ${result.conflicts.length} conflict(s). Your changes were kept.`, {
            icon: '⚠️',
          });
        } else {
          toast.success('Updates pulled successfully!');
        }
        loadPresentation();
      } else {
        toast.error('Failed to pull updates');
      }
    } catch {
      toast.error('Failed to pull updates');
    } finally {
      setIsPulling(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [totalSlides]);

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
      setDividerPosition(clamp(pct, 40, 85));
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (notFound) {
    return (
      <div className={styles.notFound}>
        <h2>Presentation Not Found</h2>
        <p>This presentation may be private or does not exist.</p>
        <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
          Back to Workspace
        </button>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className={styles.loadingPage}>
        <div className="spinner" />
        <p>Loading presentation...</p>
      </div>
    );
  }

  const ownerRoleInfo = presentation.ownerRole ? (ROLE_INFO[presentation.ownerRole] || null) : null;

  return (
    <div className={styles.viewPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')}>
            ← Back
          </button>
          <div className={styles.presInfo}>
            <h1 className={styles.presTitle}>{presentation.title}</h1>
            <div className={styles.presMeta}>
              <span>by {presentation.ownerName}</span>
              {ownerRoleInfo && (
                <span className={styles.authorRoleBadge} title={`Role: ${ownerRoleInfo.label}`}>
                  <span>{ownerRoleInfo.icon}</span>
                  <span>{ownerRoleInfo.label}</span>
                </span>
              )}
              <span>• {presentation.slides.length} slides • v{presentation.version}</span>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Fork updates banner */}
          {updateInfo?.hasUpdates && isOwner && (
            <button
              className={styles.updateBanner}
              onClick={handlePullUpdates}
              disabled={isPulling}
            >
              ⚡ {isPulling ? 'Pulling...' : 'Pull Updates'} (v{updateInfo.forkVersion} → v{updateInfo.originalVersion})
            </button>
          )}

          {/* Like Button (Awards +10 pts to Creator) */}
          <button
            type="button"
            className={`btn btn-sm ${isLiked ? styles.likedBtn : 'btn-secondary'}`}
            onClick={handleToggleLike}
            title={isLiked ? 'Unlike' : 'Like presentation (+10 pts to creator)'}
          >
            <span style={{ marginRight: 4 }}>{isLiked ? '❤️' : '🤍'}</span>
            <span>{presentation.likesCount || 0}</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => router.push(`/present/${presentation.id}`)}
          >
            ▶ Present
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleFork}
            disabled={isForking}
            title={isOwner ? 'Duplicate presentation' : 'Fork presentation (+25 pts to creator)'}
          >
            🍴 {isForking ? 'Forking...' : isOwner ? `Duplicate (${presentation.forkCount || 0})` : `Fork (${presentation.forkCount || 0})`}
          </button>

          {isOwner && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => router.push(`/editor/${presentation.id}`)}
            >
              ✏️ Edit
            </button>
          )}
        </div>
      </header>

      {/* Fork info banner */}
      {presentation.forkOf && (
        <div className={styles.forkBanner}>
          <span>🍴 Forked from </span>
          <Link
            href={`/view/${presentation.forkOf.originalId}`}
            style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}
          >
            {presentation.forkOf.originalOwnerUsername || presentation.forkOf.originalOwnerName}&apos;s &quot;{presentation.forkOf.originalTitle}&quot;
          </Link>
          <span style={{ marginLeft: 6, opacity: 0.7 }}>• Base version: v{presentation.forkOf.baseVersion}</span>
        </div>
      )}

      {/* Main Content */}
      <div className={styles.viewBody} ref={containerRef}>
        {/* Slide */}
        <div className={styles.slideArea} style={{ width: `${dividerPosition}%` }}>
          <div
            className={styles.slide}
            style={{ background: currentSlide?.background.value || '#1a1f35' }}
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
                  <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />
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

          {/* Navigation */}
          <div className={styles.slideNav}>
            <button
              className="btn btn-ghost"
              onClick={() => setCurrentSlideIndex((p) => Math.max(p - 1, 0))}
              disabled={currentSlideIndex === 0}
            >
              ← Previous
            </button>
            <span className={styles.slideCounter}>
              {currentSlideIndex + 1} / {totalSlides}
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => setCurrentSlideIndex((p) => Math.min(p + 1, totalSlides - 1))}
              disabled={currentSlideIndex === totalSlides - 1}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Divider */}
        <div
          className={`${styles.divider} ${isDragging ? styles.dividerActive : ''}`}
          style={{ left: `${dividerPosition}%` }}
          onMouseDown={handleDividerMouseDown}
        >
          <div className={styles.dividerLine} />
        </div>

        {/* Resources */}
        <div className={styles.resources} style={{ width: `${100 - dividerPosition}%` }}>
          <div className={styles.resourceHeader}>
            <h3>Resources</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setDividerPosition(70)}>
              ↺ 70/30
            </button>
          </div>

          <div className={styles.resourceScroll}>
            {currentSlide && currentSlide.notes.length > 0 && (
              <div className={styles.resourceSection}>
                <h4 className={styles.sectionLabel}>Notes</h4>
                {currentSlide.notes.map((note, nIdx) => (
                  <div key={note.id} className={styles.noteCard}>
                    <div className={styles.comicBadge}>
                      <span>{nIdx % 2 === 0 ? '⚡ PRO-TIP' : '💬 NOTE'}</span>
                    </div>
                    <p>{note.content}</p>
                  </div>
                ))}
              </div>
            )}

            {currentSlide && currentSlide.resources.length > 0 && (
              <div className={styles.resourceSection}>
                <h4 className={styles.sectionLabel}>Files</h4>
                {currentSlide.resources.map((res) => (
                  <div key={res.id} className={styles.resourceItem}>
                    <span>{getResourceIcon(res.type)}</span>
                    <span className={styles.resName}>{res.name}</span>
                    {res.url && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (res.type === 'image' || res.type === 'video' || res.type === 'audio') {
                            setPreviewResource(res);
                          } else {
                            window.open(res.url, '_blank');
                          }
                        }}
                      >
                        {res.type === 'image' ? 'View' : res.type === 'video' || res.type === 'audio' ? 'Play' : 'Open'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(!currentSlide || (currentSlide.notes.length === 0 && currentSlide.resources.length === 0)) && (
              <div className={styles.emptyResources}>
                <p>No resources for this slide</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewResource && (
        <>
          <div className="overlay" onClick={() => setPreviewResource(null)} />
          <div className="modal" style={{ padding: 'var(--space-4)', maxWidth: '80vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontWeight: 600 }}>{previewResource.name}</span>
              <button className="btn-icon" onClick={() => setPreviewResource(null)}>✕</button>
            </div>
            {previewResource.type === 'image' && (
              <img src={previewResource.url} alt={previewResource.name} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 'var(--radius-md)' }} />
            )}
            {previewResource.type === 'video' && (
              <video controls style={{ maxWidth: '100%', maxHeight: '70vh' }}>
                <source src={previewResource.url} />
              </video>
            )}
            {previewResource.type === 'audio' && (
              <audio controls style={{ width: '100%' }}>
                <source src={previewResource.url} />
              </audio>
            )}
          </div>
        </>
      )}
    </div>
  );
}
