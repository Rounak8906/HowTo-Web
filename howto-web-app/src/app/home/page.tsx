'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPresentations, createPresentation } from '@/lib/firestore';
import type { Presentation } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import styles from './home.module.css';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

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
    } finally {
      setIsLoading(false);
    }
  };

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

  // Stats
  const totalPresentations = presentations.length;
  const publicCount = presentations.filter((p) => p.visibility === 'public').length;
  const privateCount = presentations.filter((p) => p.visibility === 'private').length;
  const totalSlides = presentations.reduce((sum, p) => sum + (p.slides?.length || 0), 0);

  // Recent 5
  const recentPresentations = useMemo(() => {
    return [...presentations]
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 5);
  }, [presentations]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ fontSize: '2rem' }}>⬡</div>
      </div>
    );
  }

  const firstName = user.displayName?.split(' ')[0] || 'Creator';

  return (
    <div className={styles.homePage}>
      <Navbar />

      <main className={styles.main}>
        {/* Welcome Banner */}
        <div className={styles.welcomeBanner}>
          <div className={styles.welcomeInfo}>
            <h1>
              Welcome back, <span>{firstName}</span> 👋
            </h1>
            <p>
              Your presentation hub. Create, manage, and share your decks — all in one place.
            </p>
          </div>
          <div className={styles.welcomeActions}>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10m-5-5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              New Presentation
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => router.push('/dashboard')}
            >
              View All
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📑</span>
            <span className={styles.statValue}>{isLoading ? '—' : totalPresentations}</span>
            <span className={styles.statLabel}>Total Decks</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🌎</span>
            <span className={styles.statValue}>{isLoading ? '—' : publicCount}</span>
            <span className={styles.statLabel}>Public</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🔒</span>
            <span className={styles.statValue}>{isLoading ? '—' : privateCount}</span>
            <span className={styles.statLabel}>Private</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🎞</span>
            <span className={styles.statValue}>{isLoading ? '—' : totalSlides}</span>
            <span className={styles.statLabel}>Total Slides</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <div className={styles.quickActionCard} onClick={() => setShowCreateModal(true)}>
            <span className={styles.quickActionIcon}>✨</span>
            <h3>Create Presentation</h3>
            <p>Start from a blank canvas</p>
          </div>
          <div className={styles.quickActionCard} onClick={() => router.push('/dashboard')}>
            <span className={styles.quickActionIcon}>📂</span>
            <h3>Open Workspace</h3>
            <p>Browse all your presentations</p>
          </div>
          <div className={styles.quickActionCard} onClick={() => router.push('/profile')}>
            <span className={styles.quickActionIcon}>⚙️</span>
            <h3>Account Settings</h3>
            <p>Update profile & preferences</p>
          </div>
        </div>

        {/* Recent Presentations */}
        <div className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Presentations</h2>
            {presentations.length > 5 && (
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')}>
                View all →
              </button>
            )}
          </div>

          {isLoading ? (
            <div className={styles.recentGrid}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={`${styles.recentCard} skeleton`} style={{ height: 120 }} />
              ))}
            </div>
          ) : recentPresentations.length === 0 ? (
            <div className={styles.emptyRecent}>
              <h3>No presentations yet</h3>
              <p>Create your first presentation to see it here</p>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                Create Presentation
              </button>
            </div>
          ) : (
            <div className={styles.recentGrid}>
              {recentPresentations.map((pres) => (
                <div
                  key={pres.id}
                  className={styles.recentCard}
                  onClick={() => router.push(`/editor/${pres.id}`)}
                >
                  <div className={styles.recentCardTitle}>{pres.title}</div>
                  <div className={styles.recentCardMeta}>
                    <span>
                      {pres.slides.length} slide{pres.slides.length !== 1 ? 's' : ''}
                    </span>
                    <span>{formatDate(pres.updatedAt)}</span>
                  </div>
                  <div className={styles.recentCardMeta}>
                    <span className={`badge ${pres.visibility === 'public' ? 'badge-emerald' : 'badge-amber'}`}>
                      {pres.visibility === 'public' ? '🌎 Public' : '🔒 Private'}
                    </span>
                  </div>
                  <div className={styles.recentCardActions}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/editor/${pres.id}`);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/present/${pres.id}`);
                      }}
                    >
                      ▶ Present
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
                <label
                  htmlFor="presTitle"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-2)',
                    display: 'block',
                  }}
                >
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
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  marginTop: 'var(--space-6)',
                  justifyContent: 'flex-end',
                }}
              >
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
    </div>
  );
}
