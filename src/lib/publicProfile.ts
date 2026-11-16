import { db, doc, setDoc } from './firebase';

/**
 * The subset of a profile that is safe to show to other signed-in people.
 * Never add email, role, or auth data here — the leaderboard reads this
 * collection, and Firestore rules cannot hide individual fields of a document.
 */
export interface PublicProfile {
  displayName: string;
  userLevel: number;
  userXP: number;
  avatar: string;
  userNumber?: number;
  profilePicUrl?: string | null;
}

/**
 * Publishes the leaderboard projection for the current user. Best-effort: a
 * denied or offline write must never interrupt play.
 */
export const publishPublicProfile = async (uid: string, profile: PublicProfile): Promise<void> => {
  if (!db || !uid) return;
  try {
    await setDoc(
      doc(db, 'publicProfiles', uid),
      {
        displayName: profile.displayName || 'Anonymous Folder',
        userLevel: Number(profile.userLevel) || 1,
        userXP: Number(profile.userXP) || 0,
        avatar: profile.avatar || '🌱',
        userNumber: profile.userNumber ?? null,
        profilePicUrl: profile.profilePicUrl ?? null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Public profile publish skipped:', err);
  }
};
