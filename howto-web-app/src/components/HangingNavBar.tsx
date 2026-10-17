'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPublicPresentations } from '@/lib/firestore';
import type { Presentation } from '@/lib/types';
import {
  Home,
  Search,
  LayoutGrid,
  PencilLine,
  User as UserIcon,
  Sun,
  Moon,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './hangingNavbar.module.css';

interface HangingNavBarProps {
  activeTab?: 'home' | 'search' | 'workspace' | 'draw' | 'profile';
  onSearchSelect?: (pres: Presentation) => void;
}

export default function HangingNavBar({
  activeTab = 'home',
  onSearchSelect,
}: HangingNavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Presentation[]>([]);
  const [allPublic, setAllPublic] = useState<Presentation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close profile popup on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  // Fetch public presentations when search opens
  useEffect(() => {
    if (isSearchOpen) {
      setIsSearching(true);
      getPublicPresentations().then((list) => {
        setAllPublic(list);
        setIsSearching(false);
      });
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Filter search results
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(allPublic);
    } else {
      const q = searchQuery.toLowerCase();
      setSearchResults(
        allPublic.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            (p.ownerName && p.ownerName.toLowerCase().includes(q))
        )
      );
    }
  }, [searchQuery, allPublic]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const isCurrentActive = (tab: string) => {
    if (activeTab === tab) return true;
    if (tab === 'home' && pathname === '/home') return true;
    if (tab === 'search' && pathname === '/search') return true;
    if (tab === 'workspace' && pathname === '/dashboard') return true;
    if (tab === 'draw' && pathname === '/draw') return true;
    if (tab === 'profile' && pathname === '/profile') return true;
    return false;
  };

  return (
    <div className={styles.navWrapper}>
      {/* ─── Profile Popover Card (Instagram style) ─── */}
      {isProfileOpen && (
        <div ref={profileRef} className={styles.profilePopup}>
          <div className={styles.profileHeader}>
            <div className={styles.profileAvatarLarge}>
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>{(user?.displayName || user?.email || 'U')[0].toUpperCase()}</span>
              )}
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>
                {user?.displayName || 'Creator'}
              </div>
              {user?.username && (
                <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600 }}>
                  {user.username}
                </div>
              )}
              <div className={styles.profileEmail}>
                {user?.email || 'Logged In'}
              </div>
            </div>
          </div>

          <div className={styles.profileActions}>
            <button
              className={styles.profileBtn}
              onClick={() => {
                setIsProfileOpen(false);
                router.push('/profile');
              }}
            >
              <UserIcon size={16} />
              <span>My Profile</span>
            </button>

            <button
              className={styles.profileBtn}
              onClick={() => {
                setIsProfileOpen(false);
                router.push('/dashboard');
              }}
            >
              <LayoutGrid size={16} />
              <span>My Workspace</span>
            </button>

            <button
              className={styles.profileBtn}
              onClick={() => {
                toggleTheme();
              }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
            </button>

            <button
              className={`${styles.profileBtn} ${styles.profileBtnDanger}`}
              onClick={handleSignOut}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Hanging Floating Bottom Pill Bar (Instagram 5-Tab Bar) ─── */}
      <nav className={styles.hangingBar} aria-label="Main Navigation">
        {/* 1. HOME */}
        <button
          className={`${styles.navItem} ${isCurrentActive('home') ? styles.navItemActive : ''}`}
          onClick={() => {
            setIsProfileOpen(false);
            router.push('/home');
          }}
          title="Home"
        >
          <div className={styles.iconWrapper}>
            <Home
              size={22}
              strokeWidth={isCurrentActive('home') ? 2.5 : 1.8}
            />
          </div>
          {isCurrentActive('home') && <span className={styles.activeDot} />}
          <span className={styles.tooltip}>Home</span>
        </button>

        {/* 2. SEARCH */}
        <button
          className={`${styles.navItem} ${isCurrentActive('search') ? styles.navItemActive : ''}`}
          onClick={() => {
            setIsProfileOpen(false);
            router.push('/search');
          }}
          title="Search Creators"
        >
          <div className={styles.iconWrapper}>
            <Search
              size={22}
              strokeWidth={isCurrentActive('search') ? 2.5 : 1.8}
            />
          </div>
          {isCurrentActive('search') && <span className={styles.activeDot} />}
          <span className={styles.tooltip}>Search</span>
        </button>

        {/* 3. WORKSPACE */}
        <button
          className={`${styles.navItem} ${isCurrentActive('workspace') ? styles.navItemActive : ''}`}
          onClick={() => {
            setIsProfileOpen(false);
            router.push('/dashboard');
          }}
          title="Workspace"
        >
          <div className={styles.iconWrapper}>
            <LayoutGrid
              size={22}
              strokeWidth={isCurrentActive('workspace') ? 2.5 : 1.8}
            />
          </div>
          {isCurrentActive('workspace') && <span className={styles.activeDot} />}
          <span className={styles.tooltip}>Workspace</span>
        </button>

        {/* 4. EXCALI DRAW */}
        <button
          className={`${styles.navItem} ${isCurrentActive('draw') ? styles.navItemActive : ''}`}
          onClick={() => {
            setIsProfileOpen(false);
            router.push('/draw');
          }}
          title="Excali Draw"
        >
          <div className={styles.iconWrapper}>
            <PencilLine
              size={22}
              strokeWidth={isCurrentActive('draw') ? 2.5 : 1.8}
            />
          </div>
          {isCurrentActive('draw') && <span className={styles.activeDot} />}
          <span className={styles.tooltip}>Excali Draw</span>
        </button>

        {/* 5. PROFILE (Access Point 1: Nav Bar) */}
        <button
          className={`${styles.navItem} ${isCurrentActive('profile') ? styles.navItemActive : ''}`}
          onClick={() => router.push('/profile')}
          title="Profile"
        >
          <div
            className={`${styles.avatarRing} ${
              isCurrentActive('profile') ? styles.avatarRingActive : ''
            }`}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className={styles.avatarImg}
              />
            ) : (
              <div className={styles.avatarFallback}>
                {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          {isCurrentActive('profile') && (
            <span className={styles.activeDot} />
          )}
          <span className={styles.tooltip}>Profile</span>
        </button>
      </nav>

      {/* ─── Search Modal Overlay ─── */}
      {isSearchOpen && (
        <div
          className={styles.searchBackdrop}
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className={styles.searchBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.searchInputRow}>
              <Search size={18} className={styles.searchIcon} />
              <input
                ref={searchInputRef}
                className={styles.searchInput}
                type="text"
                placeholder="Search public presentations by title or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className={styles.searchCloseBtn}
                onClick={() => setIsSearchOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.searchResultsList}>
              {isSearching ? (
                <div className={styles.searchEmpty}>Loading public presentations...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((pres) => (
                  <div
                    key={pres.id}
                    className={styles.searchResultItem}
                    onClick={() => {
                      setIsSearchOpen(false);
                      if (onSearchSelect) {
                        onSearchSelect(pres);
                      } else {
                        router.push(`/view/${pres.id}`);
                      }
                    }}
                  >
                    <div>
                      <div className={styles.searchResultTitle}>{pres.title}</div>
                      <div className={styles.searchResultCreator}>
                        by {pres.ownerName || 'Creator'} • {pres.slides?.length || 0} slides
                      </div>
                    </div>
                    <ExternalLink size={14} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                  </div>
                ))
              ) : (
                <div className={styles.searchEmpty}>
                  {searchQuery.trim()
                    ? `No public presentations found matching "${searchQuery}"`
                    : 'No public presentations published yet.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
