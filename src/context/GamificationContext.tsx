import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { loadLocalData, saveLocalData } from '@/lib/storage';
import { publishPublicProfile } from '@/lib/publicProfile';
import type { StoreItem, UnlockedItems } from '@/types';

export const STORE_ITEMS: {
  colors: StoreItem[];
  avatars: StoreItem[];
  borders: StoreItem[];
} = {  colors: [
    { id: 'color_dawn', name: 'Dawn Sky', value: '#7DD3FC', cost: 300, desc: 'Unlocks a pale sky-blue accent for your buttons.' },
    { id: 'color_morning', name: 'Morning Sky', value: '#38BDF8', cost: 300, desc: 'Unlocks a clear morning-sky accent for your buttons.' },
    { id: 'color_noon', name: 'Noon Sky', value: '#3B82F6', cost: 300, desc: 'Unlocks a bright noon-blue accent for your buttons.' },
    { id: 'color_midnight', name: 'Midnight Blue', value: '#1D4ED8', cost: 300, desc: 'Unlocks a deep midnight-blue accent for your buttons.' },
    { id: 'color_sakura', name: 'Sakura Pink', value: '#FDA4AF', cost: 300, desc: 'Retired pastel.', retired: true },
    { id: 'color_mint', name: 'Mint Sage', value: '#A7F3D0', cost: 300, desc: 'Retired pastel.', retired: true },
    { id: 'color_butter', name: 'Butter Cream', value: '#FDE68A', cost: 300, desc: 'Retired pastel.', retired: true },
    { id: 'color_lavender', name: 'Lavender Mist', value: '#DDD6FE', cost: 300, desc: 'Retired pastel.', retired: true },
  ],
  avatars: [
    { id: 'avatar_fox', name: 'Origami Fox', value: '🦊', cost: 500, desc: 'Set foxy origami as your profile avatar.' },
    { id: 'avatar_crane', name: 'Origami Crane', value: '🕊️', cost: 500, desc: 'Set graceful crane as your profile avatar.' },
    { id: 'avatar_frog', name: 'Origami Frog', value: '🐸', cost: 500, desc: 'Set jumping frog as your profile avatar.' },
    { id: 'avatar_dragon', name: 'Origami Dragon', value: '🐉', cost: 1000, desc: 'Set legendary dragon as your profile avatar.' },
  ],
  borders: [
    { id: 'border_spark', name: 'Sparkling Border', value: 'spark-border', cost: 400, desc: 'A subtle gold sparkling animation border for your badge.' },
    { id: 'border_fire', name: 'Fire Border', value: 'fire-border', cost: 400, desc: 'A hot fire flame animation border for your badge.' },
    { id: 'border_rainbow', name: 'Rainbow Border', value: 'rainbow-border', cost: 800, desc: 'A premium cycling rainbow gradient border for your badge.' },
  ],
};

/** Points paid into the store wallet for each level gained. */
export const POINTS_PER_LEVEL = 100;

