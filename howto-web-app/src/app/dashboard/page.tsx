'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserPresentations,
  createPresentation,
  deletePresentation,
  updatePresentation,
  forkPresentation,
} from '@/lib/firestore';
import type { Presentation } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Logo from '@/components/ui/Logo';
import DevelopedByButton from '@/components/ui/DevelopedByButton';
import HangingNavBar from '@/components/HangingNavBar';
import Link from 'next/link';
import {
  Search,
  Plus,
  Play,
  Edit3,
  Eye,
  MoreVertical,
  Globe,
  Lock,
  GitFork,
  Star,
  Layers,
  User,
  Copy,
  Trash2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVisibility, setNewVisibility] = useState<'public' | 'private'>('public');
  const [creating, setCreating] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteModalPres, setDeleteModalPres] = useState<Presentation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [forkingId, setForkingId] = useState<string | null>(null);

  const handleForkPresentation = async (pres: Presentation) => {
    if (!user) return;
    setForkingId(pres.id);
    try {
      const forked = await forkPresentation(
        pres.id,
        user.uid,
        user.displayName || 'Creator',
        user.photoURL,
        user.username
      );
      toast.success('Fork created! Opening editor...');
      router.push(`/editor/${forked.id}`);
    } catch (err: any) {
      console.error('Failed to fork presentation:', err);
      toast.error(err?.message || 'Failed to fork presentation');
    } finally {
      setForkingId(null);
    }
  };

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'public' | 'private' | 'forked'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'slides' | 'likes'>('updated');

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
    } catch {
      toast.error('Failed to load presentations');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered and Sorted presentations
  const displayedPresentations = useMemo(() => {
    let list = [...presentations];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Filter by type
    if (typeFilter === 'public') {
      list = list.filter((p) => p.visibility === 'public');
    } else if (typeFilter === 'private') {
      list = list.filter((p) => p.visibility !== 'public');
    } else if (typeFilter === 'forked') {
      list = list.filter((p) => !!p.forkOf);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'slides') {
        return (b.slides?.length || 0) - (a.slides?.length || 0);
      }
      if (sortBy === 'likes') {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      // default: updated
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    return list;
  }, [presentations, searchQuery, typeFilter, sortBy]);

  const handleCreate = async () => {
    if (!user || !newTitle.trim()) return;
    setCreating(true);
    try {
      const pres = await createPresentation(
        user.uid,
        user.displayName || 'Creator',
        user.photoURL,
        {
          title: newTitle.trim(),
          visibility: newVisibility,
        },
        user.username
      );
      toast.success('Presentation created!');
      router.push(`/editor/${pres.id}`);
    } catch (err) {
      toast.error('Failed to create presentation');
    } finally {
      setCreating(false);
      setShowCreateModal(false);
      setNewTitle('');
      setNewVisibility('public');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalPres) return;
    const presId = deleteModalPres.id;
    const presTitle = deleteModalPres.title;
    setIsDeleting(true);
    try {
      await deletePresentation(presId);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(`pres_${presId}_cache`);
        } catch {}
      }
      setPresentations((prev) => prev.filter((p) => p.id !== presId));
      toast.success(`Deleted "${presTitle}"`);
      setDeleteModalPres(null);
    } catch (err) {
      console.error('Failed to delete presentation:', err);
      toast.error('Failed to delete presentation');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleVisibility = async (pres: Presentation) => {
    const newVisibility = pres.visibility === 'public' ? 'private' : 'public';
    // Optimistic UI update
    setPresentations((prev) =>
      prev.map((p) => (p.id === pres.id ? { ...p, visibility: newVisibility } : p))
    );
    try {
      await updatePresentation(pres.id, { visibility: newVisibility });
      toast.success(
        newVisibility === 'public'
          ? 'Presentation is now Public 🌐 (Visible to everyone)'
          : 'Presentation is now Private 🔒 (Visible only to you)'
      );
    } catch (err) {
      // Revert on failure
      setPresentations((prev) =>
        prev.map((p) => (p.id === pres.id ? { ...p, visibility: pres.visibility } : p))
      );
      toast.error('Failed to update visibility');
    }
  };

  const handleCopyLink = (presId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/view/${presId}`;
    navigator.clipboard.writeText(url);
    toast.success('Public presentation link copied!');
  };

  const networkLabel =
    user?.role === 'teacher'
      ? 'Teachers Network'
      : user?.role === 'learner'
      ? 'Learners Network'
      : 'Creator Network';

  const userRoleIcon =
    user?.role === 'teacher' ? '🎓' : user?.role === 'learner' ? '📚' : '💡';

  if (loading || !user) {
    return (
      <div className={styles.loadingPage}>
        <div className="spinner" />
        <div>Loading workspace...</div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* ─── Top Branding Header ─── */}
      <header className={styles.topHeader}>
        <Link href="/home" className={styles.logoSection}>
          <Logo size={34} style={{ borderRadius: 9, boxShadow: '0 4px 14px rgba(167, 139, 250, 0.35)' }} />
          <div className={styles.brandTitle}>HowTo-Web</div>
        </Link>

        <div className={styles.headerRight}>
          <DevelopedByButton />
          <div className={styles.headerTag}>
            <span style={{ marginRight: 5 }}>{userRoleIcon}</span>
            {networkLabel}
          </div>

          <Link href="/profile" className={styles.topProfilePill} title="Account & Profile">
            <div className={styles.topProfileAvatar}>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Profile'}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
              )}
            </div>
            <span className={styles.topProfileName}>{user.displayName || 'Profile'}</span>
            <User size={13} style={{ opacity: 0.6 }} />
          </Link>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className={styles.main}>
        {/* Workspace Title & Stats */}
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.pageTitle}>
              <Layers size={26} style={{ color: '#818cf8' }} />
              Presentations &amp; Workspace
            </h1>
            <p className={styles.pageSubtitle}>
              {presentations.length} presentation{presentations.length === 1 ? '' : 's'} created • Manage, present, and collaborate
            </p>
          </div>

          <button
            className={styles.newPresBtn}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            <span>New Presentation</span>
          </button>
        </div>

        {/* ─── GitHub-Style Controls & Filter Bar ─── */}
        <div className={styles.controlsBar}>
          <div className={styles.searchAndFilters}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>
                <Search size={15} />
              </span>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Find a presentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.typeFilterPills}>
              <button
                type="button"
                className={`${styles.typePill} ${typeFilter === 'all' ? styles.typePillActive : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`${styles.typePill} ${typeFilter === 'public' ? styles.typePillActive : ''}`}
                onClick={() => setTypeFilter('public')}
              >
                Public
              </button>
              <button
                type="button"
                className={`${styles.typePill} ${typeFilter === 'private' ? styles.typePillActive : ''}`}
                onClick={() => setTypeFilter('private')}
              >
                Private
              </button>
              <button
                type="button"
                className={`${styles.typePill} ${typeFilter === 'forked' ? styles.typePillActive : ''}`}
                onClick={() => setTypeFilter('forked')}
              >
                Forked
              </button>
            </div>
          </div>

          <div className={styles.sortAndAction}>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="updated">Sort: Last updated</option>
              <option value="title">Sort: Name (A-Z)</option>
              <option value="slides">Sort: Slide count</option>
              <option value="likes">Sort: Most liked</option>
            </select>
          </div>
        </div>

        {/* ─── Loading Skeleton ─── */}
        {isLoading && (
          <div className={styles.repoList}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        )}

        {/* ─── Empty State ─── */}
        {!isLoading && displayedPresentations.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📑</div>
            <h3>
              {searchQuery || typeFilter !== 'all'
                ? 'No matching presentations found'
                : 'No presentations yet'}
            </h3>
            <p>
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your search query or filter pills to find what you need.'
                : 'Create your first presentation to get started.'}
            </p>
            <button
              className={styles.newPresBtn}
              onClick={() => {
                if (searchQuery || typeFilter !== 'all') {
                  setSearchQuery('');
                  setTypeFilter('all');
                } else {
                  setShowCreateModal(true);
                }
              }}
            >
              {searchQuery || typeFilter !== 'all' ? 'Reset Filters' : '+ New Presentation'}
            </button>
          </div>
        )}

        {/* ─── Horizontal Presentation List ─── */}
        {!isLoading && displayedPresentations.length > 0 && (
          <div className={styles.repoList}>
            {displayedPresentations.map((pres) => {
              const isPublic = pres.visibility === 'public';
              const slideCount = pres.slides?.length || 0;
              const likesCount = pres.likesCount || 0;
              const forkCount = pres.forkCount || 0;

              return (
                <article key={pres.id} className={styles.repoCard}>
                  {/* Left Section: Thumbnail Preview + Info */}
                  <div className={styles.repoLeft}>
                    {/* Compact 16:9 Thumbnail */}
                    <div
                      className={styles.repoThumb}
                      onClick={() => router.push(`/editor/${pres.id}`)}
                      style={{
                        background:
                          pres.slides?.[0]?.background?.value ||
                          'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                      }}
                      title={`Open "${pres.title}" in Studio Editor`}
                    >
                      <div className={styles.thumbElementsWrapper}>
                        {pres.slides?.[0]?.elements?.slice(0, 4).map((el) => (
                          <div
                            key={el.id}
                            className={styles.thumbMiniElement}
                            style={{
                              left: `${el.x}%`,
                              top: `${el.y}%`,
                              width: `${el.width}%`,
                              height: `${el.height}%`,
                              background:
                                el.type === 'text'
                                  ? 'rgba(255, 255, 255, 0.45)'
                                  : el.type === 'code'
                                  ? 'rgba(56, 189, 248, 0.45)'
                                  : 'rgba(99, 102, 241, 0.55)',
                              borderRadius: 2,
                            }}
                          />
                        ))}
                      </div>
                      <div className={styles.thumbPlayOverlay}>
                        <Play size={16} fill="#ffffff" />
                      </div>
                    </div>

                    {/* Presentation Details */}
                    <div className={styles.repoDetails}>
                      <div className={styles.repoTitleRow}>
                        <Link
                          href={`/editor/${pres.id}`}
                          className={styles.repoTitleLink}
                          title={pres.title}
                        >
                          {pres.title}
                        </Link>

                        {isPublic ? (
                          <button
                            type="button"
                            className={styles.badgePublicBtn}
                            onClick={() => toggleVisibility(pres)}
                            title="Public presentation • Click to make Private"
                          >
                            <Globe size={11} />
                            Public
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.badgePrivateBtn}
                            onClick={() => toggleVisibility(pres)}
                            title="Private presentation • Click to make Public"
                          >
                            <Lock size={11} />
                            Private
                          </button>
                        )}

                        {pres.forkOf && (
                          <span className={styles.badgeFork}>
                            <GitFork size={11} />
                            Fork
                          </span>
                        )}

                        <span className={styles.badgeVersion}>
                          v{pres.version || 1}
                        </span>
                      </div>

                      {/* Prominent Forked from indicator */}
                      {pres.forkOf && (
                        <div className={styles.forkedFromRow}>
                          <GitFork size={12} style={{ color: '#a855f7', flexShrink: 0 }} />
                          <span>
                            Forked from{' '}
                            <Link
                              href={`/view/${pres.forkOf.originalId}`}
                              className={styles.forkSourceLink}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {pres.forkOf.originalOwnerUsername || pres.forkOf.originalOwnerName}/{pres.forkOf.originalTitle || 'original'}
                            </Link>
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      {pres.description ? (
                        <p className={styles.repoDesc} title={pres.description}>
                          {pres.description}
                        </p>
                      ) : (
                        <p className={styles.repoDescEmpty}>
                          No description provided.
                        </p>
                      )}

                      {/* Metadata Row (GitHub style) */}
                      <div className={styles.repoMetaRow}>
                        <span className={styles.metaItem}>
                          <Layers size={13} style={{ color: '#818cf8' }} />
                          <span>{slideCount} slide{slideCount === 1 ? '' : 's'}</span>
                        </span>

                        <span className={styles.metaItem}>
                          <Star size={13} style={{ color: '#fbbf24' }} />
                          <span>{likesCount} like{likesCount === 1 ? '' : 's'}</span>
                        </span>

                        {forkCount > 0 && (
                          <span className={styles.metaItem}>
                            <GitFork size={13} style={{ color: '#c084fc' }} />
                            <span>{forkCount} fork{forkCount === 1 ? '' : 's'}</span>
                          </span>
                        )}

                        <span className={styles.metaItem}>
                          <Clock size={13} />
                          <span>Updated {formatDate(pres.updatedAt || pres.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Action Buttons */}
                  <div className={styles.repoRight}>
                    {/* Visibility Toggle Button */}
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${isPublic ? styles.makePrivateBtn : styles.makePublicBtn}`}
                      onClick={() => toggleVisibility(pres)}
                      title={
                        isPublic
                          ? 'Make this presentation private (only visible to you)'
                          : 'Make this presentation public (visible to everyone)'
                      }
                    >
                      {isPublic ? (
                        <>
                          <Lock size={13} />
                          <span>Make Private</span>
                        </>
                      ) : (
                        <>
                          <Globe size={13} />
                          <span>Make Public</span>
                        </>
                      )}
                    </button>

                    <button
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      onClick={() => router.push(`/editor/${pres.id}`)}
                      title="Edit presentation in Studio"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    {/* Fork Button */}
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.forkBtn}`}
                      onClick={() => handleForkPresentation(pres)}
                      title="Fork presentation (creates your own editable copy)"
                      disabled={forkingId === pres.id}
                    >
                      <GitFork size={13} />
                      <span>{forkingId === pres.id ? 'Forking...' : 'Fork'}</span>
                    </button>

                    <button
                      className={`${styles.actionBtn} ${styles.presentBtn}`}
                      onClick={() => router.push(`/present/${pres.id}`)}
                      title="Launch presentation in Presenter Mode"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Present</span>
                    </button>

                    {isPublic && (
                      <button
                        className={`${styles.actionBtn} ${styles.viewBtn}`}
                        onClick={() => router.push(`/view/${pres.id}`)}
                        title="View presentation in public mode"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                    )}

                    {/* Quick Delete Button */}
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => setDeleteModalPres(pres)}
                      title="Delete this presentation"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>

                    {/* Context Menu (⋯) */}
                    <div className={styles.moreMenuWrapper}>
                      <button
                        type="button"
                        className={styles.moreBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === pres.id ? null : pres.id);
                        }}
                        aria-label="More actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {menuOpenId === pres.id && (
                        <div className={styles.dropdownMenu}>
                          <button
                            type="button"
                            className={styles.dropdownItem}
                            onClick={() => {
                              toggleVisibility(pres);
                              setMenuOpenId(null);
                            }}
                          >
                            {isPublic ? <Lock size={14} /> : <Globe size={14} />}
                            <span>{isPublic ? 'Make Private' : 'Make Public'}</span>
                          </button>

                          <button
                            type="button"
                            className={styles.dropdownItem}
                            onClick={() => {
                              handleForkPresentation(pres);
                              setMenuOpenId(null);
                            }}
                          >
                            <GitFork size={14} />
                            <span>Fork / Duplicate</span>
                          </button>

                          {isPublic && (
                            <button
                              type="button"
                              className={styles.dropdownItem}
                              onClick={(e) => {
                                handleCopyLink(pres.id, e);
                                setMenuOpenId(null);
                              }}
                            >
                              <Copy size={14} />
                              <span>Copy Public Link</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                            onClick={() => {
                              setDeleteModalPres(pres);
                              setMenuOpenId(null);
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Delete Presentation</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Click outside to close dropdown menu */}
      {menuOpenId && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setMenuOpenId(null)}
        />
      )}

      {/* ─── Delete Presentation Confirmation Modal ─── */}
      {deleteModalPres && (
        <>
          <div
            className={styles.deleteModalOverlay}
            onClick={() => {
              if (!isDeleting) setDeleteModalPres(null);
            }}
          />
          <div className={styles.deleteModalContent}>
            <div className={styles.deleteModalHeader}>
              <div className={styles.deleteIconBadge}>
                <Trash2 size={20} />
              </div>
              <div>
                <h2 className={styles.deleteModalTitle}>Delete Presentation?</h2>
              </div>
            </div>

            <p className={styles.deleteModalBody}>
              Are you sure you want to delete{' '}
              <span className={styles.deletePresNameHighlight}>
                {deleteModalPres.title}
              </span>
              ? This presentation, all of its slides, interactive blocks, and resources will be permanently removed. This action cannot be undone.
            </p>

            <div className={styles.deleteModalActions}>
              <button
                type="button"
                className={styles.deleteCancelBtn}
                onClick={() => setDeleteModalPres(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmBtn}
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                <Trash2 size={14} />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Presentation'}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── Create Presentation Modal ─── */}
      {showCreateModal && (
        <>
          <div className="overlay" onClick={() => setShowCreateModal(false)} />
          <div className="modal" style={{ padding: '32px', width: 480 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Create New Presentation
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
              A presentation contains all your slides, contextual resources, and code.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
            >
              <div style={{ marginBottom: '18px' }}>
                <label
                  htmlFor="presTitle"
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#cbd5e1',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  Presentation Title
                </label>
                <input
                  id="presTitle"
                  className="input"
                  placeholder="e.g. machine-learning-deep-dive"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#cbd5e1',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  Visibility
                </label>
                <div className={styles.visibilitySelector}>
                  <button
                    type="button"
                    className={`${styles.visOption} ${newVisibility === 'public' ? styles.visOptionSelected : ''}`}
                    onClick={() => setNewVisibility('public')}
                  >
                    <div className={styles.visOptionTitle}>
                      <Globe size={15} style={{ color: '#34d399' }} />
                      <span>Public</span>
                    </div>
                    <div className={styles.visOptionDesc}>
                      Visible to everyone in Explore &amp; Search. Anyone can view and fork.
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`${styles.visOption} ${newVisibility === 'private' ? styles.visOptionSelected : ''}`}
                    onClick={() => setNewVisibility('private')}
                  >
                    <div className={styles.visOptionTitle}>
                      <Lock size={15} style={{ color: '#fbbf24' }} />
                      <span>Private</span>
                    </div>
                    <div className={styles.visOptionDesc}>
                      Only you can view and edit this presentation. You can make it public anytime.
                    </div>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
                  {creating ? 'Creating...' : 'Create Presentation'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Hanging Bottom Navigation Bar */}
      <HangingNavBar activeTab="workspace" />
    </div>
  );
}
