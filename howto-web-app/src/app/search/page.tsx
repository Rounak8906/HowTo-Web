'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  searchUsersByUsername,
  getFollowedUsers,
  getPublicPresentationsByUserId,
  forkPresentation,
} from '@/lib/firestore';
import type { User, Presentation, UserRole } from '@/lib/types';
import { ROLE_INFO } from '@/lib/types';
import SearchRadarBackground from '@/components/ui/SearchRadarBackground';
import HangingNavBar from '@/components/HangingNavBar';
import Logo from '@/components/ui/Logo';
import DevelopedByButton from '@/components/ui/DevelopedByButton';
import Hero09 from '@/components/ui/hero-09';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Users,
  UserCheck,
  UserPlus,
  Check,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Share2,
  GitFork,
  Compass,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './search.module.css';

export default function SearchPage() {
  const router = useRouter();
  const { user, toggleFollow } = useAuth();

  const [query, setQuery] = useState('');
  const [creators, setCreators] = useState<User[]>([]);
  const [followedCreators, setFollowedCreators] = useState<User[]>([]);
  const [isLoadingFollowed, setIsLoadingFollowed] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | UserRole>('all');
  const [forkingId, setForkingId] = useState<string | null>(null);

  // Map of creatorId -> array of public presentations
  const [expandedCreatorId, setExpandedCreatorId] = useState<string | null>(null);
  const [creatorPresentations, setCreatorPresentations] = useState<{
    [userId: string]: Presentation[];
  }>({});
  const [loadingPresFor, setLoadingPresFor] = useState<string | null>(null);

  // Load followed creators when user is available
  useEffect(() => {
    if (user?.uid) {
      setIsLoadingFollowed(true);
      getFollowedUsers(user.uid)
        .then((list) => {
          setFollowedCreators(list);
        })
        .finally(() => {
          setIsLoadingFollowed(false);
        });
    } else {
      setFollowedCreators([]);
      setIsLoadingFollowed(false);
    }
  }, [user?.uid]);

  // Search logic
  const handlePerformSearch = useCallback(
    async (searchWord: string) => {
      const trimmed = searchWord.trim();
      if (!trimmed) {
        setCreators([]);
        setHasSearched(false);
        return;
      }

      setIsSearching(true);
      setHasSearched(true);
      try {
        const results = await searchUsersByUsername(trimmed);
        setCreators(results);
      } catch (err) {
        console.error('Search error:', err);
        toast.error('Failed to perform search. Please try again.');
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  // Debounced real-time search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handlePerformSearch(query);
      } else {
        setCreators([]);
        setHasSearched(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, handlePerformSearch]);

  const handleClear = () => {
    setQuery('');
    setCreators([]);
    setHasSearched(false);
  };

  const isFollowingUser = (targetUserId: string) => {
    return Boolean(user?.following?.includes(targetUserId));
  };

  const handleFollowToggle = async (targetCreator: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to follow creators');
      router.push('/login');
      return;
    }

    const isCurrentlyFollowing = isFollowingUser(targetCreator.uid);

    // Optimistically update followedCreators list
    if (isCurrentlyFollowing) {
      setFollowedCreators((prev) => prev.filter((c) => c.uid !== targetCreator.uid));
    } else {
      setFollowedCreators((prev) => [targetCreator, ...prev]);
    }

    try {
      const nowFollowing = await toggleFollow(targetCreator.uid);
      if (nowFollowing) {
        toast.success(
          `Followed ${targetCreator.username || targetCreator.displayName}! Creator awarded +15 pts ⭐`
        );
      } else {
        toast.success(`Unfollowed ${targetCreator.username || targetCreator.displayName}`);
      }
    } catch (err: any) {
      console.error('Follow toggle error:', err);
      toast.error(err?.message || 'Failed to update follow status');
      // Revert optimistic update
      if (isCurrentlyFollowing) {
        setFollowedCreators((prev) => [targetCreator, ...prev]);
      } else {
        setFollowedCreators((prev) => prev.filter((c) => c.uid !== targetCreator.uid));
      }
    }
  };

  const handleToggleCreatorPresentations = async (targetUserId: string) => {
    if (expandedCreatorId === targetUserId) {
      setExpandedCreatorId(null);
      return;
    }

    setExpandedCreatorId(targetUserId);

    // If we already loaded their presentations, no need to re-fetch
    if (creatorPresentations[targetUserId]) return;

    setLoadingPresFor(targetUserId);
    try {
      const list = await getPublicPresentationsByUserId(targetUserId);
      setCreatorPresentations((prev) => ({ ...prev, [targetUserId]: list }));
    } catch (err) {
      console.error('Failed to load user presentations:', err);
      toast.error('Could not load presentations');
    } finally {
      setLoadingPresFor(null);
    }
  };

  const handleForkPresentation = async (pres: Presentation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to fork presentations');
      router.push('/login');
      return;
    }
    setForkingId(pres.id);
    try {
      const forked = await forkPresentation(
        pres.id,
        user.uid,
        user.displayName || 'Creator',
        user.photoURL,
        user.username
      );
      toast.success('Fork created! Creator awarded +25 points ⭐ Opening editor...');
      router.push(`/editor/${forked.id}`);
    } catch (err: any) {
      console.error('Failed to fork presentation:', err);
      toast.error(err?.message || 'Failed to fork presentation');
    } finally {
      setForkingId(null);
    }
  };

  const handleCopyHandle = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(handle);
    toast.success(`Copied handle ${handle} to clipboard!`);
  };

  const handleCopyPresentationLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/view/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Presentation link copied!');
  };

  const baseList = hasSearched ? creators : followedCreators;
  const displayedList =
    selectedRoleFilter === 'all'
      ? baseList
      : baseList.filter((c) => (c.role || 'teacher') === selectedRoleFilter);

  return (
    <div className={styles.searchContainer}>
      {/* ─── Search Constellation & Radar Background ─── */}
      <SearchRadarBackground />

      <main className={styles.mainWrapper}>
        {/* Top Navigation Row */}
        <div className={styles.topNavRow}>
          <Link href={user ? '/home' : '/'} className={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>{user ? 'Home' : 'Overview'}</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <DevelopedByButton />
            {user ? (
              <Link href="/profile" className={styles.profilePill}>
                <div className={styles.profilePillAvatar}>
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
                <span>{user.username || user.displayName || 'My Profile'}</span>
              </Link>
            ) : (
              <Link href="/login" className={styles.profilePill}>
                <span>Sign In / Join</span>
              </Link>
            )}
          </div>
        </div>

        {/* ─── Hero09 Integrated Component ─── */}
        <Hero09
          title="Find Any Creator"
          titleLine2="Across The Knowledge Network."
          description="Search educators, makers, and presenters across the platform by their unique @username or name to explore public decks and collaborate."
          searchPlaceholder="Search by @username (e.g. @abc123) or creator name..."
          searchButtonText={isSearching ? 'Searching...' : 'Search'}
          searchValue={query}
          onSearchChange={(val) => setQuery(val)}
          onSearchSubmit={() => handlePerformSearch(query)}
          onClear={handleClear}
          heroImage="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80"
          heroAlt="Creative workspace and collaborative community"
          bottomTitle="Creators"
          bottomTitleLine2="crafted with purpose."
          bottomText="A curated network where presentations, teaching resources, and collaborative decks come together."
          animation="subtle"
          variant={hasSearched ? 'compact' : 'standard'}
          className="bg-transparent !py-4"
        />

        {/* ─── Search Filters & Quick Navigation ─── */}
        <section className={styles.searchSection}>
          {/* Quick Jump to Followed Creators */}
          {!hasSearched && followedCreators.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.quickFiltersRow}
            >
              <span className={styles.quickFiltersLabel}>Quick jump:</span>
              {followedCreators.slice(0, 6).map((c) => (
                <button
                  key={c.uid}
                  type="button"
                  className={styles.filterChip}
                  onClick={() => {
                    const handle = c.username ? c.username.replace(/^@/, '') : c.displayName;
                    setQuery(handle);
                    handlePerformSearch(handle);
                  }}
                >
                  <Check size={11} style={{ marginRight: 4, color: '#38bdf8' }} />
                  {c.username || c.displayName}
                </button>
              ))}
            </motion.div>
          )}

          {/* Role Filter Chips */}
          <div className={styles.roleFilterRow}>
            <button
              type="button"
              className={`${styles.roleFilterChip} ${selectedRoleFilter === 'all' ? styles.roleFilterChipActive : ''}`}
              onClick={() => setSelectedRoleFilter('all')}
            >
              <Compass size={13} style={{ marginRight: 4 }} />
              All Network
            </button>
            <button
              type="button"
              className={`${styles.roleFilterChip} ${selectedRoleFilter === 'teacher' ? styles.roleFilterChipActive : ''}`}
              onClick={() => setSelectedRoleFilter('teacher')}
            >
              <span>🎓</span>
              <span>Teachers</span>
            </button>
            <button
              type="button"
              className={`${styles.roleFilterChip} ${selectedRoleFilter === 'learner' ? styles.roleFilterChipActive : ''}`}
              onClick={() => setSelectedRoleFilter('learner')}
            >
              <span>📚</span>
              <span>Learners</span>
            </button>
            <button
              type="button"
              className={`${styles.roleFilterChip} ${selectedRoleFilter === 'creator' ? styles.roleFilterChipActive : ''}`}
              onClick={() => setSelectedRoleFilter('creator')}
            >
              <span>💡</span>
              <span>Creators</span>
            </button>
          </div>
        </section>

        {/* ─── Results Header ─── */}
        <div className={styles.resultsHeader}>
          <div className={styles.resultsTitle}>
            {hasSearched ? (
              <>
                <Search size={18} style={{ color: '#818cf8' }} />
                <span>Search Results</span>
              </>
            ) : (
              <>
                <Users size={18} style={{ color: '#818cf8' }} />
                <span>Creators You Follow</span>
              </>
            )}
          </div>
          <div className={styles.resultsCount}>
            {isSearching
              ? 'Searching database...'
              : hasSearched
              ? `${displayedList.length} creator${displayedList.length === 1 ? '' : 's'} found`
              : isLoadingFollowed
              ? 'Loading followed creators...'
              : `${displayedList.length} following`}
          </div>
        </div>

        {/* ─── Loading Spinners ─── */}
        {isSearching && (
          <div className={styles.loadingRow}>
            <div className={styles.spinner} />
            <span>Finding matching creators...</span>
          </div>
        )}

        {!hasSearched && isLoadingFollowed && (
          <div className={styles.loadingRow}>
            <div className={styles.spinner} />
            <span>Loading your followed creators...</span>
          </div>
        )}

        {/* ─── Empty State: No results for search query ─── */}
        {!isSearching && hasSearched && displayedList.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.emptyStateWrapper}
          >
            <div className={styles.emptyStateIcon}>
              <Search size={28} />
            </div>
            <h2 className={styles.emptyTitle}>No Creators Found</h2>
            <p className={styles.emptyDesc}>
              We couldn't find any creator matching &ldquo;
              <strong style={{ color: '#f1f5f9' }}>{query}</strong>&rdquo;
              {selectedRoleFilter !== 'all' ? ` in ${selectedRoleFilter}s network` : ''}.
              Double-check the username handle (e.g.{' '}
              <span style={{ color: '#818cf8' }}>@abc123</span>) or try searching by creator name.
            </p>
            <button
              type="button"
              onClick={handleClear}
              className={styles.signInPromptBtn}
              style={{ marginTop: 16 }}
            >
              <RotateCcw size={14} />
              <span>Clear Search & View Followed</span>
            </button>
          </motion.div>
        )}

        {/* ─── Empty State: Not searching & not following anyone ─── */}
        {!hasSearched && !isLoadingFollowed && displayedList.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.emptyStateWrapper}
          >
            <div className={styles.emptyStateIcon}>
              <UserCheck size={28} />
            </div>
            <h2 className={styles.emptyTitle}>
              {user ? "You're Not Following Any Creators Yet" : 'Sign In to Follow Creators'}
            </h2>
            <p className={styles.emptyDesc}>
              {user
                ? 'Search any creator above by their @username or full name, then click Follow to keep them right here for quick access to their latest presentations!'
                : 'Sign in to your account to follow creators, track their public presentations, and view them all here.'}
            </p>
            {!user && (
              <Link href="/login" className={styles.signInPromptBtn}>
                <UserPlus size={14} />
                <span>Sign In / Create Account</span>
              </Link>
            )}
          </motion.div>
        )}

        {/* ─── Creators Grid ─── */}
        {!isSearching && displayedList.length > 0 && (
          <motion.div
            className={styles.creatorsGrid}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {displayedList.map((creator) => {
              const isExpanded = expandedCreatorId === creator.uid;
              const presList = creatorPresentations[creator.uid] || [];
              const isLoadingPres = loadingPresFor === creator.uid;
              const creatorRole = creator.role || 'teacher';
              const roleInfo = ROLE_INFO[creatorRole] || ROLE_INFO.teacher;
              const isFollowing = isFollowingUser(creator.uid);

              return (
                <article key={creator.uid} className={styles.creatorCard}>
                  <div className={styles.cardTop}>
                    <div className={styles.creatorAvatarWrapper}>
                      {creator.photoURL ? (
                        <img
                          src={creator.photoURL}
                          alt={creator.displayName}
                          className={styles.creatorAvatarImg}
                        />
                      ) : (
                        <div className={styles.creatorAvatarInitial}>
                          {(creator.displayName || creator.email || 'C')[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className={styles.creatorMeta}>
                      <div className={styles.creatorNameRow}>
                        <span className={styles.creatorDisplayName} title={creator.displayName}>
                          {creator.displayName || 'Creator'}
                        </span>
                        <span title="Verified Creator" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <CheckCircle2 size={15} className={styles.verifiedIcon} />
                        </span>
                      </div>

                      <div className={styles.creatorHandleRow}>
                        <span
                          className={styles.usernameHandleBadge}
                          onClick={(e) => handleCopyHandle(creator.username || `@${creator.uid.slice(0, 5)}`, e)}
                          title="Click to copy handle"
                          style={{ cursor: 'pointer' }}
                        >
                          {creator.username || `@${creator.uid.slice(0, 5)}`}
                        </span>
                        <button
                          onClick={(e) => handleCopyHandle(creator.username || `@${creator.uid.slice(0, 5)}`, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: 2,
                            display: 'flex',
                          }}
                          title="Copy @username"
                        >
                          <Copy size={12} />
                        </button>
                      </div>

                      {/* Role & Creator Score Badges */}
                      <div className={styles.creatorBadgesRow}>
                        <span className={styles.creatorRoleBadge} title={`Network Role: ${roleInfo.label}`}>
                          <span>{roleInfo.icon}</span>
                          <span>{roleInfo.label}</span>
                        </span>
                        <span className={styles.creatorScoreBadge} title="Creator Score (boosted by forks & likes)">
                          <span>⭐</span>
                          <span>{creator.creatorScore || 0} pts</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardDivider} />

                  <div className={styles.cardFooterRow}>
                    {/* Follow / Following Toggle Button */}
                    {user && user.uid === creator.uid ? (
                      <span className={styles.selfBadge}>You</span>
                    ) : (
                      <button
                        type="button"
                        className={isFollowing ? styles.followingBtn : styles.followBtn}
                        onClick={(e) => handleFollowToggle(creator, e)}
                        title={isFollowing ? 'Click to unfollow' : 'Follow this creator'}
                      >
                        {isFollowing ? (
                          <>
                            <Check size={13} />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={13} />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      className={styles.expandBtn}
                      onClick={() => handleToggleCreatorPresentations(creator.uid)}
                    >
                      <Layers size={13} style={{ color: '#818cf8' }} />
                      <span>{isExpanded ? 'Hide Work' : 'View Work'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Expanded Public Presentations Drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={styles.presentationsDrawer}
                      >
                        <div className={styles.drawerTitle}>
                          <span>Public Presentations</span>
                          <span style={{ fontSize: 11, color: '#818cf8' }}>
                            {isLoadingPres ? 'Loading...' : `${presList.length} total`}
                          </span>
                        </div>

                        {isLoadingPres && (
                          <div style={{ fontSize: 12, color: '#94a3b8', padding: '10px 0', textAlign: 'center' }}>
                            Fetching creator presentations...
                          </div>
                        )}

                        {!isLoadingPres && presList.length === 0 && (
                          <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', padding: '6px 0' }}>
                            This creator has not published any public presentations yet.
                          </div>
                        )}

                        {!isLoadingPres &&
                          presList.map((p) => (
                            <div key={p.id} className={styles.drawerPresentationCard}>
                              <div className={styles.drawerPresTitle}>{p.title}</div>
                              {p.forkOf && (
                                <div className={styles.drawerForkedFrom}>
                                  <GitFork size={11} style={{ color: '#a855f7', flexShrink: 0 }} />
                                  <span>
                                    Forked from{' '}
                                    <Link
                                      href={`/view/${p.forkOf.originalId}`}
                                      className={styles.drawerForkSourceLink}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {p.forkOf.originalOwnerUsername || p.forkOf.originalOwnerName}/{p.forkOf.originalTitle || 'original'}
                                    </Link>
                                  </span>
                                </div>
                              )}
                              {p.description && (
                                <div className={styles.drawerPresDesc}>{p.description}</div>
                              )}

                              <div className={styles.drawerPresActions}>
                                <span className={styles.slidesCountTag}>
                                  {p.slides?.length || 1} slides
                                </span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <button
                                    type="button"
                                    className={styles.drawerForkBtn}
                                    onClick={(e) => handleForkPresentation(p, e)}
                                    disabled={forkingId === p.id}
                                    title="Fork presentation (+25 pts to creator)"
                                  >
                                    <GitFork size={12} />
                                    <span>{forkingId === p.id ? 'Forking...' : 'Fork'}</span>
                                  </button>

                                  <button
                                    onClick={(e) => handleCopyPresentationLink(p.id, e)}
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      border: '1px solid rgba(255, 255, 255, 0.1)',
                                      borderRadius: 6,
                                      color: '#cbd5e1',
                                      padding: '4px 6px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                    }}
                                    title="Copy Link"
                                  >
                                    <Share2 size={12} />
                                  </button>

                                  <Link
                                    href={`/view/${p.id}`}
                                    className={styles.openPresLink}
                                    target="_blank"
                                  >
                                    <span>Open</span>
                                    <ExternalLink size={12} />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              );
            })}
          </motion.div>
        )}
      </main>

      {/* ─── Hanging Bottom Navigation Bar (Tab 2 Active) ─── */}
      <HangingNavBar activeTab="search" />
    </div>
  );
}
