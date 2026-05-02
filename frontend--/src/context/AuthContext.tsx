import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  getAuth as getAuthFromApp,
} from 'firebase/auth';
import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import { auth, db, firebaseInitError } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserRole = 'admin' | 'student' | 'faculty';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  year?: string;
  yearLevel?: string | number;
  photoURL?: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const secondaryApp =
  getApps().find((app) => app.name === 'signup-user-creator') ||
  initializeApp(firebaseConfig, 'signup-user-creator');

const secondaryAuth = getAuthFromApp(secondaryApp);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set persistence to local storage
  useEffect(() => {
    if (firebaseInitError) {
      console.error(firebaseInitError);
      setError(firebaseInitError.message);
      setIsLoading(false);
      return;
    }

    setPersistence(auth!, browserLocalPersistence).catch((err) => {
      console.error('Error setting persistence:', err);
    });
  }, []);

  // Helper function to determine user role from email
  const getUserRoleFromEmail = (email: string): UserRole => {
    if (email.includes('admin')) return 'admin';
    if (email.includes('faculty')) return 'faculty';
    return 'student';
  };

  // Listen for auth state changes
  useEffect(() => {
    if (firebaseInitError) {
      return;
    }

    let userDocUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth!, (currentUser) => {
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      try {
        if (currentUser) {
          setFirebaseUser(currentUser);
          // Create basic user from Firebase Auth (don't wait for Firestore)
          const basicUser: User = {
            id: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email || '',
            role: getUserRoleFromEmail(currentUser.email || ''),
            photoURL: currentUser.photoURL || undefined,
          };
          setUser(basicUser);
          
          // Fetch full user data from Firestore in background (non-blocking)
          if (db) {
            getDoc(doc(db, 'users', currentUser.uid))
              .then((userDoc) => {
                if (userDoc.exists()) {
                  const userData = userDoc.data() as User;
                  setUser(userData); // Update with full Firestore data
                }
              })
              .catch((err) => {
                console.warn('Failed to load Firestore user profile:', err);
              });
          }
        } else {
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError('Authentication error');
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      // Demo bypass for local quick-login (DEV only)
      const bypassDemo = String(import.meta.env.VITE_BYPASS_AUTH_DEMO ?? 'true').toLowerCase() !== 'false';
      const isDev = Boolean(import.meta.env.DEV);
      if (isDev && bypassDemo) {
        console.log('[AUTH] Demo bypass active - setting fake user for', email);
        const signedInEmail = email || '';
        const detectedRole = getUserRoleFromEmail(signedInEmail);
        const fakeFirebaseUser = { uid: signedInEmail, email: signedInEmail, displayName: signedInEmail.split('@')[0] } as any;
        setFirebaseUser(fakeFirebaseUser);
        const fallbackUser: User = {
          id: signedInEmail,
          name: fakeFirebaseUser.displayName || signedInEmail.split('@')[0] || 'User',
          email: signedInEmail,
          role: detectedRole,
        };
        setUser(fallbackUser);
        return;
      }

      if (firebaseInitError) {
        throw firebaseInitError;
      }

      console.log('[AUTH] Attempting login for:', email);
      
      const result = await signInWithEmailAndPassword(auth!, email.trim(), password);
      console.log('[AUTH] Login successful for:', email, 'UID:', result.user.uid);
      
      const signedInEmail = result.user.email || '';
      const detectedRole = getUserRoleFromEmail(signedInEmail);
      console.log('[AUTH] Detected role from email:', detectedRole);

      if (db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', result.user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            console.log('[AUTH] Found Firestore user doc, using stored data:', userData);
            setUser(userData);
            return;
          } else {
            console.log('[AUTH] No Firestore user doc found, using fallback');
          }
        } catch (dbErr) {
          console.warn('[AUTH] Error fetching Firestore doc:', dbErr);
        }
      }

      const fallbackUser: User = {
        id: result.user.uid,
        name: result.user.displayName || signedInEmail.split('@')[0] || 'User',
        email: signedInEmail,
        role: detectedRole,
        photoURL: result.user.photoURL || undefined,
      };
      console.log('[AUTH] Setting fallback user with role:', fallbackUser.role);
      setUser(fallbackUser);
    } catch (err: any) {
      const errorCode = err?.code || '';
      const errorMessage = err?.message || 'Login failed';
      console.error('[AUTH] Login error - Code:', errorCode, 'Message:', errorMessage, 'Full error:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<void> => {
    try {
      setError(null);
      if (firebaseInitError) {
        throw firebaseInitError;
      }

      if (!db) {
        throw new Error('Database is not initialized');
      }

      const normalizedEmail = email.trim().toLowerCase();
      const result = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, password);
      
      // Create user document in Firestore
      const newUser: User = {
        id: result.user.uid,
        name: name.trim(),
        email: normalizedEmail,
        role,
      };
      
      await setDoc(doc(db, 'users', result.user.uid), newUser);

      // Ensure account creation does not alter the active app session.
      await firebaseSignOut(secondaryAuth);
    } catch (err: any) {
      const errorMessage = err.message || 'Signup failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      if (firebaseInitError) {
        throw firebaseInitError;
      }

      await firebaseSignOut(auth!);
      setUser(null);
      setFirebaseUser(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Logout failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
