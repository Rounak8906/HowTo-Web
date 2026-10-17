'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { normalizeUsername, updateUserUsername, updateUserRole, toggleFollowUser } from '@/lib/firestore';
import type { User, UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, username?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string | null) => Promise<void>;
  changeUsername: (newUsername: string) => Promise<{ success: boolean; error?: string }>;
  setUserRole: (role: UserRole) => Promise<{ success: boolean; error?: string }>;
  toggleFollow: (targetUserId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync or create Firestore user doc
  const syncUserDoc = useCallback(async (fbUser: FirebaseUser, customUsername?: string) => {
    const userRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      let finalUsername = customUsername ? normalizeUsername(customUsername) : '';
      if (!finalUsername) {
        const base = (fbUser.displayName || fbUser.email?.split('@')[0] || 'user')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');
        finalUsername = `@${base || 'user'}_${fbUser.uid.slice(0, 4)}`;
      }

      const userData: User = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || 'Anonymous',
        username: finalUsername,
        email: fbUser.email || '',
        photoURL: fbUser.photoURL,
        role: 'teacher',
        creatorScore: 0,
        likesReceived: 0,
        forksReceived: 0,
        following: [],
        followers: [],
        createdAt: Date.now(),
      };
      await setDoc(userRef, userData);
      setUser(userData);
    } else {
      const data = userSnap.data() as User;
      let needsUpdate = false;
      const updates: Partial<User> = {};
      if (!data.username) {
        const base = (data.displayName || data.email?.split('@')[0] || 'user')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');
        data.username = `@${base || 'user'}_${data.uid.slice(0, 4)}`;
        updates.username = data.username;
        needsUpdate = true;
      }
      if (!data.role) {
        data.role = 'teacher';
        updates.role = 'teacher';
        needsUpdate = true;
      }
      if (data.creatorScore === undefined) {
        data.creatorScore = 0;
        updates.creatorScore = 0;
        needsUpdate = true;
      }
      if (!data.following) {
        data.following = [];
      }
      if (!data.followers) {
        data.followers = [];
      }
      if (needsUpdate) {
        await setDoc(userRef, updates, { merge: true });
      }
      setUser(data);
    }
  }, []);

  // Handle redirect result on mount (for mobile Google sign-in)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await syncUserDoc(result.user);
        }
      })
      .catch((err) => {
        // Redirect error is non-critical, user just stays on login page
        console.warn('Redirect result error:', err);
      });
  }, [syncUserDoc]);

  useEffect(() => {
    try {
      const savedGuest = localStorage.getItem('howto_guest_user');
      if (savedGuest) {
        const parsed = JSON.parse(savedGuest);
        if (parsed.displayName === 'Demo Presenter' || parsed.email === 'demo@howtoweb.dev') {
          parsed.displayName = 'Creator';
          parsed.email = 'creator@howtoweb.dev';
          localStorage.setItem('howto_guest_user', JSON.stringify(parsed));
        }
        setUser(parsed);
      }
    } catch {}

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          await syncUserDoc(fbUser);
        } catch (err) {
          console.error('Failed to sync user doc:', err);
        }
      } else {
        const savedGuest = localStorage.getItem('howto_guest_user');
        if (savedGuest) {
          try {
            const parsed = JSON.parse(savedGuest);
            if (parsed.displayName === 'Demo Presenter' || parsed.email === 'demo@howtoweb.dev') {
              parsed.displayName = 'Creator';
              parsed.email = 'creator@howtoweb.dev';
              localStorage.setItem('howto_guest_user', JSON.stringify(parsed));
            }
            setUser(parsed);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserDoc]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string, username?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await syncUserDoc(cred.user, username);
  };

  // Robust Google sign-in: try popup first, fall back to redirect
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (popupError: unknown) {
      const code = (popupError as { code?: string })?.code;
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw popupError;
      }
    }
  };

  const signInAsGuest = async () => {
    const guestUser: User = {
      uid: 'guest-user',
      displayName: 'Creator',
      username: '@creator',
      email: 'creator@howtoweb.dev',
      photoURL: null,
      createdAt: Date.now(),
    };
    setUser(guestUser);
    try {
      localStorage.setItem('howto_guest_user', JSON.stringify(guestUser));
    } catch {}
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('howto_guest_user');
    } catch {}
    await firebaseSignOut(auth).catch(() => {});
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (displayName: string, photoURL?: string | null) => {
    if (!firebaseUser) throw new Error('Not authenticated');
    await updateProfile(firebaseUser, {
      displayName,
      ...(photoURL !== undefined ? { photoURL } : {}),
    });
    const userRef = doc(db, 'users', firebaseUser.uid);
    const updated = {
      ...(user || { uid: firebaseUser.uid, email: firebaseUser.email || '', createdAt: Date.now() }),
      displayName,
      ...(photoURL !== undefined ? { photoURL } : {}),
    };
    await setDoc(userRef, updated, { merge: true });
    setUser(updated as User);
  };

  const changeUsername = async (newUsername: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    const res = await updateUserUsername(user.uid, newUsername);
    if (res.success) {
      const norm = normalizeUsername(newUsername);
      setUser((prev) => (prev ? { ...prev, username: norm } : null));
    }
    return res;
  };

  const setUserRole = async (role: UserRole) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    const res = await updateUserRole(user.uid, role);
    if (res.success) {
      setUser((prev) => (prev ? { ...prev, role } : null));
    }
    return res;
  };

  const toggleFollow = async (targetUserId: string): Promise<boolean> => {
    if (!user) throw new Error('Please sign in to follow creators');
    if (user.uid === targetUserId) throw new Error('You cannot follow yourself');

    const isCurrentlyFollowing = (user.following || []).includes(targetUserId);
    const nextFollowing = isCurrentlyFollowing
      ? (user.following || []).filter((id) => id !== targetUserId)
      : [...(user.following || []), targetUserId];

    // Optimistic local update
    setUser((prev) =>
      prev
        ? {
            ...prev,
            following: nextFollowing,
            followingCount: Math.max(
              0,
              (prev.followingCount || (prev.following || []).length) +
                (isCurrentlyFollowing ? -1 : 1)
            ),
          }
        : null
    );

    try {
      const res = await toggleFollowUser(user.uid, targetUserId);
      return res.following;
    } catch (err) {
      console.error('Failed to toggle follow:', err);
      // Revert optimistic update
      setUser((prev) => (prev ? { ...prev, following: user.following || [] } : null));
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInAsGuest,
        signOut,
        resetPassword,
        updateUserProfile,
        changeUsername,
        setUserRole,
        toggleFollow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
