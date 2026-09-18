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
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync or create Firestore user doc
  const syncUserDoc = useCallback(async (fbUser: FirebaseUser) => {
    const userRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const userData: User = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || 'Anonymous',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL,
        createdAt: Date.now(),
      };
      await setDoc(userRef, userData);
      setUser(userData);
    } else {
      setUser(userSnap.data() as User);
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

  const signUp = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await syncUserDoc(cred.user);
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