interface GamificationContextType {
  userLevel: number;
  userXP: number;
  /** Store currency. Earned at 100 per level-up; XP itself is only level progress. */
  points: number;
  xpNeeded: number;
  progressPercent: number;
  unlockedItems: UnlockedItems;
  activeAvatar: string;
  activeBorder: string;
  gainXP: (amount: number, reason?: string) => void;
  buyStoreItem: (category: 'colors' | 'avatars' | 'borders', item: StoreItem) => boolean;
  equipAvatar: (avatar: string) => void;
  equipBorder: (border: string) => void;
  levelUpModalOpen: boolean;
  closeLevelUpModal: () => void;
  newLevelAchieved: number | null;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userDoc, userNumber } = useAuth();
  const { setAccentColor } = useTheme();

  const [userLevel, setUserLevel] = useState<number>(() => {
    return parseInt(localStorage.getItem('userLevel') || '1', 10);
  });
  const [userXP, setUserXP] = useState<number>(() => {
    return parseInt(localStorage.getItem('userXP') || '0', 10);
  });
  const [points, setPoints] = useState<number>(() => {
    const stored = localStorage.getItem('points');
    if (stored !== null) return Math.max(0, parseInt(stored, 10) || 0);
    // One-time migration: XP that had not been spent becomes the opening Points balance.
    // The old store spent `userXP` directly and only mirrored the amount into `spentXP`,
    // so `userXP` alone is the unspent balance — subtracting `spentXP` charges twice.
    const xp = parseInt(localStorage.getItem('userXP') || '0', 10) || 0;
    return Math.max(0, xp);
  });
  const [unlockedItems, setUnlockedItems] = useState<UnlockedItems>(() => {
    const loaded = loadLocalData<UnlockedItems>('unlockedItems', { colors: [], avatars: [], borders: [] });
    return {
      colors: Array.isArray(loaded?.colors) ? loaded.colors : [],
      avatars: Array.isArray(loaded?.avatars) ? loaded.avatars : [],
      borders: Array.isArray(loaded?.borders) ? loaded.borders : [],
    };
  });
  const [activeAvatar, setActiveAvatar] = useState<string>(() => {
    return localStorage.getItem('activeAvatar') || '🌱';
  });
  const [activeBorder, setActiveBorder] = useState<string>(() => {
    return localStorage.getItem('activeBorder') || '';
  });

  const [levelUpModalOpen, setLevelUpModalOpen] = useState(false);
  const [newLevelAchieved, setNewLevelAchieved] = useState<number | null>(null);
  // Guards the one-time backfill below so it cannot fire on every userDoc update.
  const pointsBackfilled = useRef(false);

  // Publish the leaderboard-safe slice of this profile. Other people must be
  // able to see level/avatar without reading the private users/{uid} document,
  // so the Community page reads publicProfiles instead.
  useEffect(() => {
    if (!user?.uid) return;
    void publishPublicProfile(user.uid, {
      displayName: userDoc?.displayName || user.displayName || 'Anonymous Folder',
      userLevel,
      userXP,
      avatar: activeAvatar || '🌱',
      userNumber: userNumber ?? undefined,
      profilePicUrl: userDoc?.profilePicUrl || userDoc?.photoURL || user?.photoURL || null,
    });
  }, [
    user?.uid,
    user?.displayName,
    user?.photoURL,
    userDoc?.displayName,
    userDoc?.profilePicUrl,
    userDoc?.photoURL,
    userLevel,
    userXP,
    activeAvatar,
    userNumber,
  ]);

  // Sync with Firestore userDoc when it arrives
  useEffect(() => {
    if (userDoc) {
      if (userDoc.userLevel !== undefined && userDoc.userLevel !== null) {
        const lvl = Number(userDoc.userLevel) || 1;
        setUserLevel(lvl);
        localStorage.setItem('userLevel', lvl.toString());
      }
      if (userDoc.userXP !== undefined && userDoc.userXP !== null) {
        const xp = Number(userDoc.userXP) || 0;
        setUserXP(xp);
        localStorage.setItem('userXP', xp.toString());
      }
      if (userDoc.points !== undefined && userDoc.points !== null) {
        const nextPoints = Math.max(0, Number(userDoc.points) || 0);
        setPoints(nextPoints);
        localStorage.setItem('points', nextPoints.toString());
      } else if (!pointsBackfilled.current && user) {
        // An account that predates Points has no field to read, and its browser may
        // not hold the legacy values either. Write the migrated balance once so the
        // next sync has a real number instead of re-deriving it from live XP.
        pointsBackfilled.current = true;
        saveLocalData('points', points, user.uid);
      }
      if (userDoc.unlockedItems) {
        const safeUnlocked: UnlockedItems = {
          colors: Array.isArray(userDoc.unlockedItems.colors) ? userDoc.unlockedItems.colors : [],
          avatars: Array.isArray(userDoc.unlockedItems.avatars) ? userDoc.unlockedItems.avatars : [],
          borders: Array.isArray(userDoc.unlockedItems.borders) ? userDoc.unlockedItems.borders : [],
        };
        setUnlockedItems(safeUnlocked);
        localStorage.setItem('unlockedItems', JSON.stringify(safeUnlocked));
      }
      if (userDoc.activeAvatar) {
        setActiveAvatar(userDoc.activeAvatar);
        localStorage.setItem('activeAvatar', userDoc.activeAvatar);
      }
      if (userDoc.activeBorder !== undefined) {
        setActiveBorder(userDoc.activeBorder || '');
        localStorage.setItem('activeBorder', userDoc.activeBorder || '');
      }
      if (userDoc.activeColor) {
        setAccentColor(userDoc.activeColor);
        localStorage.setItem('accentColor', userDoc.activeColor);
      }
    }
  }, [userDoc]);

  const xpNeeded = userLevel * 500;
  const progressPercent = Math.min(100, Math.round((userXP / xpNeeded) * 100));

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const gainXP = (amount: number, reason?: string) => {
    let currentXP = userXP + amount;
    let currentLvl = userLevel;
    let levelsGained = 0;

    // XP is level progress only: it is consumed by the level, never spent in the store.
    while (currentXP >= currentLvl * 500) {
      currentXP -= currentLvl * 500;
      currentLvl++;
      levelsGained++;
    }

    const nextPoints = points + levelsGained * POINTS_PER_LEVEL;

    setUserXP(currentXP);
    setUserLevel(currentLvl);

    localStorage.setItem('userXP', currentXP.toString());
    localStorage.setItem('userLevel', currentLvl.toString());

    if (user) {
      saveLocalData('userXP', currentXP, user.uid);
      saveLocalData('userLevel', currentLvl, user.uid);
    }

    if (levelsGained > 0) {
      setPoints(nextPoints);
      localStorage.setItem('points', nextPoints.toString());
      if (user) saveLocalData('points', nextPoints, user.uid);
    }

    // The receipt: every award says what it was for, so the economy is legible
    // from the page the action happened on. Level-ups keep their own celebration.
    if (reason) {
      toast(`+${amount} XP · ${reason}`, { duration: 2400 });
    }

    if (levelsGained > 0) {
      toast.success(
        `+${levelsGained * POINTS_PER_LEVEL} Points for reaching Level ${currentLvl}`,
        { duration: 3200 }
      );
      setNewLevelAchieved(currentLvl);
      setLevelUpModalOpen(true);
      triggerConfetti();
    }
  };

  const buyStoreItem = (category: 'colors' | 'avatars' | 'borders', item: StoreItem): boolean => {
    if (points < item.cost) {
      return false;
    }

    const nextPoints = points - item.cost;
    setPoints(nextPoints);
    localStorage.setItem('points', nextPoints.toString());
    if (user) saveLocalData('points', nextPoints, user.uid);

    const currentCategoryItems = Array.isArray(unlockedItems?.[category]) ? unlockedItems[category] : [];
    const updatedUnlocked: UnlockedItems = {
      colors: Array.isArray(unlockedItems?.colors) ? [...unlockedItems.colors] : [],
      avatars: Array.isArray(unlockedItems?.avatars) ? [...unlockedItems.avatars] : [],
      borders: Array.isArray(unlockedItems?.borders) ? [...unlockedItems.borders] : [],
      [category]: [...currentCategoryItems, item.value],
    };
    setUnlockedItems(updatedUnlocked);
    saveLocalData('unlockedItems', updatedUnlocked, user?.uid);

    // Automatically equip bought item
    if (category === 'colors') {
      setAccentColor(item.value);
    } else if (category === 'avatars') {
      equipAvatar(item.value);
    } else if (category === 'borders') {
      equipBorder(item.value);
    }

    triggerConfetti();
    return true;
  };

  const equipAvatar = (avatar: string) => {
    setActiveAvatar(avatar);
    localStorage.setItem('activeAvatar', avatar);
    if (user) {
      saveLocalData('activeAvatar', avatar, user.uid);
    }
  };

  const equipBorder = (border: string) => {
    const newVal = activeBorder === border ? '' : border;
    setActiveBorder(newVal);
    localStorage.setItem('activeBorder', newVal);
    if (user) {
      saveLocalData('activeBorder', newVal, user.uid);
    }
  };

  const closeLevelUpModal = () => {
    setLevelUpModalOpen(false);
  };

  return (
    <GamificationContext.Provider
      value={{
        userLevel,
        userXP,
        points,
        xpNeeded,
        progressPercent,
        unlockedItems,
        activeAvatar,
        activeBorder,
        gainXP,
        buyStoreItem,
        equipAvatar,
        equipBorder,
        levelUpModalOpen,
        closeLevelUpModal,
        newLevelAchieved,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
