import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { loadLocalData, saveLocalData } from '@/lib/storage';
import { publishPublicProfile } from '@/lib/publicProfile';
import type { StoreItem, UnlockedItems } from '@/types';

export const STORE_ITEMS: {
  colors: StoreItem[];
  avatars: StoreItem[];
  borders: StoreItem[];
} = {
  colors: [
    { id: 'color_sakura', name: 'Sakura Pink', value: '#FDA4AF', cost: 300, desc: 'Unlocks a pastel cherry blossom accent color.' },
    { id: 'color_mint', name: 'Mint Sage', value: '#A7F3D0', cost: 300, desc: 'Unlocks a fresh minty green accent color.' },
    { id: 'color_butter', name: 'Butter Cream', value: '#FDE68A', cost: 300, desc: 'Unlocks a warm, creamy morning yellow accent color.' },
    { id: 'color_lavender', name: 'Lavender Mist', value: '#DDD6FE', cost: 300, desc: 'Unlocks a soothing lavender accent color.' },
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

interface GamificationContextType {
  userLevel: number;
  userXP: number;
  spentXP: number;
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
  const [spentXP, setSpentXP] = useState<number>(() => {
    return parseInt(localStorage.getItem('spentXP') || '0', 10);
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
      if (userDoc.spentXP !== undefined && userDoc.spentXP !== null) {
        const spent = Number(userDoc.spentXP) || 0;
        setSpentXP(spent);
        localStorage.setItem('spentXP', spent.toString());
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

  const gainXP = (amount: number) => {
    let currentXP = userXP + amount;
    let currentLvl = userLevel;
    let leveledUp = false;

    while (currentXP >= currentLvl * 500) {
      currentXP -= currentLvl * 500;
      currentLvl++;
      leveledUp = true;
    }

    setUserXP(currentXP);
    setUserLevel(currentLvl);

    localStorage.setItem('userXP', currentXP.toString());
    localStorage.setItem('userLevel', currentLvl.toString());

    if (user) {
      saveLocalData('userXP', currentXP, user.uid);
      saveLocalData('userLevel', currentLvl, user.uid);
    }

    if (leveledUp) {
      setNewLevelAchieved(currentLvl);
      setLevelUpModalOpen(true);
      triggerConfetti();
    }
  };

  const buyStoreItem = (category: 'colors' | 'avatars' | 'borders', item: StoreItem): boolean => {
    if (userXP < item.cost) {
      return false;
    }

    // Deduct cost from XP, add to spentXP
    const nextXP = userXP - item.cost;
    const nextSpent = spentXP + item.cost;

    setUserXP(nextXP);
    setSpentXP(nextSpent);
    localStorage.setItem('userXP', nextXP.toString());
    localStorage.setItem('spentXP', nextSpent.toString());

    const currentCategoryItems = Array.isArray(unlockedItems?.[category]) ? unlockedItems[category] : [];
    const updatedUnlocked: UnlockedItems = {
      colors: Array.isArray(unlockedItems?.colors) ? [...unlockedItems.colors] : [],
      avatars: Array.isArray(unlockedItems?.avatars) ? [...unlockedItems.avatars] : [],
      borders: Array.isArray(unlockedItems?.borders) ? [...unlockedItems.borders] : [],
      [category]: [...currentCategoryItems, item.value],
    };
    setUnlockedItems(updatedUnlocked);
    saveLocalData('unlockedItems', updatedUnlocked, user?.uid);

    if (user) {
      saveLocalData('userXP', nextXP, user.uid);
      saveLocalData('spentXP', nextSpent, user.uid);
    }

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
        spentXP,
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
