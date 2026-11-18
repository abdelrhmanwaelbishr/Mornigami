export type UserRole = 'admin' | 'user';

export interface UserDoc {
  uid?: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  profilePicUrl?: string | null;
  userNumber?: number;
  role?: UserRole;
  status?: 'active' | 'suspended' | 'banned' | 'deleted';
  createdAt?: string;
  lastActive?: string;
  userLevel?: number;
  userXP?: number;
  spentXP?: number;
  activeAvatar?: string;
  activeBorder?: string;
  activeColor?: string;
  unlockedItems?: UnlockedItems;
  friends?: string[];
  habits?: Habit[];
  tasks?: Task[];
  playlists?: Playlist[];
  pomodoroStats?: PomodoroStats;
  motivationalSettings?: MotivationalSettings;
  financeData?: FinanceData;
  badges?: string[];
  completedChallenges?: string[];
}

export interface Habit {
  id: string;
  title: string;
  category: string;
  targetDays: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  durationValue: number;
  durationUnit: 'mins' | 'hours' | 'times' | 'pages';
  targetTimePerDay?: number;
  timeSpentToday?: number;
  currentStreak: number;
  completedDates: string[]; // YYYY-MM-DD
  lastCompletedDate?: string;
  createdAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  category: string;
  priority?: TaskPriority;
  completed: boolean;
  dueDate: string;
  createdAt: string;
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
}

export interface PomodoroStats {
  sessionsToday: number;
  totalFocusTime: number; // in minutes
  currentStreak: number;
  lastSessionDate: string | null;
}

export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

export interface MotivationalSettings {
  enabled: boolean;
  streakCount: number;
  targetCount: number;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description?: string;
  type?: 'expense' | 'income';
  paymentMethod?: 'visa' | 'wallet';
  isEssential?: boolean;
}

export interface SavingsGoal {
  name: string;
  target: number;
  duration: number; // duration in months
  startDate?: string;
}

export interface FinanceData {
  monthYear: string;
  startingDate: string; // YYYY-MM-DD
  monthlyIncome: number;
  dailyBudget: number;
  expenses: Expense[];
  xpBonusClaimedDates: Record<string, boolean>;
  categories: string[];
  currency: string;
  savingsBalance: number;
  savingsGoals: SavingsGoal[];
  activeGoal: SavingsGoal | null;
  essentialCategories: Record<string, boolean>;
  itemPreferences: Record<string, boolean>;
  lastClaimedBonusDate: string;
  visaBalance?: number | null;
  walletBalance?: number | null;
  visaIncluded?: boolean;
  visaAllocation?: number | null;
  walletAllocation?: number | null;
}

export interface Bounty {
  id: string;
  title: string;
  desc: string;
  xp: number;
  type: 'pomodoro' | 'habit' | 'task';
  targetCount: number;
  completed: boolean;
}

export interface BountyStats {
  pomodorosCompletedToday: number;
  habitsCompletedToday: number;
  tasksCompletedToday: number;
  dateStr: string;
}

export interface StoreItem {
  id: string;
  name: string;
  value: string;
  cost: number;
  desc: string;
  /** Sold no longer, but kept so past purchases still show in the accent picker. */
  retired?: boolean;
}

export interface UnlockedItems {
  colors: string[];
  avatars: string[];
  borders: string[];
}

export interface PlaylistVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle?: string;
  completed: boolean;
  durationSeconds?: number;
}

export type PlaylistGroupColor = 'default' | 'rose' | 'amber' | 'emerald' | 'sky' | 'violet' | 'slate';

export interface PlaylistGroup {
  id: string;
  name: string;
  start: number; // 1-indexed
  end: number;   // 1-indexed
  color?: PlaylistGroupColor;
}

export interface Playlist {
  id: string;
  title: string;
  thumbnail: string;
  channel?: string;
  videos: PlaylistVideo[];
  groups?: PlaylistGroup[];
  speed?: number;
  expanded?: boolean;
}

export interface MotivationalSettings {
  enabled: boolean;
  targetCount: number;
  streakCount: number;
}

export interface GlobalChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  prize: number;
  created?: string;
}

export interface GlobalBountyTemplate {
  id: string;
  text: string;
  reward: number;
  countNeeded: number;
  type: 'pomodoro' | 'habits' | 'tasks';
}

export interface XPScalingConfig {
  habit: number;
  task: number;
  pomodoro: number;
  video: number;
  groupBonus: number;
  levelBase: number;
  bountyExpireHours: number;
  financeBonus: number;
  bountiesEnabled: boolean;
}

