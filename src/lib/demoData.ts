import type {
  Bounty,
  BountyStats,
  FinanceData,
  Habit,
  MotivationalSettings,
  Playlist,
  PomodoroSettings,
  PomodoroStats,
  Task,
  UnlockedItems,
} from '@/types';

/**
 * Demo workspace seeding.
 *
 * Mornigami keeps its working data in localStorage (Firestore is only a backup
 * mirror), so a brand-new account lands on empty Habits / To-Do / Finance /
 * Playlists screens. This module fills those keys with a believable demo
 * workspace on first load so the app is instantly explorable.
 *
 * Rules:
 *  - Seeding never overwrites data that is already there: a key is filled only
 *    when it is missing or empty, unless `force` is passed.
 *  - It runs before React mounts (see src/main.tsx), so every provider's lazy
 *    state initialiser reads the seeded values.
 *  - Signing out clears these keys (AuthContext.signOut); the next load re-seeds
 *    them, which is what makes the demo survive a logout/logout round-trip.
 */

export const DEMO_DATA_VERSION = 1;
const DEMO_MARKER_KEY = 'demoWorkspaceVersion';

const pad = (n: number) => String(n).padStart(2, '0');

const dayStr = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const todayStr = (): string => dayStr(0);

const nowISO = (): string => new Date().toISOString();

const completedOn = (offsets: number[]): string[] => offsets.map((o) => dayStr(o)).sort();

const demoHabits = (): Habit[] => [
  {
    id: 'demo-habit-morning-stretch',
    title: 'Morning stretch',
    category: 'Morning',
    targetDays: [1, 2, 3, 4, 5],
    durationValue: 10,
    durationUnit: 'mins',
    targetTimePerDay: 600,
    timeSpentToday: 600,
    currentStreak: 7,
    completedDates: completedOn([1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 14, 18]),
    lastCompletedDate: dayStr(1),
    createdAt: nowISO(),
  },
  {
    id: 'demo-habit-read',
    title: 'Read 20 pages',
    category: 'Learning',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    durationValue: 20,
    durationUnit: 'mins',
    targetTimePerDay: 1200,
    timeSpentToday: 0,
    currentStreak: 4,
    completedDates: completedOn([1, 3, 4, 6, 8, 9, 12, 15, 16, 20]),
    lastCompletedDate: dayStr(1),
    createdAt: nowISO(),
  },
  {
    id: 'demo-habit-meditate',
    title: 'Meditate',
    category: 'Mindfulness',
    targetDays: [1, 2, 3, 4, 5, 6, 0],
    durationValue: 10,
    durationUnit: 'mins',
    targetTimePerDay: 600,
    timeSpentToday: 0,
    currentStreak: 2,
    completedDates: completedOn([2, 5, 7, 10, 11, 14, 19, 21]),
    lastCompletedDate: dayStr(2),
    createdAt: nowISO(),
  },
  {
    id: 'demo-habit-water',
    title: 'Drink 2L of water',
    category: 'Health',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    durationValue: 8,
    durationUnit: 'times',
    targetTimePerDay: 8,
    timeSpentToday: 0,
    currentStreak: 9,
    completedDates: completedOn([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 15, 17]),
    lastCompletedDate: dayStr(1),
    createdAt: nowISO(),
  },
  {
    id: 'demo-habit-deep-work',
    title: 'Deep work block',
    category: 'Productivity',
    targetDays: [1, 2, 3, 4, 5],
    durationValue: 1,
    durationUnit: 'hours',
    targetTimePerDay: 3600,
    timeSpentToday: 0,
    currentStreak: 3,
    completedDates: completedOn([2, 3, 5, 6, 9, 11, 12, 16]),
    lastCompletedDate: dayStr(2),
    createdAt: nowISO(),
  },
];

const demoTasks = (): Task[] => [
  {
    id: 'demo-task-inbox-zero',
    title: 'Clear the morning inbox',
    category: 'Work',
    priority: 'high',
    completed: false,
    dueDate: todayStr(),
    createdAt: nowISO(),
  },
  {
    id: 'demo-task-weekly-review',
    title: 'Draft the weekly review',
    category: 'Work',
    priority: 'medium',
    completed: false,
    dueDate: todayStr(),
    createdAt: nowISO(),
  },
  {
    id: 'demo-task-30min-practice',
    title: '30 minutes of TypeScript practice',
    category: 'Learning',
    priority: 'medium',
    completed: false,
    dueDate: dayStr(-1),
    createdAt: nowISO(),
  },
  {
    id: 'demo-task-groceries',
    title: 'Pick up groceries for the week',
    category: 'Errands',
    priority: 'low',
    completed: false,
    dueDate: dayStr(-2),
    createdAt: nowISO(),
  },
  {
    id: 'demo-task-plan-weekend',
    title: 'Plan the weekend hike',
    category: 'Personal',
    priority: 'low',
    completed: false,
    dueDate: dayStr(-3),
    createdAt: nowISO(),
  },
  {
    id: 'demo-task-refill-water',
    title: 'Refill the water bottle',
    category: 'Health',
    priority: 'low',
    completed: true,
    dueDate: todayStr(),
    createdAt: nowISO(),
  },
  {
    id: 'demo-task-tidy-desk',
    title: 'Tidy the desk before deep work',
    category: 'Personal',
    priority: 'medium',
    completed: true,
    dueDate: dayStr(1),
    createdAt: nowISO(),
  },
];

