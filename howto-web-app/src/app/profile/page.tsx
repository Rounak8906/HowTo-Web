'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getUserPresentations } from '@/lib/firestore';
import { uploadBytes, ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import type { Presentation } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user, loading, signOut, updateUserProfile, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setNameInput(user.displayName || '');
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    try {
      const data = await getUserPresentations(user.uid);
      setPresentations(data);
    } catch (err) {
      console.warn('Failed to load user presentations:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSaveName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nameInput.trim() || nameInput.trim() === user?.displayName) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await updateUserProfile(nameInput.trim());
      toast.success('Name updated!');
      setIsEditingName(false);
    } catch {
      toast.error('Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5MB');
      return;
    }
    setUploadingPhoto(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      await updateUserProfile(user.displayName, photoURL);
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Failed to update profile photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResettingPassword(true);
    try {
      await resetPassword(user.email);
      toast.success(`Password reset link sent to ${user.email}`);
    } catch {
      toast.error('Failed to send password reset email');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ fontSize: '2rem' }}>⬡</div>
      </div>
    );
  }

  // Calculate live stats
  const totalPresentations = presentations.length;
  const publicCount = presentations.filter((p) => p.visibility === 'public').length;
  const privateCount = presentations.filter((p) => p.visibility === 'private').length;
  const totalForksReceived = presentations.reduce((sum, p) => sum + (p.forkCount || 0), 0);

  return (
    <div className={styles.profilePage}>
      <Navbar />

      {/* Main Content */}
      <main className={styles.main}>
        {/* Profile Card */}
        <div className={styles.profileCard}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} />
              ) : (
                <span>{user.displayName?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <label className={styles.avatarUploadBtn} title="Change profile photo">
              {uploadingPhoto ? '⏳' : '📷'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={uploadingPhoto}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
              />
            </label>
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              {isEditingName ? (
                <form onSubmit={handleSaveName} className={styles.nameEditForm}>
                  <input
                    className={styles.nameInput}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    autoFocus
                    required
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={savingName}>
                    {savingName ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setIsEditingName(false);
                      setNameInput(user.displayName || '');
                    }}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <h1 className={styles.userName}>{user.displayName}</h1>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsEditingName(true)}
                    title="Edit Name"
                    style={{ fontSize: '12px' }}
                  >
                    ✎ Edit
                  </button>
                </>
              )}
            </div>

            <p className={styles.userEmail}>
              <span>✉</span> {user.email}
              <span className={styles.roleBadge}>✓ Verified Creator</span>
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => router.push('/dashboard')}
              >
                📑 View Presentations
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <h2 className={styles.sectionTitle}>Presentation Stats</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>📑</span>
              <span className={styles.statValue}>
                {loadingData ? '—' : totalPresentations}
              </span>
              <span className={styles.statLabel}>Total Decks</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statIcon}>🌎</span>
              <span className={styles.statValue}>
                {loadingData ? '—' : publicCount}
              </span>
              <span className={styles.statLabel}>Public Presentations</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statIcon}>🔒</span>
              <span className={styles.statValue}>
                {loadingData ? '—' : privateCount}
              </span>
              <span className={styles.statLabel}>Private Presentations</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statIcon}>🍴</span>
              <span className={styles.statValue}>
                {loadingData ? '—' : totalForksReceived}
              </span>
              <span className={styles.statLabel}>Forks Received</span>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div>
          <h2 className={styles.sectionTitle}>Account & Preferences</h2>
          <div className={styles.settingsCard}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <h4>Interface Theme</h4>
                <p>Switch between light and dark mode appearance</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={toggleTheme}>
                {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </button>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <h4>Password Security</h4>
                <p>Send a secure password reset link to your email</p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handlePasswordReset}
                disabled={resettingPassword}
              >
                {resettingPassword ? 'Sending...' : '🔑 Reset Password'}
              </button>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <h4>Member Since</h4>
                <p>Your HowTo-Web platform account registration date</p>
              </div>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {user.createdAt ? formatDate(user.createdAt) : 'Active User'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
