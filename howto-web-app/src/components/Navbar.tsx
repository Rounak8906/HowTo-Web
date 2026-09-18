'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './navbar.module.css';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;

  const navItems = [
    { label: 'Home', icon: '🏠', path: '/home' },
    { label: 'Workspace', icon: '📑', path: '/dashboard' },
    { label: 'Profile', icon: '👤', path: '/profile' },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>
        <div className={styles.logo} onClick={() => router.push('/home')}>
          <img src="/favicon.png" alt="HowTo-Web" className={styles.logoImg} />
          <span className={styles.logoText}>HowTo-Web</span>
        </div>

        <div className={styles.navLinks}>
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`${styles.navLink} ${pathname === item.path ? styles.navLinkActive : ''}`}
              onClick={() => router.push(item.path)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.navRight}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          type="button"
        >
          <span className="theme-toggle-icon">
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
        </button>

        <div
          className={styles.userChip}
          onClick={() => router.push('/profile')}
          title="View Profile"
        >
          <div className={styles.avatar}>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} />
            ) : (
              <span>{user.displayName?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>
          <span className={styles.userName}>{user.displayName}</span>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={signOut}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}