const demoFinanceData = (): FinanceData => {
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const expenses = [
    { name: 'Specialty coffee', amount: 85, category: 'Coffee ☕', day: 1, essential: false, method: 'visa' },
    { name: 'Weekly groceries', amount: 940, category: 'Diet & Groceries 🍏', day: 2, essential: true, method: 'visa' },
    { name: 'Metro card top-up', amount: 260, category: 'Transportation 🚗', day: 3, essential: true, method: 'wallet' },
    { name: 'Steam sale', amount: 540, category: 'Gaming 🎮', day: 4, essential: false, method: 'visa' },
    { name: 'Mechanical keyboard', amount: 1850, category: 'PC Accessories 💻', day: 5, essential: false, method: 'visa' },
    { name: 'Farmers market', amount: 410, category: 'Diet & Groceries 🍏', day: 6, essential: true, method: 'wallet' },
    { name: 'Ride to the gym', amount: 120, category: 'Transportation 🚗', day: 7, essential: true, method: 'wallet' },
    { name: 'Study app subscription', amount: 300, category: 'Subscriptions 📱', day: 8, essential: false, method: 'visa' },
    { name: 'Team lunch', amount: 620, category: 'Coffee ☕', day: 9, essential: false, method: 'visa' },
    { name: 'Household bits', amount: 380, category: 'Diet & Groceries 🍏', day: 10, essential: true, method: 'wallet' },
  ].map((e, index) => ({
    id: `demo-expense-${index + 1}`,
    name: e.name,
    amount: e.amount,
    category: e.category,
    date: `${monthYear}-${pad(Math.min(e.day, Math.max(1, now.getDate() - 1)))}`,
    description: '',
    type: 'expense' as const,
    paymentMethod: e.method as 'visa' | 'wallet',
    isEssential: e.essential,
  }));

  const monthlyIncome = 48000;
  const categories = [
    'Coffee ☕',
    'Diet & Groceries 🍏',
    'Gaming 🎮',
    'PC Accessories 💻',
    'Transportation 🚗',
    'Subscriptions 📱',
  ];

  return {
    monthYear,
    startingDate: `${monthYear}-${pad(1)}`,
    monthlyIncome,
    dailyBudget: Math.round(monthlyIncome / daysInMonth),
    expenses,
    xpBonusClaimedDates: { [dayStr(2)]: true, [dayStr(1)]: true },
    categories,
    currency: 'EGP',
    savingsBalance: 12500,
    savingsGoals: [
      { name: 'New laptop', target: 40000, duration: 6, startDate: `${monthYear}-${pad(1)}` },
      { name: 'Trip to the coast', target: 12000, duration: 3, startDate: `${monthYear}-${pad(1)}` },
    ],
    activeGoal: { name: 'New laptop', target: 40000, duration: 6, startDate: `${monthYear}-${pad(1)}` },
    essentialCategories: {
      'Diet & Groceries 🍏': true,
      'Transportation 🚗': true,
    },
    itemPreferences: {},
    lastClaimedBonusDate: dayStr(1),
    visaBalance: 8600,
    walletBalance: 1450,
    visaIncluded: true,
    visaAllocation: 8600,
    walletAllocation: 1450,
  };
};

