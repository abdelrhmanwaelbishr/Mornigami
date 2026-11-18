import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';
import { loadLocalData, saveLocalData } from '@/lib/storage';
import type { Habit } from '@/types';

interface HabitsContextType {
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'currentStreak' | 'completedDates' | 'createdAt'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitToday: (id: string) => boolean;
  logHabitTime: (id: string, seconds: number) => void;
  isHabitCompletedToday: (habit: Habit) => boolean;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

const dateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Consecutive days ending today, or ending yesterday while today is still open.
 * Derived from the dates themselves so a missed day actually breaks the streak.
 */
const computeStreak = (completedDates: string[]): number => {
  const done = new Set(completedDates);
  const cursor = new Date();
  if (!done.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (done.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const HabitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userDoc } = useAuth();
  const { gainXP } = useGamification();

  const [habits, setHabits] = useState<Habit[]>(() => {
    const raw = loadLocalData<Habit[]>('habits', []);
    if (!Array.isArray(raw)) return [];
    return raw.map((h) => {
      const completedDates = Array.isArray(h?.completedDates) ? h.completedDates : [];
      return {
        ...h,
        completedDates,
        targetDays: Array.isArray(h?.targetDays) ? h.targetDays : [0, 1, 2, 3, 4, 5, 6],
        currentStreak: computeStreak(completedDates),
        timeSpentToday: h?.timeSpentToday || 0,
      };
    });
  });

  useEffect(() => {
    if (userDoc?.habits && Array.isArray(userDoc.habits)) {
      const safeHabits = userDoc.habits.map((h) => {
        const completedDates = Array.isArray(h?.completedDates) ? h.completedDates : [];
        return {
          ...h,
          completedDates,
          targetDays: Array.isArray(h?.targetDays) ? h.targetDays : [0, 1, 2, 3, 4, 5, 6],
          currentStreak: computeStreak(completedDates),
          timeSpentToday: h?.timeSpentToday || 0,
        };
      });
      setHabits(safeHabits);
      localStorage.setItem('habits', JSON.stringify(safeHabits));
    }
  }, [userDoc]);

  const saveHabits = (newHabits: Habit[]) => {
    setHabits(newHabits);
    saveLocalData('habits', newHabits, user?.uid);
  };

  const addHabit = (habitData: Omit<Habit, 'id' | 'currentStreak' | 'completedDates' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: Date.now().toString(),
      currentStreak: 0,
      completedDates: [],
      timeSpentToday: 0,
      createdAt: new Date().toISOString(),
    };
    saveHabits([newHabit, ...habits]);
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    const updated = habits.map((h) => (h.id === id ? { ...h, ...updates } : h));
    saveHabits(updated);
  };

  const deleteHabit = (id: string) => {
    const filtered = habits.filter((h) => h.id !== id);
    saveHabits(filtered);
  };

  const getTodayDateStr = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isHabitCompletedToday = (habit: Habit): boolean => {
    if (!habit || !Array.isArray(habit.completedDates)) return false;
    const today = getTodayDateStr();
    return habit.completedDates.includes(today);
  };

  const toggleHabitToday = (id: string): boolean => {
    const today = getTodayDateStr();
    let completedNow = false;

    const updated = habits.map((habit) => {
      if (habit.id !== id) return habit;

      const completedDates = Array.isArray(habit.completedDates) ? habit.completedDates : [];
      const isCompleted = completedDates.includes(today);
      let newCompletedDates = [...completedDates];

      if (isCompleted) {
        newCompletedDates = newCompletedDates.filter((d) => d !== today);
        completedNow = false;
      } else {
        newCompletedDates.push(today);
        completedNow = true;
      }

      return {
        ...habit,
        completedDates: newCompletedDates,
        currentStreak: computeStreak(newCompletedDates),
        lastCompletedDate: completedNow ? today : habit.lastCompletedDate,
      };
    });

    saveHabits(updated);

    if (completedNow) {
      gainXP(50, 'Habit Completed');
    }

    return completedNow;
  };

  const logHabitTime = (id: string, seconds: number) => {
    const updated = habits.map((h) => {
      if (h.id === id) {
        return {
          ...h,
          timeSpentToday: (h.timeSpentToday || 0) + seconds,
        };
      }
      return h;
    });
    saveHabits(updated);
  };

  return (
    <HabitsContext.Provider
      value={{
        habits,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitToday,
        logHabitTime,
        isHabitCompletedToday,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};

export const useHabits = (): HabitsContextType => {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
};
