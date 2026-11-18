import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGamification } from './GamificationContext';
import { usePomodoro } from './PomodoroContext';
import { useHabits } from './HabitsContext';
import { useTasks } from './TasksContext';
import { loadLocalData, saveLocalData } from '@/lib/storage';
import type { Bounty, BountyStats } from '@/types';

interface BountiesContextType {
  bounties: Bounty[];
  bountyStats: BountyStats;
  countdown: string;
  claimBounty: (bountyId: string) => void;
}

const DEFAULT_BOUNTIES: Bounty[] = [
  {
    id: 'bounty_pomodoro',
    title: 'Deep Focus Master',
    desc: 'Complete 2 Pomodoro focus sessions today.',
    xp: 150,
    type: 'pomodoro',
    targetCount: 2,
    completed: false,
  },
  {
    id: 'bounty_habits',
    title: 'Habit Consistency',
    desc: 'Complete at least 2 habits today.',
    xp: 100,
    type: 'habit',
    targetCount: 2,
    completed: false,
  },
  {
    id: 'bounty_tasks',
    title: 'Task Executioner',
    desc: 'Complete at least 2 to-do tasks today.',
    xp: 80,
    type: 'task',
    targetCount: 2,
    completed: false,
  },
];

const BountiesContext = createContext<BountiesContextType | undefined>(undefined);

/** Local calendar day. Habits use the same rule; UTC would turn the page over at 22:00 here. */
const localDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const BountiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { gainXP } = useGamification();
  const { stats: pomodoroStats } = usePomodoro();
  const { habits } = useHabits();
  const { tasks } = useTasks();

  const getTodayStr = () => localDateKey(new Date());

  const [bountyStats, setBountyStats] = useState<BountyStats>(() => {
    return loadLocalData<BountyStats>('bountyStats', {
      pomodorosCompletedToday: 0,
      habitsCompletedToday: 0,
      tasksCompletedToday: 0,
      dateStr: getTodayStr(),
    });
  });

  const [bounties, setBounties] = useState<Bounty[]>(() => {
    return loadLocalData<Bounty[]>('dailyBounties', DEFAULT_BOUNTIES);
  });

  const [countdown, setCountdown] = useState<string>('');

  // Daily Reset & Live Countdown
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = tomorrow.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setCountdown(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );

      // Check if date changed
      const today = getTodayStr();
      if (bountyStats.dateStr !== today) {
        setBounties(DEFAULT_BOUNTIES);
        const resetStats: BountyStats = {
          pomodorosCompletedToday: 0,
          habitsCompletedToday: 0,
          tasksCompletedToday: 0,
          dateStr: today,
        };
        setBountyStats(resetStats);
        saveLocalData('dailyBounties', DEFAULT_BOUNTIES);
        saveLocalData('bountyStats', resetStats);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [bountyStats.dateStr]);

  // Sync real-time progress from Pomodoro, Habits, and Tasks
  useEffect(() => {
    const today = getTodayStr();
    const completedHabitsToday = (habits || []).filter(
      (h) => Array.isArray(h?.completedDates) && h.completedDates.includes(today)
    ).length;
    // Only tasks ticked today count: a task finished last week is not today's work.
    const completedTasksToday = (tasks || []).filter(
      (t) =>
        t?.completed && t.completedAt && localDateKey(new Date(t.completedAt)) === today
    ).length;
    const pomodoros = pomodoroStats?.sessionsToday || 0;

    setBountyStats((prev) => {
      const current = prev || {
        pomodorosCompletedToday: 0,
        habitsCompletedToday: 0,
        tasksCompletedToday: 0,
        dateStr: today,
      };
      const updated: BountyStats = {
        ...current,
        pomodorosCompletedToday: pomodoros,
        habitsCompletedToday: completedHabitsToday,
        tasksCompletedToday: completedTasksToday,
        dateStr: today,
      };
      saveLocalData('bountyStats', updated);
      return updated;
    });
  }, [pomodoroStats?.sessionsToday, habits, tasks]);

  const claimBounty = (bountyId: string) => {
    const safeBounties = Array.isArray(bounties) ? bounties : [];
    const target = safeBounties.find((b) => b.id === bountyId);
    if (!target || target.completed) return;

    const safeStats = bountyStats || {
      pomodorosCompletedToday: 0,
      habitsCompletedToday: 0,
      tasksCompletedToday: 0,
      dateStr: '',
    };

    let canClaim = false;
    if (target.type === 'pomodoro' && safeStats.pomodorosCompletedToday >= target.targetCount) {
      canClaim = true;
    } else if (target.type === 'habit' && safeStats.habitsCompletedToday >= target.targetCount) {
      canClaim = true;
    } else if (target.type === 'task' && safeStats.tasksCompletedToday >= target.targetCount) {
      canClaim = true;
    }

    if (!canClaim) return;

    const updated = safeBounties.map((b) => (b.id === bountyId ? { ...b, completed: true } : b));
    setBounties(updated);
    saveLocalData('dailyBounties', updated);
    gainXP(target.xp, `Bounty: ${target.title}`);
  };

  return (
    <BountiesContext.Provider value={{ bounties, bountyStats, countdown, claimBounty }}>
      {children}
    </BountiesContext.Provider>
  );
};

export const useBounties = (): BountiesContextType => {
  const context = useContext(BountiesContext);
  if (!context) {
    throw new Error('useBounties must be used within a BountiesProvider');
  }
  return context;
};
