'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getPublicPresentations, toggleLikePresentation, forkPresentation } from '@/lib/firestore';
import type { Presentation } from '@/lib/types';
import { ROLE_INFO } from '@/lib/types';
import DynamicFlowingBackground from '@/components/ui/DynamicFlowingBackground';
import HangingNavBar from '@/components/HangingNavBar';
import { Sparkles, Globe, ArrowRight, Eye, User, Heart, GitFork } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import DevelopedByButton from '@/components/ui/DevelopedByButton';
import toast from 'react-hot-toast';
import styles from './home.module.css';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [forkingId, setForkingId] = useState<string | null>(null);

  // Protect route
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch real creator public presentations only (NO demo content)
  useEffect(() => {
    const fetchPublic = async () => {
      setIsLoading(true);
      try {
        const list = await getPublicPresentations();
        setPresentations(list);
      } catch (err) {
        console.error('Failed to load public presentations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchPublic();
    }
  }, [user]);

  // Compute dynamic network title based on user's chosen role
  const networkLabel =
    user?.role === 'teacher'
      ? 'Teachers Network'
      : user?.role === 'learner'
      ? 'Learners Network'
      : 'Creator Network';

  const userRoleIcon =
    user?.role === 'teacher' ? '🎓' :
    user?.role === 'learner' ? '📚' :
    '💡';

  // Toggle Like with instant optimistic UI and score change notification
  const handleToggleLike = async (e: React.MouseEvent, presId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    const targetPres = presentations.find((p) => p.id === presId);
    if (!targetPres) return;

    const isCurrentlyLiked = Boolean(targetPres.likedBy?.includes(user.uid));

    // Optimistic UI update
    setPresentations((prev) =>
      prev.map((p) => {
        if (p.id !== presId) return p;
        const currentLikes = p.likedBy || [];
        const nextLiked = isCurrentlyLiked
          ? currentLikes.filter((id) => id !== user.uid)
          : [...currentLikes, user.uid];
        const nextCount = Math.max(0, (p.likesCount || 0) + (isCurrentlyLiked ? -1 : 1));
        return {
          ...p,
          likedBy: nextLiked,
          likesCount: nextCount,
        };
      })
    );

    try {
      const res = await toggleLikePresentation(presId, user.uid);
      if (res.liked) {
        toast.success('Liked! Creator awarded +10 points ⭐', { id: `like-${presId}` });
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      toast.error('Failed to like presentation');
      // Revert optimistic update
      setPresentations((prev) =>
        prev.map((p) => (p.id === presId ? targetPres : p))
      );
    }
  };

  // Fork presentation with instant points notification (+25 pts to original creator)
  const handleFork = async (e: React.MouseEvent, pres: Presentation) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please log in to fork');
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
      toast.success('Forked! Creator awarded +25 points ⭐ Redirecting...');
      router.push(`/editor/${forked.id}`);
    } catch (err) {
      console.error('Failed to fork:', err);
      toast.error('Failed to fork presentation');
    } finally {
      setForkingId(null);
    }
  };

  if (loading || !user) {
    return (
      <div className={styles.homeContainer} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.homeContainer}>
      {/* ─── Dynamic Flowing Wave Lines Background (Autonomous & Touch-Free) ─── */}
      <DynamicFlowingBackground lineCount={30} />

      {/* ─── Top Branding Header ─── */}
      <header className={styles.topHeader}>
        <div className={styles.logoSection}>
          <Logo size={36} style={{ borderRadius: 10, boxShadow: '0 4px 14px rgba(167, 139, 250, 0.35)' }} />
          <div>
            <div className={styles.brandTitle}>HowTo-Web</div>
          </div>
        </div>

        {/* ─── 2nd Access Point to Profile (Top Right) & Dynamic Role Network Tag ─── */}
        <div className={styles.headerRight}>
          <DevelopedByButton />
          <div className={styles.headerTag} title={`Network identity: ${networkLabel}`}>
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
            <User size={14} className={styles.topProfileIcon} />
          </Link>
        </div>
      </header>

      {/* ─── Main Content Section ─── */}
      <main className={styles.mainContent}>
        <div className={styles.sectionHeader}>
          <h1 className={styles.sectionTitle}>
            <Globe size={26} style={{ color: '#818cf8' }} />
            Public Presentations
          </h1>
          <p className={styles.sectionSubtitle}>
            Explore, like, and fork presentations created and shared by community creators.
          </p>
        </div>

        {/* Empty State: Kept completely empty as instructed (NO demo presentations) */}
        {!isLoading && presentations.length === 0 && (
          <div className={styles.emptyStateContainer}>
            <div className={styles.emptyStateIconWrapper}>
              <Sparkles size={28} />
            </div>
            <h2 className={styles.emptyStateTitle}>No Public Presentations Yet</h2>
            <p className={styles.emptyStateDesc}>
              Presentations published publicly by creators will appear right here. 
              Be the first to create and publish a presentation from your workspace!
            </p>
            <Link href="/dashboard" className={styles.emptyStateActionBtn}>
              <span>Open Workspace</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Presentation Cards Grid (rendered only when genuine public presentations exist) */}
        {!isLoading && presentations.length > 0 && (
          <div className={styles.presentationsGrid}>
            {presentations.map((pres) => {
              const isLiked = Boolean(user && pres.likedBy?.includes(user.uid));
              const authorRole = pres.ownerRole || 'teacher';
              const roleInfo = ROLE_INFO[authorRole] || ROLE_INFO.teacher;

              return (
                <div key={pres.id} className={styles.presentationCard}>
                  <div className={styles.cardPreview}>
                    <span className={styles.slideBadge}>
                      {pres.slides?.length || 0} slides
                    </span>
                    <div style={{ opacity: 0.2, fontSize: 48 }}>📊</div>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle} title={pres.title}>
                      {pres.title}
                    </h3>

                    {pres.forkOf && (
                      <div className={styles.forkedFromRow}>
                        <GitFork size={11} style={{ color: '#a855f7', flexShrink: 0 }} />
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

                    <p className={styles.cardDesc}>
                      {pres.description || 'Interactive web presentation with dual-pane 70/30 layout.'}
                    </p>

                    <div className={styles.cardFooter}>
                      <div className={styles.creatorInfo}>
                        <div className={styles.creatorAvatar}>
                          {pres.ownerPhoto ? (
                            <img
                              src={pres.ownerPhoto}
                              alt={pres.ownerName}
                              style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                            />
                          ) : (
                            <span>{(pres.ownerName || 'C')[0].toUpperCase()}</span>
                          )}
                        </div>
                        <span className={styles.creatorName}>
                          {pres.ownerName || 'Community Creator'}
                        </span>
                        <span className={styles.cardAuthorRoleBadge} title={`Role: ${roleInfo.label}`}>
                          <span>{roleInfo.icon}</span>
                          <span>{roleInfo.label}</span>
                        </span>
                      </div>

                      <div className={styles.cardActions}>
                        {/* Like Button with live score boost (+10) */}
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${isLiked ? styles.likedBtn : ''}`}
                          onClick={(e) => handleToggleLike(e, pres.id)}
                          title={isLiked ? 'Unlike' : 'Like (+10 pts to creator)'}
                        >
                          <Heart
                            size={13}
                            fill={isLiked ? '#f43f5e' : 'none'}
                            color={isLiked ? '#f43f5e' : 'currentColor'}
                          />
                          <span>{pres.likesCount || 0}</span>
                        </button>

                        {/* Fork Button with live score boost (+25) */}
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={(e) => handleFork(e, pres)}
                          disabled={forkingId === pres.id}
                          title="Fork presentation (+25 pts to creator)"
                        >
                          <GitFork size={13} />
                          <span>{forkingId === pres.id ? '...' : pres.forkCount || 0}</span>
                        </button>

                        {/* View Presentation Link */}
                        <Link
                          href={`/view/${pres.id}`}
                          className={styles.viewBtn}
                          title="View presentation"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Hanging Bottom Navigation Bar (Point 1 Access at bottom) ─── */}
      <HangingNavBar activeTab="home" />
    </div>
  );
}
