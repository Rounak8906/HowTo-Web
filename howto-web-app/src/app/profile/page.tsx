'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getUserPresentations } from '@/lib/firestore';
import TechGridBackground from '@/components/ui/TechGridBackground';
import HangingNavBar from '@/components/HangingNavBar';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
  Edit2,
  Check,
  X,
  Layers,
  Globe,
  Sparkles,
  Users,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { ROLE_INFO } from '@/lib/types';
import toast from 'react-hot-toast';
import styles from './profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, signOut, updateUserProfile, changeUsername, setUserRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [totalPresentations, setTotalPresentations] = useState(0);
  const [publicPresentations, setPublicPresentations] = useState(0);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setNameInput(user.displayName || '');
      setUsernameInput(user.username || '');
      getUserPresentations(user.uid).then((items) => {
        setTotalPresentations(items.length);
        setPublicPresentations(items.filter((p) => p.visibility === 'public').length);
      });
    }
  }, [user]);

  const handleSelectRole = async (newRole: UserRole) => {
    setIsSavingRole(true);
    try {
      const res = await setUserRole(newRole);
      if (res.success) {
        toast.success(`Switched network role to ${ROLE_INFO[newRole].title}!`);
      } else {
        toast.error(res.error || 'Failed to update network role');
      }
    } catch {
      toast.error('Failed to update network role');
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setIsSavingName(true);
    try {
      await updateUserProfile(nameInput.trim());
      toast.success('Display name updated');
      setIsEditingName(false);
    } catch {
      toast.error('Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSaveUsername = async () => {
    const clean = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean || clean.length < 3) {
      toast.error('Username must be at least 3 characters (e.g. @abc123)');
      return;
    }
    setIsSavingUsername(true);
    try {
      const res = await changeUsername(`@${clean}`);
      if (res.success) {
        toast.success(`Username updated to @${clean}`);
        setIsEditingUsername(false);
      } else {
        toast.error(res.error || 'Failed to update username');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error updating username');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  if (loading || !user) {
    return (
      <div className={styles.profileContainer} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 14 }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      {/* ─── Tech Grid Ambient Background (Subtle Techy Matrix & Data Traces) ─── */}
      <TechGridBackground />

      <main className={styles.mainWrapper}>
        {/* Top Header Navigation */}
        <div className={styles.topNavRow}>
          <Link href="/home" className={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Home</span>
          </Link>
          <h1 className={styles.pageHeading}>Profile & Account</h1>
          <div style={{ width: 80 }} /> {/* balance spacer */}
        </div>

        {/* Core Profile Card */}
        <section className={styles.profileCard}>
          <div className={styles.userHeader}>
            <div className={styles.avatarLargeWrapper}>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User Avatar'}
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatarInitial}>
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className={styles.userInfo}>
              <div className={styles.displayNameRow}>
                {isEditingName ? (
                  <div>
                    <input
                      type="text"
                      className={styles.editNameInput}
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Your full name"
                      autoFocus
                    />
                    <div className={styles.nameActionBtns}>
                      <button
                        className={styles.saveBtn}
                        onClick={handleSaveName}
                        disabled={isSavingName}
                      >
                        <Check size={12} style={{ marginRight: 4 }} />
                        Save
                      </button>
                      <button
                        className={styles.cancelBtn}
                        onClick={() => {
                          setNameInput(user.displayName || '');
                          setIsEditingName(false);
                        }}
                      >
                        <X size={12} style={{ marginRight: 4 }} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className={styles.displayName}>
                      {user.displayName || 'Creator'}
                    </h2>
                    <button
                      className={styles.editToggleBtn}
                      onClick={() => setIsEditingName(true)}
                      title="Edit display name"
                    >
                      <Edit2 size={14} />
                    </button>
                  </>
                )}
                <span className={styles.badge}>
                  <span>{(ROLE_INFO[user.role || 'teacher'] || ROLE_INFO.teacher).icon}</span>
                  <span style={{ marginLeft: 4 }}>{(ROLE_INFO[user.role || 'teacher'] || ROLE_INFO.teacher).title}</span>
                </span>
                <span className={styles.badge} style={{ borderColor: 'rgba(251, 191, 36, 0.45)', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.12)' }}>
                  ⭐ {user.creatorScore || 0} pts
                </span>
              </div>

              {/* Creator Handle (@username) Row */}
              <div className={styles.usernameRow}>
                {isEditingUsername ? (
                  <div className={styles.editUsernameGroup}>
                    <div className={styles.editUsernameWrapper}>
                      <span className={styles.atSymbol}>@</span>
                      <input
                        type="text"
                        className={styles.editUsernameInput}
                        value={usernameInput.startsWith('@') ? usernameInput.slice(1) : usernameInput}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                          setUsernameInput(val ? `@${val}` : '');
                        }}
                        placeholder="username (e.g. abc123)"
                        autoFocus
                      />
                    </div>
                    <div className={styles.nameActionBtns}>
                      <button
                        className={styles.saveBtn}
                        onClick={handleSaveUsername}
                        disabled={isSavingUsername}
                      >
                        <Check size={12} style={{ marginRight: 4 }} />
                        {isSavingUsername ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        className={styles.cancelBtn}
                        onClick={() => {
                          setUsernameInput(user.username || '');
                          setIsEditingUsername(false);
                        }}
                      >
                        <X size={12} style={{ marginRight: 4 }} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.usernameDisplayWrapper}>
                    <span className={styles.usernameBadge}>
                      {user.username || `@user_${user.uid.slice(0, 5)}`}
                    </span>
                    <button
                      className={styles.editToggleBtn}
                      onClick={() => {
                        setUsernameInput(user.username || '');
                        setIsEditingUsername(true);
                      }}
                      title="Edit handle (@username)"
                    >
                      <Edit2 size={13} />
                      <span style={{ fontSize: 12, marginLeft: 5 }}>Change Handle</span>
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.userEmail}>
                <Mail size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: -1 }} />
                {user.email || 'Anonymous / Guest'}
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{totalPresentations}</span>
              <span className={styles.statLabel}>
                <Layers size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                Total Presentations
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{publicPresentations}</span>
              <span className={styles.statLabel}>
                <Globe size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                Public Presentations
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{(user.following || []).length}</span>
              <span className={styles.statLabel}>
                <Users size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -1, color: '#818cf8' }} />
                Following
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue} style={{ color: '#fbbf24' }}>{user.creatorScore || 0}</span>
              <span className={styles.statLabel}>
                <Sparkles size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -1, color: '#fbbf24' }} />
                Creator Score (pts)
              </span>
            </div>
          </div>
        </section>

        {/* ─── Creator Score & Points Card ─── */}
        <section className={styles.scoreCard}>
          <div className={styles.scoreHeaderRow}>
            <div>
              <h3 className={styles.cardSectionTitle} style={{ marginBottom: 4 }}>
                Creator Score &amp; Activity Points
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>
                Earn points when other community members follow you, or fork/like your public presentations.
              </p>
            </div>
            <div className={styles.scoreHeroValue}>
              <span className={styles.scoreNumber}>{user.creatorScore || 0}</span>
              <span className={styles.scoreUnit}>points</span>
            </div>
          </div>

          <div className={styles.scoreBreakdownGrid}>
            <div className={styles.scoreBreakdownItem}>
              <div className={styles.scoreItemIcon}>👥</div>
              <div className={styles.scoreItemMeta}>
                <div className={styles.scoreItemTitle}>{(user.followers || []).length} Followers</div>
                <div className={styles.scoreItemSubtitle}>+15 pts per follower on the platform</div>
              </div>
              <span className={styles.scoreItemPts}>+{(user.followers || []).length * 15} pts</span>
            </div>

            <div className={styles.scoreBreakdownItem}>
              <div className={styles.scoreItemIcon}>❤️</div>
              <div className={styles.scoreItemMeta}>
                <div className={styles.scoreItemTitle}>{user.likesReceived || 0} Likes Received</div>
                <div className={styles.scoreItemSubtitle}>+10 pts per like on your slides</div>
              </div>
              <span className={styles.scoreItemPts}>+{(user.likesReceived || 0) * 10} pts</span>
            </div>

            <div className={styles.scoreBreakdownItem}>
              <div className={styles.scoreItemIcon}>🍴</div>
              <div className={styles.scoreItemMeta}>
                <div className={styles.scoreItemTitle}>{user.forksReceived || 0} Forks Received</div>
                <div className={styles.scoreItemSubtitle}>+25 pts when someone forks your work</div>
              </div>
              <span className={styles.scoreItemPts}>+{(user.forksReceived || 0) * 25} pts</span>
            </div>

            <div className={styles.scoreBreakdownItem}>
              <div className={styles.scoreItemIcon}>🏆</div>
              <div className={styles.scoreItemMeta}>
                <div className={styles.scoreItemTitle}>Community Standing</div>
                <div className={styles.scoreItemSubtitle}>
                  {(user.creatorScore || 0) >= 100 ? 'Master Contributor' : (user.creatorScore || 0) > 0 ? 'Rising Creator' : 'New Contributor'}
                </div>
              </div>
              <span className={styles.scoreItemPts} style={{ color: '#a78bfa' }}>Active</span>
            </div>
          </div>
        </section>

        {/* ─── Network Role & Identity Selection Card ─── */}
        <section className={styles.settingsCard}>
          <h3 className={styles.cardSectionTitle} style={{ marginBottom: 4 }}>
            Network Role &amp; Identity
          </h3>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
            Determine whether you are a <strong>Teacher</strong>, <strong>Learner</strong>, or <strong>Creator</strong>. Your choice changes your identity badge and switches your home network branding to <em>Teachers Network</em>, <em>Learners Network</em>, or <em>Creator Network</em>.
          </p>

          <div className={styles.roleCardsGrid}>
            {(['teacher', 'learner', 'creator'] as const).map((r) => {
              const info = ROLE_INFO[r];
              const isSelected = (user.role || 'teacher') === r;
              return (
                <button
                  key={r}
                  type="button"
                  disabled={isSavingRole}
                  className={`${styles.roleCard} ${isSelected ? styles.roleCardActive : ''}`}
                  onClick={() => handleSelectRole(r)}
                >
                  {isSelected && (
                    <div className={styles.roleActiveCheck}>✓</div>
                  )}
                  <div className={styles.roleIconBadge}>{info.icon}</div>
                  <div className={styles.roleTitle}>{info.title}</div>
                  <div className={styles.roleNetworkName}>{info.network}</div>
                  <div className={styles.roleDesc}>{info.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Preferences & Settings Card */}
        <section className={styles.settingsCard}>
          <h3 className={styles.cardSectionTitle}>Preferences</h3>

          <div className={styles.settingRow}>
            <div className={styles.settingLeft}>
              <div className={styles.settingIcon}>
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <div className={styles.settingTitle}>Appearance Mode</div>
                <div className={styles.settingDesc}>
                  Currently using {theme === 'dark' ? 'Dark theme' : 'Light theme'}
                </div>
              </div>
            </div>

            <button className={styles.themeToggleBtn} onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
            </button>
          </div>
        </section>

        {/* Sign Out Card */}
        <section className={styles.logoutCard}>
          <div>
            <div className={styles.logoutInfoTitle}>Session & Security</div>
            <div className={styles.logoutInfoDesc}>
              Log out of your HowTo-Web creator session on this device.
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleSignOut}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </section>
      </main>

      {/* ─── Hanging Bottom Navigation Bar (Point 1 Access) ─── */}
      <HangingNavBar activeTab="profile" />
    </div>
  );
}