const demoPlaylists = (): Playlist[] => [
  {
    id: 'demo-playlist-css',
    title: 'CSS for JavaScript Developers',
    thumbnail: 'https://i.ytimg.com/vi/1Rs2ND1ryYc/hqdefault.jpg',
    channel: 'Frontend Masters',
    speed: 1.25,
    expanded: true,
    videos: [
      { id: 'v-1', title: 'The box model, revisited', thumbnail: 'https://i.ytimg.com/vi/1Rs2ND1ryYc/hqdefault.jpg', channelTitle: 'Frontend Masters', completed: true, durationSeconds: 1520 },
      { id: 'v-2', title: 'Flexbox fundamentals', thumbnail: 'https://i.ytimg.com/vi/K74l26pE4YA/hqdefault.jpg', channelTitle: 'Frontend Masters', completed: true, durationSeconds: 1840 },
      { id: 'v-3', title: 'Grid makes layouts click', thumbnail: 'https://i.ytimg.com/vi/7kVeCqQCxlk/hqdefault.jpg', channelTitle: 'Frontend Masters', completed: true, durationSeconds: 2100 },
      { id: 'v-4', title: 'Positioning without tears', thumbnail: 'https://i.ytimg.com/vi/jx5jmI0UlXU/hqdefault.jpg', channelTitle: 'Frontend Masters', completed: false, durationSeconds: 1680 },
      { id: 'v-5', title: 'Modern responsive patterns', thumbnail: 'https://i.ytimg.com/vi/0eEB1w0bn3Y/hqdefault.jpg', channelTitle: 'Frontend Masters', completed: false, durationSeconds: 1920 },
      { id: 'v-6', title: 'Container queries in practice', thumbnail: 'https://i.ytimg.com/vi/2rlFQuQILcw/hqdefault.jpg', channelTitle: 'Frontend Masters', completed: false, durationSeconds: 2260 },
    ],
    groups: [
      { id: 'demo-group-1', name: 'Foundations', start: 1, end: 3, color: 'default' },
      { id: 'demo-group-2', name: 'Layout systems', start: 4, end: 6, color: 'sky' },
    ],
  },
  {
    id: 'demo-playlist-morning',
    title: 'Calm morning start',
    thumbnail: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg',
    channel: 'Daily rituals',
    speed: 1,
    expanded: false,
    videos: [
      { id: 'v-7', title: 'Five minute breathing reset', thumbnail: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg', channelTitle: 'Daily rituals', completed: true, durationSeconds: 320 },
      { id: 'v-8', title: 'Desk stretch routine', thumbnail: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg', channelTitle: 'Daily rituals', completed: true, durationSeconds: 480 },
      { id: 'v-9', title: 'How to plan a slower day', thumbnail: 'https://i.ytimg.com/vi/ZbZSe6N_BXs/hqdefault.jpg', channelTitle: 'Daily rituals', completed: false, durationSeconds: 760 },
      { id: 'v-10', title: 'Coffee brewing, no talking', thumbnail: 'https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg', channelTitle: 'Daily rituals', completed: false, durationSeconds: 610 },
    ],
    groups: [{ id: 'demo-group-3', name: 'Warm-up', start: 1, end: 2, color: 'amber' }],
  },
];

const demoPomodoroSettings = (): PomodoroSettings => ({
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
});

const demoPomodoroStats = (): PomodoroStats => ({
  sessionsToday: 3,
  totalFocusTime: 285,
  currentStreak: 8,
  // PomodoroContext compares lastSessionDate against Date#toDateString(), so
  // seed the same shape or it treats the demo stats as stale and zeroes them.
  lastSessionDate: new Date().toDateString(),
});

const demoFriends = (): string[] => ['Morning Light 🌅', 'Fold Master 🏆'];

const demoMotivationalSettings = (): MotivationalSettings => ({
  enabled: true,
  targetCount: 5,
  streakCount: 3,
});

const demoBounties = (): Bounty[] => [
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

const demoBountyStats = (): BountyStats => ({
  pomodorosCompletedToday: 1,
  habitsCompletedToday: 1,
  tasksCompletedToday: 1,
  dateStr: todayStr(),
});

const demoUnlockedItems = (): UnlockedItems => ({
  colors: ['#FDA4AF', '#A7F3D0'],
  avatars: ['🦊', '🕊️'],
  borders: ['spark-border'],
});

interface SeedEntry {
  build: () => unknown;
  /** Force the seed even when the key already holds a value (used by the reset action). */
  forceable: boolean;
}

const SEED: Record<string, SeedEntry> = {
  habits: { build: demoHabits, forceable: true },
  tasks: { build: demoTasks, forceable: true },
  financeData: { build: demoFinanceData, forceable: true },
  playlists: { build: demoPlaylists, forceable: true },
  motivationalSettings: { build: demoMotivationalSettings, forceable: true },
  pomodoroSettings: { build: demoPomodoroSettings, forceable: false },
  pomodoroStats: { build: demoPomodoroStats, forceable: true },
  dailyBounties: { build: demoBounties, forceable: true },
  bountyStats: { build: demoBountyStats, forceable: true },
  unlockedItems: { build: demoUnlockedItems, forceable: true },
  userLevel: { build: () => 12, forceable: true },
  userXP: { build: () => 2450, forceable: true },
  spentXP: { build: () => 1800, forceable: true },
  activeAvatar: { build: () => '🦊', forceable: true },
  activeBorder: { build: () => 'spark-border', forceable: true },
  friendsList: { build: demoFriends, forceable: true },
};

const parseStored = (raw: string | null): unknown => {
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const isEmptyStored = (value: unknown): boolean => {
  if (value === undefined || value === null) return true;
  if (value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
};

/**
 * Fill missing/empty Mornigami workspaces with demo data.
 * Returns the localStorage keys that were written.
 */
export function seedDemoData(force = false): string[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];

  const written: string[] = [];

  (Object.keys(SEED) as string[]).forEach((key) => {
    const entry = SEED[key];
    if (force && !entry.forceable) return;

    const stored = parseStored(localStorage.getItem(key));
    const shouldWrite = force || isEmptyStored(stored);
    if (!shouldWrite) return;

    const value = entry.build();
    localStorage.setItem(key, JSON.stringify(value));
    written.push(key);
  });

  localStorage.setItem(DEMO_MARKER_KEY, String(DEMO_DATA_VERSION));
  return written;
}

/** True once the demo workspace has been installed in this browser. */
export function hasDemoWorkspace(): boolean {
  return localStorage.getItem(DEMO_MARKER_KEY) !== null;
}

/** Wipe the demo marker so the next load re-seeds fresh demo data. */
export function markDemoWorkspaceForReseed(): void {
  localStorage.removeItem(DEMO_MARKER_KEY);
}
