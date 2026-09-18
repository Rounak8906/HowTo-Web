'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getUserPresentations, createPresentation, deletePresentation, updatePresentation } from '@/lib/firestore';
import type { Presentation } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadPresentations();
    }
  }, [user]);

  const loadPresentations = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getUserPresentations(user.uid);
      setPresentations(data);
    } catch (err) {
      console.error('Failed to load presentations:', err);
      toast.error('Failed to load presentations');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered presentations based on search
  const filteredPresentations = useMemo(() => {
    if (!searchQuery.trim()) return presentations;
    const q = searchQuery.toLowerCase();
    return presentations.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [presentations, searchQuery]);

  const handleCreate = async () => {
    if (!user || !newTitle.trim()) return;
    setCreating(true);
    try {
      const pres = await createPresentation(user.uid, user.displayName, user.photoURL, {
        title: newTitle.trim(),
      });
      toast.success('Presentation created!');
      router.push(`/editor/${pres.id}`);
    } catch (err) {
      toast.error('Failed to create presentation');
    } finally {
      setCreating(false);
      setShowCreateModal(false);
      setNewTitle('');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this presentation?')) return;
    try {
      await deletePresentation(id);
      setPresentations((prev) => prev.filter((p) => p.id !== id));
      toast.success('Presentation deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleVisibility = async (pres: Presentation) => {
    const newVisibility = pres.visibility === 'public' ? 'private' : 'public';
    try {
      await updatePresentation(pres.id, { visibility: newVisibility });
      setPresentations((prev) =>
        prev.map((p) => (p.id === pres.id ? { ...p, visibility: newVisibility } : p))
      );
      toast.success(`Now ${newVisibility}`);
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  if (loading || !user) {
    return (
      <div className={styles.loadingPage}>
        <div className="animate-spin" style={{ fontSize: '2rem' }}>⬡</div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <Navbar />

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.pageTitle}>Workspace</h1>
            <p className={styles.pageSubtitle}>
              {presentations.length} presentation{presentations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10m-5-5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Presentation
          </button>
        </div>

        {/* Search Bar */}
        {presentations.length > 0 && (
          <div className={styles.searchBar}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search presentations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className={styles.grid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${styles.card} skeleton`} style={{ height: 200 }} />
            ))}
          </div>
        ) : filteredPresentations.length === 0 && !searchQuery ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📑</div>
            <h3>No presentations yet</h3>
            <p>Create your first presentation to get started</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create Presentation
            </button>
          </div>
        ) : filteredPresentations.length === 0 && searchQuery ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3>No results found</h3>
            <p>Try a different search term</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredPresentations.map((pres, index) => (
              <div
                key={pres.id}
                className={styles.card}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* 16:9 Live Preview Thumbnail */}
                <div
                  className={styles.cardThumbnail}
                  onClick={() => router.push(`/editor/${pres.id}`)}
                  style={{
                    background: pres.slides[0]?.background?.value || 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                  }}
                  title={`Open ${pres.title} in Studio Editor`}
                >
                  <div className={styles.thumbElementsWrapper}>
                    {pres.slides[0]?.elements.slice(0, 5).map((el) => (
                      <div
                        key={el.id}
                        className={styles.thumbMiniElement}
                        style={{
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          width: `${el.width}%`,
                          height: `${el.height}%`,
                          background: el.type === 'text' ? 'rgba(255, 255, 255, 0.45)' : (el.type === 'code' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(99, 102, 241, 0.5)'),
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </div>
                  <span className={styles.thumbPlayBadge}>▶</span>
                </div>

                <div className={styles.cardTop}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{pres.title}</h3>
                    <div className={styles.menuWrapper}>
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === pres.id ? null : pres.id);
                        }}
                        aria-label="More options"
                      >
                        ⋯
                      </button>
                      {menuOpenId === pres.id && (
                        <div className={styles.menu}>
                          <button onClick={() => { router.push(`/editor/${pres.id}`); setMenuOpenId(null); }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => { router.push(`/present/${pres.id}`); setMenuOpenId(null); }}>
                            ▶️ Present
                          </button>
                          <button onClick={() => { toggleVisibility(pres); setMenuOpenId(null); }}>
                            {pres.visibility === 'public' ? '🔒 Make Private' : '🌎 Make Public'}
                          </button>
                          {pres.visibility === 'public' && (
                            <button onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/view/${pres.id}`);
                              toast.success('Link copied!');
                              setMenuOpenId(null);
                            }}>
                              🔗 Copy Link
                            </button>
                          )}
                          <button
                            className={styles.menuDanger}
                            onClick={() => { handleDelete(pres.id); setMenuOpenId(null); }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardBadges}>
                    <span className={`badge ${pres.visibility === 'public' ? 'badge-emerald' : 'badge-amber'}`}>
                      {pres.visibility === 'public' ? '🌎 Public' : '🔒 Private'}
                    </span>
                    {pres.forkOf && (
                      <span className="badge badge-violet">🍴 Fork</span>
                    )}
                    {pres.forkCount > 0 && (
                      <span className="badge badge-blue">
                        🍴 {pres.forkCount} fork{pres.forkCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.cardBottom}>
                  <span className={styles.cardMeta}>
                    {pres.slides.length} slide{pres.slides.length !== 1 ? 's' : ''} • v{pres.version}
                  </span>
                  <span className={styles.cardMeta}>
                    {formatDate(pres.updatedAt)}
                  </span>
                </div>

                <div className={styles.cardActions}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => router.push(`/editor/${pres.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => router.push(`/present/${pres.id}`)}
                  >
                    ▶ Present
                  </button>
                </div>

                {pres.forkOf && (
                  <div className={styles.forkInfo}>
                    Forked from <strong>{pres.forkOf.originalOwnerName}</strong>&apos;s {pres.forkOf.originalTitle}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <>
          <div className="overlay" onClick={() => setShowCreateModal(false)} />
          <div className="modal" style={{ padding: 'var(--space-8)', width: 440 }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
              New Presentation
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
            >
              <div>
                <label htmlFor="presTitle" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', display: 'block' }}>
                  Title
                </label>
                <input
                  id="presTitle"
                  className="input"
                  placeholder="My Awesome Presentation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating || !newTitle.trim()}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Click outside to close menu */}
      {menuOpenId && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          onClick={() => setMenuOpenId(null)}
        />
      )}
    </div>
  );
}
