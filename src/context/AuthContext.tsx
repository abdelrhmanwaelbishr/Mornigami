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
  runTransaction,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User,
} from '@/lib/firebase';
import { googleAuthErrorMessage, readAuthError } from '@/lib/authErrors';
import { isOwnerEmail } from '@/lib/adminAccess';
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

/**
 * Local username → email directory.
 *
 * Username sign-in historically resolved the email through the Firestore users
 * collection. That read can be denied by security rules, which made username
 * sign-in fail on a fresh browser. Remembering accounts created (or first seen)
 * on this device keeps username sign-in working without the directory.
 */
const USERNAME_DIRECTORY_KEY = 'usernameDirectory';

type UsernameDirectory = Record<string, string>;

const readUsernameDirectory = (): UsernameDirectory => {
  try {
    const raw = localStorage.getItem(USERNAME_DIRECTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as UsernameDirectory) : {};
  } catch {
    return {};
  }
};

const rememberUsername = (username: string, email: string): void => {
  const key = username.trim().toLowerCase();
  if (!key || !email) return;
  const directory = readUsernameDirectory();
  if (directory[key] === email) return;
  directory[key] = email;
  try {
    localStorage.setItem(USERNAME_DIRECTORY_KEY, JSON.stringify(directory));
  } catch {
    // Private-mode or full storage: username sign-in simply falls back to email.
  }
};

const USERNAME_COLLECTION = 'usernames';

const usernameDocKey = (username: string): string => username.trim().toLowerCase();

/**
 * Cloud username directory: `usernames/{handle}` maps a display handle to its
 * email so username sign-in works on a device that has never seen the account.
 * firestore.rules allows single-document reads but not listing, so handles
 * cannot be scraped in bulk.
 */
const lookupCloudUsername = async (username: string): Promise<string | undefined> => {
  if (!db) return undefined;
  const key = usernameDocKey(username);
  if (!key) return undefined;
  try {
    const snap = await getDoc(doc(db, USERNAME_COLLECTION, key));
    const email = snap.exists() ? snap.data()?.email : undefined;
    return typeof email === 'string' && email ? email : undefined;
  } catch (err) {
    console.warn('Username directory lookup skipped:', err);
    return undefined;
  }
};

/** Claims the handle in the cloud directory so every device can resolve it. */
const rememberCloudUsername = async (uid: string, username: string, email: string): Promise<void> => {
  if (!db) return;
  const key = usernameDocKey(username);
  if (!key || !email) return;
  try {
    await setDoc(
      doc(db, USERNAME_COLLECTION, key),
      { uid, email, username: username.trim(), createdAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (err) {
    console.warn('Username directory write skipped:', err);
  }
};

/** Owner accounts and the legacy 'Bishr' handle may manage other accounts. */
const resolveUserRole = (firebaseUser: User, storedRole?: string | null): UserRole => {
  if (storedRole === 'admin') return 'admin';
  if (isOwnerEmail(firebaseUser.email)) return 'admin';
  if (firebaseUser.displayName?.toLowerCase() === 'bishr') return 'admin';
  return 'user';
};

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

        // Claim the cloud handle for accounts created before the directory
        // existed, and repair documents written without a name or email.
        const profileName = data.displayName?.toString() || firebaseUser.displayName || '';
        const profileEmail = data.email?.toString() || firebaseUser.email || '';
        if (profileName && profileEmail) {
          rememberUsername(profileName, profileEmail);
          void rememberCloudUsername(firebaseUser.uid, profileName, profileEmail);
        }

        // Owners (and the legacy 'Bishr' handle) administer the app.
        const role = resolveUserRole(firebaseUser, data.role);
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
        const role: UserRole = resolveUserRole(firebaseUser);
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
        await rememberCloudUsername(firebaseUser.uid, newDoc.displayName, newDoc.email);
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

    // If input does not contain '@', resolve the username to its email.
    if (!trimmed.includes('@')) {
      // 1) A browser-local hint (accounts used on this device) resolves even offline.
      const localMatch = readUsernameDirectory()[trimmed.toLowerCase()];
      // 2) The cloud directory resolves handles claimed on any other device.
      const cloudMatch = localMatch ? undefined : await lookupCloudUsername(trimmed);
      const resolved = localMatch || cloudMatch;

      if (!resolved) {
        throw new Error('No account found with this username. Please check the spelling or sign in with your email.');
      }

      targetEmail = resolved;
      rememberUsername(trimmed, resolved);
    }

    await signInWithEmailAndPassword(auth, targetEmail, pass);
  };

  const signUp = async (username: string, email: string, pass: string) => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (db) {
      // A handle is free when no usernames/{handle} document exists. The cloud
      // directory is readable one document at a time, so this works for
      // signed-out visitors without exposing the user list.
      let isTaken = false;
      try {
        const handleSnap = await getDoc(doc(db, USERNAME_COLLECTION, usernameDocKey(trimmedUsername)));
        isTaken = handleSnap.exists();
      } catch (err) {
        console.warn('Username availability check skipped:', err);
      }
      if (isTaken) {
        throw new Error('This username is already taken. Please choose a different one.');
      }
    }

    const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
    if (cred.user) {
      await fbUpdateProfile(cred.user, { displayName: trimmedUsername });
      rememberUsername(trimmedUsername, trimmedEmail);
      await rememberCloudUsername(cred.user.uid, trimmedUsername, trimmedEmail);
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
    // Keep the workspace after sign-out. Mornigami's demo data lives in this
    // browser, and wiping it here is what used to make the next sign-in look
    // empty. Only the account-scoped bits are dropped.
    localStorage.removeItem('userNumber');
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
    if (trimmedName) {
      await rememberCloudUsername(user.uid, trimmedName, user.email || '');
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
