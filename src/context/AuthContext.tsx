import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  runTransaction,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User,
} from '@/lib/firebase';
import { googleAuthErrorMessage, readAuthError } from '@/lib/authErrors';
import type { UserDoc, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  userDoc: UserDoc | null;
  userRole: UserRole;
  userNumber: number | null;
  loading: boolean;
  signIn: (emailOrUsername: string, pass: string) => Promise<void>;
  signUp: (username: string, email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  /** Message from a failed Google redirect sign-in, replayed once the page reloads. */
  startupAuthError: string | null;
  clearStartupAuthError: () => void;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [userNumber, setUserNumber] = useState<number | null>(() => {
    const cached = localStorage.getItem('userNumber');
    return cached ? parseInt(cached, 10) : null;
  });
  const [loading, setLoading] = useState(true);
  const [startupAuthError, setStartupAuthError] = useState<string | null>(null);

  // Backfill or assign sequential user number
  const assignSequentialUserNumber = async (firebaseUser: User, username: string, email: string): Promise<number> => {
    let assigned = 1;
    try {
      const counterRef = doc(db, 'metadata', 'userCounter');
      assigned = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        const currentCount = counterSnap.exists() ? (counterSnap.data().lastAssignedNumber || 0) : 0;
        const nextNumber = currentCount + 1;
        transaction.set(counterRef, {
          lastAssignedNumber: nextNumber,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        const userRef = doc(db, 'users', firebaseUser.uid);
        transaction.set(userRef, {
          userNumber: nextNumber,
          email,
          displayName: username || '',
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        return nextNumber;
      });
    } catch (err) {
      console.warn('Sequential user number transaction error, falling back:', err);
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, { userNumber: assigned, email, displayName: username }, { merge: true });
    }
    return assigned;
  };

  const fetchUserData = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserDoc;
        setUserDoc(data);

        // Check if soft deleted
        if (data.status === 'deleted') {
          await fbSignOut(auth);
          setUser(null);
          setUserDoc(null);
          return;
        }

        // Determine Role (original logic: if username/displayName is 'Bishr', grant admin)
        const isBishr = firebaseUser.displayName?.toLowerCase() === 'bishr';
        const role = data.role || (isBishr ? 'admin' : 'user');
        setUserRole(role);

        // Sequential Number
        if (data.userNumber !== undefined && data.userNumber !== null) {
          setUserNumber(data.userNumber);
          localStorage.setItem('userNumber', data.userNumber.toString());
        } else {
          const newNumber = await assignSequentialUserNumber(
            firebaseUser,
            firebaseUser.displayName || '',
            firebaseUser.email || ''
          );
          setUserNumber(newNumber);
          localStorage.setItem('userNumber', newNumber.toString());
        }
      } else {
        // First-time user creation in Firestore
        const isBishr = firebaseUser.displayName?.toLowerCase() === 'bishr';
        const role: UserRole = isBishr ? 'admin' : 'user';
        const newNumber = await assignSequentialUserNumber(
          firebaseUser,
          firebaseUser.displayName || '',
          firebaseUser.email || ''
        );
        setUserNumber(newNumber);
        localStorage.setItem('userNumber', newNumber.toString());
        setUserRole(role);

        const newDoc: UserDoc = {
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          userNumber: newNumber,
          role,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newDoc, { merge: true });
        setUserDoc(newDoc);
      }
    } catch (err) {
      console.error('Error fetching user data from Firestore:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          await fetchUserData(currentUser);
        } else {
          setUserDoc(null);
          setUserRole('user');
          setUserNumber(null);
          localStorage.removeItem('userNumber');
        }
      } catch (err) {
        console.error('Error handling auth state change:', err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // A Google sign-in that fell back to a redirect lands back here on a fresh page
  // load; surface its failure once so the login screen can explain what happened.
  useEffect(() => {
    let active = true;
    getRedirectResult(auth)
      .catch((err: unknown) => {
        console.warn('Google redirect sign-in failed:', err);
        if (active) setStartupAuthError(googleAuthErrorMessage(err));
      });
    return () => {
      active = false;
    };
  }, []);

  const clearStartupAuthError = () => setStartupAuthError(null);

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  const signIn = async (emailOrUsername: string, pass: string) => {
    const trimmed = emailOrUsername.trim();
    let targetEmail = trimmed;

    // If input does not contain '@', look up email by displayName/username in Firestore
    if (!trimmed.includes('@')) {
      if (!db) {
        throw new Error('Database is unavailable. Please log in using your email address.');
      }
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('displayName', '==', trimmed));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const found = snap.docs[0].data()?.email;
        if (found) {
          targetEmail = found;
        }
      } else {
        // Fallback: search case-insensitively across registered users
        const allUsersSnap = await getDocs(usersRef);
        const matched = allUsersSnap.docs.find((d) => {
          const data = d.data();
          const dName = data?.displayName?.toString().toLowerCase();
          const uName = data?.username?.toString().toLowerCase();
          const search = trimmed.toLowerCase();
          return dName === search || uName === search;
        });

        if (matched && matched.data()?.email) {
          targetEmail = matched.data().email;
        } else {
          throw new Error('No account found with this username. Please verify your username or use your email.');
        }
      }
    }

    await signInWithEmailAndPassword(auth, targetEmail, pass);
  };

  const signUp = async (username: string, email: string, pass: string) => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (db) {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(usersRef);
      const isTaken = snap.docs.some((d) => {
        const data = d.data();
        const dName = data?.displayName?.toString().toLowerCase();
        const uName = data?.username?.toString().toLowerCase();
        return dName === trimmedUsername.toLowerCase() || uName === trimmedUsername.toLowerCase();
      });
      if (isTaken) {
        throw new Error('This username is already taken. Please choose a different one.');
      }
    }

    const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
    if (cred.user) {
      await fbUpdateProfile(cred.user, { displayName: trimmedUsername });
      await fetchUserData(cred.user);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Let people pick the account instead of silently reusing the last one.
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const { code } = readAuthError(err);
      // Pop-ups are blocked in some embedded/PWA contexts; a redirect is the
      // supported fallback there. Every other failure is surfaced to the caller.
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw err;
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setUserDoc(null);
    setUserRole('user');
    setUserNumber(null);
    const keysToClear = [
      'habits',
      'tasks',
      'playlists',
      'pomodoroStats',
      'pomodoroSettings',
      'motivationalSettings',
      'userLevel',
      'userXP',
      'spentXP',
      'unlockedItems',
      'activeAvatar',
      'activeBorder',
      'friendsList',
      'financeData',
      'userNumber',
      'dailyBounties',
      'bountyStats',
    ];
    keysToClear.forEach((k) => localStorage.removeItem(k));
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    if (!user) return;
    const trimmedName = displayName.trim();
    const isDataUriOrLong = !!photoURL && (photoURL.startsWith('data:') || photoURL.length > 1000);

    // Firebase Auth throws (auth/invalid-profile-attribute) when photoURL is a data URI or >2048 chars.
    // Data URIs are persisted directly to Firestore userDoc.profilePicUrl. Only valid web URLs are sent to Firebase Auth.
    try {
      if (isDataUriOrLong) {
        await fbUpdateProfile(user, { displayName: trimmedName });
      } else if (photoURL !== undefined) {
        await fbUpdateProfile(user, { displayName: trimmedName, photoURL: photoURL || '' });
      } else {
        await fbUpdateProfile(user, { displayName: trimmedName });
      }
    } catch (authErr) {
      console.warn('Firebase auth updateProfile warning:', authErr);
    }

    if (db) {
      const userRef = doc(db, 'users', user.uid);
      const updateData: { displayName: string; profilePicUrl?: string | null } = {
        displayName: trimmedName,
      };
      if (photoURL !== undefined) {
        updateData.profilePicUrl = photoURL || null;
      }
      await setDoc(userRef, updateData, { merge: true });
    }
    await refreshUserData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        userRole,
        userNumber,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        startupAuthError,
        clearStartupAuthError,
        signOut,
        resetPassword,
        updateUserProfile,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
