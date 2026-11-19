import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  db,
  auth,
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  sendPasswordResetEmail,
} from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import {
  Shield,
  Search,
  RotateCcw,
  ArrowLeft,
  BarChart3,
  Users,
  Gamepad2,
  DollarSign,
  TrendingUp,
  Server,
  Award,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  KeyRound,
  FileText,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/context/ConfirmContext';
import { cn } from '@/lib/utils';
import type {
  UserDoc,
  GlobalChallenge,
  GlobalBountyTemplate,
  XPScalingConfig,
} from '@/types';

type AdminTab = 'analytics' | 'users' | 'gamification' | 'finance';

interface UserRowState {
  role: 'admin' | 'user';
  userLevel: number;
  userXP: number;
  points: number;
  status: 'active' | 'suspended' | 'banned' | 'deleted';
}

const DEFAULT_CATEGORIES_PRESET = [
  'Coffee ☕',
  'Diet & Groceries 🍏',
  'Gaming 🎮',
  'PC Accessories 💻',
  'Transportation 🚗',
];

const DEFAULT_BOUNTIES_FALLBACK: GlobalBountyTemplate[] = [
  {
    id: 'bounty_pomodoro',
    text: '🍅 Pomodoro Blitz: Complete a Focus Session today',
    reward: 300,
    countNeeded: 1,
    type: 'pomodoro',
  },
  {
    id: 'bounty_habits',
    text: '⚡ Habit Crease: Complete 3 habits today',
    reward: 200,
    countNeeded: 3,
    type: 'habits',
  },
  {
    id: 'bounty_todo',
    text: '📝 Task Fold: Complete 2 checklist tasks today',
    reward: 150,
    countNeeded: 2,
    type: 'tasks',
  },
];

export const Admin: React.FC = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  // Users registry
  const [users, setUsers] = useState<Array<UserDoc & { id: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [userEdits, setUserEdits] = useState<Record<string, UserRowState>>({});
  const [savingUid, setSavingUid] = useState<string | null>(null);

  // Gamification states
  const [xpConfig, setXpConfig] = useState<XPScalingConfig>({
    habit: 50,
    task: 30,
    pomodoro: 150,
    video: 40,
    groupBonus: 200,
    levelBase: 500,
    bountyExpireHours: 24,
    financeBonus: 50,
    bountiesEnabled: true,
  });
  const [challenges, setChallenges] = useState<GlobalChallenge[]>([]);
  const [bounties, setBounties] = useState<GlobalBountyTemplate[]>([]);

  // Challenge Form
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeDesc, setNewChallengeDesc] = useState('');
  const [newChallengeTarget, setNewChallengeTarget] = useState(5);
  const [newChallengePrize, setNewChallengePrize] = useState(500);

  // Badge Form
  const [badgeTargetUser, setBadgeTargetUser] = useState('');
  const [badgeName, setBadgeName] = useState('🥇 Productivity Legend');

  // Bounty Form
  const [bountyEditIndex, setBountyEditIndex] = useState<number>(-1);
  const [bountyText, setBountyText] = useState('');
  const [bountyReward, setBountyReward] = useState(100);
  const [bountyCount, setBountyCount] = useState(1);
  const [bountyType, setBountyType] = useState<'pomodoro' | 'habits' | 'tasks'>('pomodoro');

  // Finance states
  const [financeBonusInput, setFinanceBonusInput] = useState(50);
  const [defaultCategories, setDefaultCategories] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('adminDefaultCategories');
      return raw ? JSON.parse(raw) : DEFAULT_CATEGORIES_PRESET;
    } catch {
      return DEFAULT_CATEGORIES_PRESET;
    }
  });
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [inspectedUserUid, setInspectedUserUid] = useState('');
  const [overrideIncome, setOverrideIncome] = useState<number>(0);
  const [overrideSavings, setOverrideSavings] = useState<number>(0);
  const [overrideGoalName, setOverrideGoalName] = useState('');
  const [overrideGoalTarget, setOverrideGoalTarget] = useState<number>(0);
  const [overrideGoalDuration, setOverrideGoalDuration] = useState<number>(6);


  // 1. Fetch All Users
  const fetchAllUsers = async () => {
    if (userRole !== 'admin' || !db) return;
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: Array<UserDoc & { id: string }> = [];
      const editsMap: Record<string, UserRowState> = {};

      snap.forEach((d) => {
        const data = d.data() as UserDoc;
        list.push({ id: d.id, ...data });
        editsMap[d.id] = {
          role: data.role || 'user',
          userLevel: data.userLevel || 1,
          userXP: data.userXP || 0,
          points: data.points || 0,
          status: data.status || 'active',
        };
      });

      list.sort((a, b) => {
        if (a.userNumber && b.userNumber) return a.userNumber - b.userNumber;
        if (a.userNumber) return -1;
        if (b.userNumber) return 1;
        return 0;
      });

      setUsers(list);
      setUserEdits(editsMap);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      toast.error('Failed to load user registry');
    } finally {
      setLoadingUsers(false);
    }
  };

  // 2. Fetch Gamification & Scaling Data
  const fetchGamificationData = async () => {
    if (!db) return;
    try {
      // Scaling settings
      const scaleSnap = await getDoc(doc(db, 'settings', 'gamification'));
      if (scaleSnap.exists()) {
        const d = scaleSnap.data();
        setXpConfig({
          habit: d.habit ?? 50,
          task: d.task ?? 30,
          pomodoro: d.pomodoro ?? 150,
          video: d.video ?? 40,
          groupBonus: d.groupBonus ?? 200,
          levelBase: d.levelBase ?? 500,
          bountyExpireHours: d.bountyExpireHours ?? 24,
          financeBonus: d.financeBonus ?? 50,
          bountiesEnabled: d.bountiesEnabled !== false,
        });
        setFinanceBonusInput(d.financeBonus ?? 50);
      }

      // Challenges
      const chalSnap = await getDocs(collection(db, 'globalChallenges'));
      const chalList: GlobalChallenge[] = [];
      chalSnap.forEach((d) => {
        chalList.push({ id: d.id, ...(d.data() as Omit<GlobalChallenge, 'id'>) });
      });
      setChallenges(chalList);

      // Bounties
      const bountySnap = await getDoc(doc(db, 'settings', 'daily_bounties'));
      if (bountySnap.exists()) {
        setBounties(bountySnap.data().bounties || DEFAULT_BOUNTIES_FALLBACK);
      } else {
        setBounties(DEFAULT_BOUNTIES_FALLBACK);
      }
    } catch (err) {
      console.error('Error fetching gamification data:', err);
    }
  };

  // Master refresh
  const handleRefreshAll = () => {
    fetchAllUsers();
    fetchGamificationData();
    toast.info('Dashboard refreshed');
  };

  useEffect(() => {
    if (userRole === 'admin') {
      fetchAllUsers();
      fetchGamificationData();
    }
  }, [userRole]);

  // Sync inspected user finance fields
  const inspectedUser = useMemo(() => {
    return users.find((u) => u.id === inspectedUserUid) || null;
  }, [users, inspectedUserUid]);

  useEffect(() => {
    if (inspectedUser?.financeData) {
      const fd = inspectedUser.financeData;
      setOverrideIncome(fd.monthlyIncome || 0);
      setOverrideSavings(fd.savingsBalance || 0);
      if (fd.activeGoal) {
        setOverrideGoalName(fd.activeGoal.name || '');
        setOverrideGoalTarget(fd.activeGoal.target || 0);
        setOverrideGoalDuration(fd.activeGoal.duration || 6);
      } else {
        setOverrideGoalName('');
        setOverrideGoalTarget(0);
        setOverrideGoalDuration(6);
      }
    } else {
      setOverrideIncome(0);
      setOverrideSavings(0);
      setOverrideGoalName('');
      setOverrideGoalTarget(0);
      setOverrideGoalDuration(6);
    }
  }, [inspectedUser]);

  // Calculations for Analytics Tab
  const analyticsData = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    let activeToday = 0;
    let activeWeek = 0;
    let totalLevel = 0;
    let totalHabits = 0;
    let totalTasks = 0;
    let totalFocus = 0;
    let totalPlaylists = 0;

    users.forEach((u) => {
      totalLevel += u.userLevel || 1;
      totalHabits += u.habits?.length || 0;
      totalTasks += u.tasks?.length || 0;
      totalFocus += u.pomodoroStats?.sessionsToday || 0;
      totalPlaylists += u.playlists?.length || 0;

      if (u.lastActive) {
        const diff = now - new Date(u.lastActive).getTime();
        if (diff <= oneDay) activeToday++;
        if (diff <= sevenDays) activeWeek++;
      }
    });

    const avgLevel = users.length > 0 ? (totalLevel / users.length).toFixed(1) : '1.0';

    return {
      totalUsers: users.length,
      activeToday,
      activeWeek,
      avgLevel,
      totalHabits,
      totalTasks,
      totalFocus,
      totalPlaylists,
    };
  }, [users]);

  // Calculations for Finance Metrics
  const financeMetrics = useMemo(() => {
    let totalBudget = 0;
    let totalExpensesAmt = 0;
    let totalExpensesCount = 0;
    let usersWithFinance = 0;

    users.forEach((u) => {
      if (u.financeData) {
        usersWithFinance++;
        totalBudget += Number(u.financeData.monthlyIncome || 0);
        if (u.financeData.expenses && Array.isArray(u.financeData.expenses)) {
          totalExpensesCount += u.financeData.expenses.length;
          totalExpensesAmt += u.financeData.expenses.reduce(
            (sum, e) => sum + Number(e.amount || 0),
            0
          );
        }
      }
    });

    const avgBudget = usersWithFinance > 0 ? totalBudget / usersWithFinance : 0;
    return {
      avgBudget,
      totalExpensesAmt,
      totalExpensesCount,
    };
  }, [users]);

  // Filtered Users for Tab 2
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      const name = (u.displayName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const uid = u.id.toLowerCase();
      const num = u.userNumber ? u.userNumber.toString() : '';
      const numHash = u.userNumber ? `#${u.userNumber}` : '';

      const matchesSearch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        uid.includes(q) ||
        num.includes(q) ||
        numHash.includes(q);

      const status = u.status || 'active';
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  // ============================================
  // HANDLERS
  // ============================================

  // User management updates
  const handleUpdateEdit = (
    uid: string,
    field: keyof UserRowState,
    value: string | number
  ) => {
    setUserEdits((prev) => {
      const current = prev[uid] || {
        role: 'user',
        userLevel: 1,
        userXP: 0,
        points: 0,
        status: 'active',
      };
      return {
        ...prev,
        [uid]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSaveUser = async (uid: string) => {
    const edit = userEdits[uid];
    if (!edit || !db) return;
    setSavingUid(uid);

    const safeLevel = Math.max(1, edit.userLevel);
    const safeXP = Math.max(0, edit.userXP);
    const safePoints = Math.max(0, edit.points);

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(
        userRef,
        {
          role: edit.role,
          status: edit.status,
          userLevel: safeLevel,
          userXP: safeXP,
          points: safePoints,
        },
        { merge: true }
      );

      // Update local state if self
      if (user?.uid === uid) {
        localStorage.setItem('userLevel', safeLevel.toString());
        localStorage.setItem('userXP', safeXP.toString());
        localStorage.setItem('points', safePoints.toString());
      }

      toast.success('User updated successfully');
      fetchAllUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error('Failed to update user');
    } finally {
      setSavingUid(null);
    }
  };

  const handleToggleActivityLog = (uid: string) => {
    setExpandedLogs((prev) => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleSendPasswordReset = async (email?: string) => {
    if (!email || !auth) {
      toast.error('No email address available for password reset');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Password reset email sent to ${email}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to send password reset: ${msg}`);
    }
  };

  const handleDeleteUserAccount = async (uid: string, displayName?: string) => {
    const ok = await confirm({
      title: 'Permanently Delete User',
      message:
        '⚠️ WARNING: Are you sure you want to delete this user account? The user will be banned, their username freed, and personal details removed.',
      confirmText: 'Delete User Account',
      variant: 'danger',
    });
    if (!ok) return;
    if (!db) return;

    try {
      if (displayName) {
        await deleteDoc(doc(db, 'usernames', displayName.toLowerCase())).catch(() => {});
      }
      await setDoc(
        doc(db, 'users', uid),
        {
          status: 'deleted',
          role: 'user',
          isDeleted: true,
        },
        { merge: false }
      );

      toast.success('User account deleted and banned');
      fetchAllUsers();
    } catch (err) {
      console.error('Error deleting user account:', err);
      toast.error('Failed to delete user account');
    }
  };

  // Gamification Handlers
  const handleSaveXpScaling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    try {
      await setDoc(
        doc(db, 'settings', 'gamification'),
        {
          habit: xpConfig.habit,
          task: xpConfig.task,
          pomodoro: xpConfig.pomodoro,
          video: xpConfig.video,
          groupBonus: xpConfig.groupBonus,
          levelBase: xpConfig.levelBase,
          bountyExpireHours: xpConfig.bountyExpireHours,
          bountiesEnabled: xpConfig.bountiesEnabled,
        },
        { merge: true }
      );
      toast.success('Dynamic XP scaling configurations updated globally');
    } catch (err) {
      console.error('Error saving XP scaling:', err);
      toast.error('Failed to save scaling configurations');
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newChallengeTitle.trim()) return;
    try {
      const id = `challenge_${Date.now()}`;
      await setDoc(doc(db, 'globalChallenges', id), {
        title: newChallengeTitle.trim(),
        description: newChallengeDesc.trim(),
        target: newChallengeTarget,
        prize: newChallengePrize,
        created: new Date().toISOString(),
      });
      toast.success('Global challenge published successfully');
      setNewChallengeTitle('');
      setNewChallengeDesc('');
      setNewChallengeTarget(5);
      setNewChallengePrize(500);
      fetchGamificationData();
    } catch (err) {
      console.error('Error creating challenge:', err);
      toast.error('Failed to create challenge');
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Global Challenge',
      message: 'Are you sure you want to delete this global challenge?',
      confirmText: 'Delete Challenge',
      variant: 'danger',
    });
    if (!ok) return;
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'globalChallenges', id));
      toast.info('Challenge deleted');
      fetchGamificationData();
    } catch (err) {
      console.error('Error deleting challenge:', err);
      toast.error('Failed to delete challenge');
    }
  };

  const handleAwardBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !badgeTargetUser) {
      toast.error('Please choose a user to award');
      return;
    }

    try {
      const targetSnap = await getDoc(doc(db, 'users', badgeTargetUser));
      if (!targetSnap.exists()) {
        toast.error('User not found');
        return;
      }
      const data = targetSnap.data() as UserDoc;
      const currentBadges = data.badges || [];
      if (currentBadges.includes(badgeName)) {
        toast.error('User already owns this achievement badge');
        return;
      }

      currentBadges.push(badgeName);
      await setDoc(
        doc(db, 'users', badgeTargetUser),
        { badges: currentBadges },
        { merge: true }
      );

      toast.success(`Successfully awarded ${badgeName} achievement!`);
      setBadgeTargetUser('');
      fetchAllUsers();
    } catch (err) {
      console.error('Error awarding badge:', err);
      toast.error('Failed to award badge');
    }
  };

  // Bounty Handlers
  const saveBountiesToDb = async (newBounties: GlobalBountyTemplate[]) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'settings', 'daily_bounties'), {
        bounties: newBounties,
      });
      setBounties(newBounties);
    } catch (err) {
      console.error('Error saving bounties template:', err);
      toast.error('Failed to save daily bounties');
    }
  };

  const handleMoveBounty = async (index: number, dir: number) => {
    const nextIdx = index + dir;
    if (nextIdx < 0 || nextIdx >= bounties.length) return;
    const copy = [...bounties];
    const temp = copy[index];
    copy[index] = copy[nextIdx];
    copy[nextIdx] = temp;
    await saveBountiesToDb(copy);
  };

  const handleDeleteBounty = async (index: number) => {
    const ok = await confirm({
      title: 'Delete Bounty Template',
      message: 'Are you sure you want to delete this daily bounty template?',
      confirmText: 'Delete Template',
      variant: 'danger',
    });
    if (!ok) return;
    const copy = bounties.filter((_, i) => i !== index);
    await saveBountiesToDb(copy);
    handleCancelBountyEdit();
  };

  const handleSaveBountyForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bountyText.trim()) return;

    const copy = [...bounties];
    const newBounty: GlobalBountyTemplate = {
      id: bountyEditIndex >= 0 ? copy[bountyEditIndex].id : `bounty_${Date.now()}`,
      text: bountyText.trim(),
      reward: bountyReward,
      countNeeded: bountyCount,
      type: bountyType,
    };

    if (bountyEditIndex >= 0) {
      copy[bountyEditIndex] = newBounty;
    } else {
      copy.push(newBounty);
    }

    await saveBountiesToDb(copy);
    toast.success(bountyEditIndex >= 0 ? 'Bounty updated' : 'Bounty added');
    handleCancelBountyEdit();
  };

  const handleStartEditBounty = (index: number) => {
    const b = bounties[index];
    if (!b) return;
    setBountyEditIndex(index);
    setBountyText(b.text);
    setBountyReward(b.reward);
    setBountyCount(b.countNeeded);
    setBountyType(b.type);
  };

  const handleCancelBountyEdit = () => {
    setBountyEditIndex(-1);
    setBountyText('');
    setBountyReward(100);
    setBountyCount(1);
    setBountyType('pomodoro');
  };

  // Finance Handlers
  const handleSaveFinanceBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    try {
      await setDoc(
        doc(db, 'settings', 'gamification'),
        { financeBonus: financeBonusInput },
        { merge: true }
      );
      toast.success('Finance XP scaling settings saved');
    } catch (err) {
      console.error('Error saving finance XP bonus:', err);
      toast.error('Failed to save finance settings');
    }
  };

  const handleAddDefaultCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newCategoryInput.trim();
    if (!val || defaultCategories.includes(val)) return;
    const updated = [...defaultCategories, val];
    setDefaultCategories(updated);
    localStorage.setItem('adminDefaultCategories', JSON.stringify(updated));
    setNewCategoryInput('');
    toast.success(`Category "${val}" added`);
  };

  const handleRemoveDefaultCategory = (cat: string) => {
    const updated = defaultCategories.filter((c) => c !== cat);
    setDefaultCategories(updated);
    localStorage.setItem('adminDefaultCategories', JSON.stringify(updated));
    toast.info(`Category "${cat}" removed`);
  };

  const handleSaveAccountOverrides = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectedUser || !db) return;

    try {
      const userRef = doc(db, 'users', inspectedUser.id);
      const fd = inspectedUser.financeData || {
        monthlyIncome: 0,
        dailyBudget: 0,
        expenses: [],
        savingsBalance: 0,
      };

      const updatedFd = {
        ...fd,
        monthlyIncome: overrideIncome,
        savingsBalance: overrideSavings,
      };

      await setDoc(userRef, { financeData: updatedFd }, { merge: true });
      toast.success(`Financial overrides applied for ${inspectedUser.displayName || inspectedUser.email}`);
      fetchAllUsers();
    } catch (err) {
      console.error('Error applying finance override:', err);
      toast.error('Failed to apply finance overrides');
    }
  };

  const handleSaveGoalOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectedUser || !db || !overrideGoalName.trim()) return;

    try {
      const userRef = doc(db, 'users', inspectedUser.id);
      const fd = inspectedUser.financeData || {
        monthlyIncome: 0,
        dailyBudget: 0,
        expenses: [],
        savingsBalance: 0,
      };

      const updatedFd = {
        ...fd,
        activeGoal: {
          name: overrideGoalName.trim(),
          target: overrideGoalTarget,
          duration: overrideGoalDuration,
        },
      };

      await setDoc(userRef, { financeData: updatedFd }, { merge: true });
      toast.success('Savings goal updated');
      fetchAllUsers();
    } catch (err) {
      console.error('Error saving goal override:', err);
      toast.error('Failed to update goal');
    }
  };

  const handleClearUserGoal = async () => {
    const ok = await confirm({
      title: 'Clear Active Savings Goal',
      message: "Are you sure you want to clear this user's active savings goal?",
      confirmText: 'Clear Goal',
      variant: 'warning',
    });
    if (!ok) return;
    if (!inspectedUser || !db) return;

    try {
      const userRef = doc(db, 'users', inspectedUser.id);
      const fd = inspectedUser.financeData || {
        monthlyIncome: 0,
        dailyBudget: 0,
        expenses: [],
        savingsBalance: 0,
      };

      const updatedFd = {
        ...fd,
        activeGoal: null,
      };

      await setDoc(userRef, { financeData: updatedFd }, { merge: true });
      toast.info('Active savings goal cleared');
      fetchAllUsers();
    } catch (err) {
      console.error('Error clearing goal:', err);
      toast.error('Failed to clear goal');
    }
  };

  const handleDeleteUserExpense = async (expenseId: string) => {
    const ok = await confirm({
      title: 'Delete Transaction Log',
      message: 'Are you sure you want to delete this user transaction log?',
      confirmText: 'Delete Transaction',
      variant: 'danger',
    });
    if (!ok) return;
    if (!inspectedUser || !db) return;

    try {
      const userRef = doc(db, 'users', inspectedUser.id);
      const fd = inspectedUser.financeData || {
        monthlyIncome: 0,
        dailyBudget: 0,
        expenses: [],
        savingsBalance: 0,
      };

      const updatedExpenses = (fd.expenses || []).filter((e) => e.id !== expenseId);
      const updatedFd = {
        ...fd,
        expenses: updatedExpenses,
      };

      await setDoc(userRef, { financeData: updatedFd }, { merge: true });
      toast.success('Transaction deleted');
      fetchAllUsers();
    } catch (err) {
      console.error('Error deleting user expense:', err);
      toast.error('Failed to delete transaction');
    }
  };


  // ============================================
  // ACCESS RESTRICTION CHECK
  // ============================================
  if (userRole !== 'admin') {
    return (
      <Card className="p-12 text-center max-w-md mx-auto my-12 border-dashed rounded-3xl">
        <Shield className="w-12 h-12 text-danger mx-auto mb-3" />
        <h2 className="font-display text-2xl font-black text-text-primary">
          Access Restricted
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          You do not have permission to view the Admin Dashboard.
        </p>
        <Button onClick={() => navigate('/habits')} className="mt-4 font-bold text-xs">
          Return to Dashboard
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-primary flex items-center gap-2.5">
            <Shield className="w-8 h-8 text-primary" />
            <span>Admin Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-text-secondary mt-1">
            Manage platform metrics, users, and gamification system
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefreshAll}
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs font-bold gap-1.5"
            title="Refresh list and stats"
          >
            <RotateCcw className={cn('w-3.5 h-3.5', loadingUsers && 'animate-spin')} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => navigate('/habits')}
            variant="secondary"
            size="sm"
            className="h-9 px-3 text-xs font-bold gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-border scrollbar-none">
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2',
            activeTab === 'analytics'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-background'
          )}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2',
            activeTab === 'users'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-background'
          )}
        >
          <Users className="w-4 h-4" />
          <span>User Management</span>
        </button>

        <button
          onClick={() => setActiveTab('gamification')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2',
            activeTab === 'gamification'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-background'
          )}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Gamification Center</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2',
            activeTab === 'finance'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-background'
          )}
        >
          <DollarSign className="w-4 h-4" />
          <span>Finance Manager</span>
        </button>

      </div>

      {/* ========================================================= */}
      {/* TAB 1: ANALYTICS & OVERVIEW                                */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 border-border bg-surface shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-primary font-display">
                {analyticsData.totalUsers}
              </div>
              <div className="text-xs font-bold text-text-secondary mt-1">
                Total Registered Users
              </div>
            </Card>

            <Card className="p-5 border-border bg-surface shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-primary font-display">
                {analyticsData.activeToday}
              </div>
              <div className="text-xs font-bold text-text-secondary mt-1">
                Active Users (Today)
              </div>
            </Card>

            <Card className="p-5 border-border bg-surface shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-primary font-display">
                {analyticsData.activeWeek}
              </div>
              <div className="text-xs font-bold text-text-secondary mt-1">
                Active Users (This Week)
              </div>
            </Card>

            <Card className="p-5 border-border bg-surface shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-primary font-display">
                {analyticsData.avgLevel}
              </div>
              <div className="text-xs font-bold text-text-secondary mt-1">
                Average Platform Level
              </div>
            </Card>
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature Activity Breakdown */}
            <Card className="p-6 border-border bg-surface shadow-xs space-y-4">
              <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>Feature Activity Breakdown</span>
              </h3>

              <div className="space-y-3 divide-y divide-border/60 text-xs">
                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium text-text-secondary">Total Habits Tracked:</span>
                  <span className="font-bold text-primary">{analyticsData.totalHabits}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium text-text-secondary">Total To-Do Tasks:</span>
                  <span className="font-bold text-primary">{analyticsData.totalTasks}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium text-text-secondary">Completed Focus Sessions:</span>
                  <span className="font-bold text-primary">{analyticsData.totalFocus}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium text-text-secondary">Learning Courses Configured:</span>
                  <span className="font-bold text-primary">{analyticsData.totalPlaylists}</span>
                </div>
              </div>
            </Card>

            {/* Platform System Info */}
            <Card className="p-6 border-border bg-surface shadow-xs space-y-4">
              <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <span>Administration System Info</span>
              </h3>

              <div className="space-y-2 text-xs text-text-secondary">
                <p>
                  <strong className="text-text-primary">Active Platform Instance:</strong> Production Hub
                </p>
                <p>
                  <strong className="text-text-primary">Database System:</strong> Cloud Firestore (Online)
                </p>
                <p>
                  <strong className="text-text-primary">Authentication:</strong> Firebase Auth client SDK
                </p>
                <p>
                  <strong className="text-text-primary">Active Roles:</strong> Admin (System Superuser), User (Normal User)
                </p>
                <p className="font-semibold text-primary pt-2">
                  ✓ All modules are synced in real-time across users.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: USER MANAGEMENT                                    */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-text-tertiary" />
              <Input
                placeholder="🔍 Search name, email, uid, or #number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 px-3 text-xs font-semibold rounded-xl border border-border bg-surface text-text-primary outline-hidden"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="banned">Banned Only</option>
            </select>
          </div>

          {/* User Registry Table */}
          <Card className="border-border bg-surface shadow-xs overflow-hidden rounded-2xl">
            <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Registered Users Registry ({filteredUsers.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-background/80 border-b border-border font-bold uppercase text-[10px] text-text-secondary">
                    <th className="p-3 pl-4">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Level</th>
                    <th className="p-3">XP</th>
                    <th className="p-3">Points</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-text-secondary">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mb-2" />
                        <p>Loading users...</p>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-text-secondary">
                        No registered users match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isCurrentUser = u.id === user?.uid;
                      const isDeleted = u.status === 'deleted';
                      const edits = userEdits[u.id] || {
                        role: u.role || 'user',
                        userLevel: u.userLevel || 1,
                        userXP: u.userXP || 0,
                        points: u.points || 0,
                        status: u.status || 'active',
                      };
                      const isExpanded = expandedLogs[u.id] === true;

                      return (
                        <React.Fragment key={u.id}>
                          <tr
                            className={cn(
                              'hover:bg-background/30 transition-colors',
                              isDeleted && 'bg-danger/5 opacity-70'
                            )}
                          >
                            {/* User Avatar & Name */}
                            <td className="p-3 pl-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 overflow-hidden text-xs">
                                  {u.profilePicUrl ? (
                                    <img
                                      src={u.profilePicUrl}
                                      alt={u.displayName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    (u.displayName || u.email || 'U').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-text-primary flex items-center gap-1.5 flex-wrap">
                                    {u.userNumber && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-primary/15 text-primary">
                                        #{u.userNumber}
                                      </span>
                                    )}
                                    <span className={cn(isDeleted && 'line-through text-danger')}>
                                      {u.displayName || 'No Name'}
                                    </span>
                                    {isCurrentUser && (
                                      <span className="text-[10px] font-bold text-primary">(You)</span>
                                    )}
                                    {isDeleted && (
                                      <span className="text-[10px] font-bold text-danger">
                                        (Deleted/Banned)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-text-secondary truncate max-w-[160px]">
                                    {u.email || 'No email'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="p-3">
                              <select
                                value={edits.role}
                                onChange={(e) =>
                                  handleUpdateEdit(u.id, 'role', e.target.value as any)
                                }
                                disabled={isCurrentUser || isDeleted}
                                className="h-8 px-2 text-xs rounded-lg border border-border bg-surface text-text-primary font-semibold"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>

                            {/* Level */}
                            <td className="p-3">
                              <input
                                type="number"
                                min={1}
                                value={edits.userLevel}
                                onChange={(e) =>
                                  handleUpdateEdit(
                                    u.id,
                                    'userLevel',
                                    parseInt(e.target.value, 10) || 1
                                  )
                                }
                                disabled={isDeleted}
                                className="w-16 h-8 px-2 text-xs rounded-lg border border-border bg-surface font-semibold text-text-primary"
                              />
                            </td>

                            {/* Total XP */}
                            <td className="p-3">
                              <input
                                type="number"
                                min={0}
                                value={edits.userXP}
                                onChange={(e) =>
                                  handleUpdateEdit(
                                    u.id,
                                    'userXP',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                disabled={isDeleted}
                                className="w-20 h-8 px-2 text-xs rounded-lg border border-border bg-surface font-semibold text-text-primary"
                              />
                            </td>

                            {/* Points */}
                            <td className="p-3">
                              <input
                                type="number"
                                min={0}
                                value={edits.points}
                                onChange={(e) =>
                                  handleUpdateEdit(
                                    u.id,
                                    'points',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                disabled={isDeleted}
                                className="w-20 h-8 px-2 text-xs rounded-lg border border-border bg-surface font-semibold text-text-primary"
                              />
                            </td>

                            {/* Status */}
                            <td className="p-3">
                              <select
                                value={edits.status}
                                onChange={(e) =>
                                  handleUpdateEdit(u.id, 'status', e.target.value as any)
                                }
                                disabled={isCurrentUser || isDeleted}
                                className="h-8 px-2 text-xs rounded-lg border border-border bg-surface text-text-primary font-semibold capitalize"
                              >
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="banned">Banned</option>
                                {isDeleted && <option value="deleted">Deleted/Banned</option>}
                              </select>
                            </td>

                            {/* Actions */}
                            <td className="p-3 text-right pr-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveUser(u.id)}
                                  disabled={isDeleted || savingUid === u.id}
                                  className="h-7 px-2.5 text-[11px] font-bold"
                                >
                                  {savingUid === u.id ? 'Saving...' : 'Save'}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleActivityLog(u.id)}
                                  className="h-7 px-2 text-[11px] font-bold gap-1"
                                  title="Activity Logs"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Logs</span>
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSendPasswordReset(u.email)}
                                  disabled={isDeleted || !u.email}
                                  className="h-7 px-2 text-[11px] font-bold gap-1"
                                  title="Password Reset"
                                >
                                  <KeyRound className="w-3 h-3" />
                                  <span>Reset</span>
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteUserAccount(u.id, u.displayName)}
                                  disabled={isCurrentUser || isDeleted}
                                  className="h-7 px-2 text-[11px] font-bold text-danger hover:bg-danger/10"
                                  title="Delete User"
                                >
                                  {isDeleted ? '🚫 Banned' : '🗑️ Delete'}
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {/* Collapsible Activity Panel */}
                          {isExpanded && (
                            <tr className="bg-background/60">
                              <td colSpan={7} className="p-4 pl-8 border-b border-border">
                                <div className="space-y-3 animate-in fade-in-50 duration-200">
                                  <h4 className="font-display text-xs font-bold text-primary flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>User Activity Log & Profile Details ({u.displayName})</span>
                                  </h4>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="p-2.5 rounded-xl border border-border bg-surface">
                                      <div className="text-[10px] text-text-secondary font-medium">
                                        Last Login Timestamp
                                      </div>
                                      <div className="font-bold text-text-primary mt-0.5">
                                        {u.lastActive ? new Date(u.lastActive).toLocaleString() : 'Never active'}
                                      </div>
                                    </div>

                                    <div className="p-2.5 rounded-xl border border-border bg-surface">
                                      <div className="text-[10px] text-text-secondary font-medium">
                                        Habits Configured
                                      </div>
                                      <div className="font-bold text-text-primary mt-0.5">
                                        {u.habits?.length || 0}
                                      </div>
                                    </div>

                                    <div className="p-2.5 rounded-xl border border-border bg-surface">
                                      <div className="text-[10px] text-text-secondary font-medium">
                                        To-Do Tasks
                                      </div>
                                      <div className="font-bold text-text-primary mt-0.5">
                                        {u.tasks?.length || 0}
                                      </div>
                                    </div>

                                    <div className="p-2.5 rounded-xl border border-border bg-surface">
                                      <div className="text-[10px] text-text-secondary font-medium">
                                        Badges Awarded
                                      </div>
                                      <div className="font-bold text-text-primary mt-0.5">
                                        {u.badges && u.badges.length > 0
                                          ? u.badges.join(', ')
                                          : 'None'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: GAMIFICATION CENTER                                */}
      {/* ========================================================= */}
      {activeTab === 'gamification' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Settings & Challenges Builder */}
          <div className="space-y-6">
            {/* Dynamic XP Scaling Settings */}
            <Card className="p-6 border-border bg-surface shadow-xs space-y-4">
              <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                <span>⚙️ Dynamic XP Scaling Coefficients</span>
              </h3>

              <form onSubmit={handleSaveXpScaling} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-text-secondary">
                      XP Per Habit checked
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={xpConfig.habit}
                      onChange={(e) =>
                        setXpConfig({ ...xpConfig, habit: parseInt(e.target.value, 10) || 50 })
                      }
                      className="h-8 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-text-secondary">
                      XP Per Task completed
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={xpConfig.task}
                      onChange={(e) =>
                        setXpConfig({ ...xpConfig, task: parseInt(e.target.value, 10) || 30 })
                      }
                      className="h-8 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-text-secondary">
                      XP Per Pomodoro session
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={xpConfig.pomodoro}
                      onChange={(e) =>
                        setXpConfig({
                          ...xpConfig,
                          pomodoro: parseInt(e.target.value, 10) || 150,
                        })
                      }
                      className="h-8 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-text-secondary">
                      XP Per Video completion
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={xpConfig.video}
                      onChange={(e) =>
                        setXpConfig({ ...xpConfig, video: parseInt(e.target.value, 10) || 40 })
                      }
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary">
                    Base XP required for L2 (linear multiplier)
                  </label>
                  <Input
                    type="number"
                    min={100}
                    value={xpConfig.levelBase}
                    onChange={(e) =>
                      setXpConfig({
                        ...xpConfig,
                        levelBase: parseInt(e.target.value, 10) || 500,
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary">
                    Daily Bounty Expiration (Hours)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    value={xpConfig.bountyExpireHours}
                    onChange={(e) =>
                      setXpConfig({
                        ...xpConfig,
                        bountyExpireHours: parseInt(e.target.value, 10) || 24,
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    checked={xpConfig.bountiesEnabled}
                    onCheckedChange={(checked) =>
                      setXpConfig({ ...xpConfig, bountiesEnabled: checked })
                    }
                  />
                  <span className="font-semibold text-text-primary select-none">
                    Enable Daily Bounties Section for All Users
                  </span>
                </div>

                <Button type="submit" className="w-full h-9 font-bold text-xs mt-2">
                  Save Global Constants
                </Button>
              </form>
            </Card>

            {/* Global Challenges Builder */}
            <Card className="p-6 border-border bg-surface shadow-xs space-y-4">
              <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                <span>🏆 Global Platform Challenges Builder</span>
              </h3>

              <form onSubmit={handleCreateChallenge} className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary">
                    Challenge Name
                  </label>
                  <Input
                    placeholder="e.g., Early Bird Streak"
                    value={newChallengeTitle}
                    onChange={(e) => setNewChallengeTitle(e.target.value)}
                    required
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary">
                    Description
                  </label>
                  <Input
                    placeholder="e.g., Complete 5 focus sessions this week"
                    value={newChallengeDesc}
                    onChange={(e) => setNewChallengeDesc(e.target.value)}
                    required
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-text-secondary">
                      Target Action Count
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={newChallengeTarget}
                      onChange={(e) =>
                        setNewChallengeTarget(parseInt(e.target.value, 10) || 1)
                      }
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-text-secondary">
                      XP Prize Reward
                    </label>
                    <Input
                      type="number"
                      min={10}
                      value={newChallengePrize}
                      onChange={(e) =>
                        setNewChallengePrize(parseInt(e.target.value, 10) || 500)
                      }
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-9 font-bold text-xs mt-2">
                  Broadcast Active Challenge
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Column: Badges, Daily Bounties & Active Challenges */}
          <div className="space-y-6">
            {/* Badge & Achievements Assignment */}
            <Card className="p-6 border-border bg-surface shadow-xs space-y-4">
              <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                <Award className="w-4 h-4 text-warning" />
                <span>Badge & Achievements Assignment</span>
              </h3>

              <form onSubmit={handleAwardBadge} className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary">
                    Select Target User
                  </label>
                  <select
                    value={badgeTargetUser}
                    onChange={(e) => setBadgeTargetUser(e.target.value)}
                    required
                    className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-surface text-text-primary font-semibold mt-1"
                  >
                    <option value="">-- Choose User --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName || u.email} ({u.email || u.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary">
                    Select Achievement Badge
                  </label>
                  <select
                    value={badgeName}
                    onChange={(e) => setBadgeName(e.target.value)}
                    required
                    className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-surface text-text-primary font-semibold mt-1"
                  >
                    <option value="🥇 Productivity Legend">🥇 Productivity Legend</option>
                    <option value="⚡ Habit Hero">⚡ Habit Hero</option>
                    <option value="🍅 Pomodoro Master">🍅 Pomodoro Master</option>
                    <option value="📚 Playlist Scholar">📚 Playlist Scholar</option>
                    <option value="🧘 Mind Artisan">🧘 Mind Artisan</option>
                    <option value="💎 Mornigami Veteran">💎 Mornigami Veteran</option>
                  </select>
                </div>

                <Button type="submit" className="w-full h-9 font-bold text-xs mt-2">
                  Award Badge Immediately
                </Button>
              </form>
            </Card>

            {/* Daily Bounties Manager */}
            <Card className="p-6 border-border bg-surface shadow-xs space-y-4">
              <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span>Daily Bounties Manager</span>
              </h3>

              {/* Bounties List */}
              <div className="space-y-2">
                {bounties.length === 0 ? (
                  <p className="text-xs text-text-secondary text-center py-2">
                    No daily bounties configured.
                  </p>
                ) : (
                  bounties.map((b, index) => {
                    const isFirst = index === 0;
                    const isLast = index === bounties.length - 1;

                    return (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-xl border border-border bg-background flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-text-primary truncate">
                            {b.text}
                          </div>
                          <div className="text-[10px] text-text-secondary mt-0.5">
                            Type: <strong>{b.type}</strong> • Target: <strong>{b.countNeeded}</strong> •
                            Reward: <strong className="text-warning">+{b.reward} XP</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isFirst}
                            onClick={() => handleMoveBounty(index, -1)}
                            className="h-6 w-6 p-0"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isLast}
                            onClick={() => handleMoveBounty(index, 1)}
                            className="h-6 w-6 p-0"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEditBounty(index)}
                            className="h-6 w-6 p-0 text-primary"
                            title="Edit Bounty"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteBounty(index)}
                            className="h-6 w-6 p-0 text-danger"
                            title="Delete Bounty"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add / Edit Bounty Form */}
              <div className="pt-3 border-t border-dashed border-border space-y-3">
                <h4 className="text-xs font-bold text-text-primary">
                  {bountyEditIndex >= 0 ? '✏️ Edit Daily Bounty' : '➕ Add New Daily Bounty'}
                </h4>

                <form onSubmit={handleSaveBountyForm} className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-text-secondary">
                      Bounty Text & Icon
                    </label>
                    <Input
                      placeholder="e.g. 🍅 Pomodoro Blitz: Complete a Focus Session"
                      value={bountyText}
                      onChange={(e) => setBountyText(e.target.value)}
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-text-secondary">
                        XP Reward
                      </label>
                      <Input
                        type="number"
                        min={10}
                        value={bountyReward}
                        onChange={(e) =>
                          setBountyReward(parseInt(e.target.value, 10) || 100)
                        }
                        required
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-text-secondary">
                        Target Count
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={bountyCount}
                        onChange={(e) =>
                          setBountyCount(parseInt(e.target.value, 10) || 1)
                        }
                        required
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-text-secondary">
                      Activity Type Trigger
                    </label>
                    <select
                      value={bountyType}
                      onChange={(e) => setBountyType(e.target.value as any)}
                      required
                      className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-surface text-text-primary font-semibold mt-1"
                    >
                      <option value="pomodoro">Focus Session (pomodoro)</option>
                      <option value="habits">Habit checked (habits)</option>
                      <option value="tasks">Task completed (tasks)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button type="submit" className="flex-1 h-8 font-bold text-xs">
                      {bountyEditIndex >= 0 ? 'Save Changes' : 'Add Bounty'}
                    </Button>
                    {bountyEditIndex >= 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelBountyEdit}
                        className="h-8 text-xs font-bold"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </Card>

            {/* Active Platform-Wide Challenges List */}
            <Card className="p-6 border-border bg-surface shadow-xs space-y-4">
              <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                <span>📢 Active Platform-Wide Challenges</span>
              </h3>

              <div className="space-y-2">
                {challenges.length === 0 ? (
                  <p className="text-xs text-text-secondary text-center py-4">
                    No active platform challenges.
                  </p>
                ) : (
                  challenges.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-border bg-background flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-text-primary">{c.title}</div>
                        <div className="text-[11px] text-text-secondary mt-0.5">
                          {c.description}
                        </div>
                        <div className="text-[10px] font-black text-warning mt-1">
                          🏆 Reward: +{c.prize} XP (Goal: {c.target})
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteChallenge(c.id)}
                        className="h-7 text-xs font-bold text-danger hover:bg-danger/10"
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: FINANCE MANAGER                                    */}
      {/* ========================================================= */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Settings & Default Categories */}
            <div className="space-y-6">
              {/* Finance XP Scaling */}
              <Card className="p-6 border-border bg-surface shadow-xs space-y-4">
                <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                  <span>⚙️ Finance XP Scaling Settings</span>
                </h3>

                <form onSubmit={handleSaveFinanceBonus} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-text-secondary">
                      XP Award for Staying Under Daily Spending Limit
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={financeBonusInput}
                      onChange={(e) =>
                        setFinanceBonusInput(parseInt(e.target.value, 10) || 50)
                      }
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>

                  <Button type="submit" className="w-full h-8 font-bold text-xs">
                    Save Finance Scaling Settings
                  </Button>
                </form>
              </Card>

              {/* Global Default Categories */}
              <Card className="p-6 border-border bg-surface shadow-xs space-y-4">
                <div>
                  <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                    <span>🏷️ Global Default Categories</span>
                  </h3>
                  <p className="text-[11px] text-text-secondary mt-1">
                    These categories are automatically assigned to new users when they set up their budget.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {defaultCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-border bg-background text-text-primary shadow-xs"
                    >
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDefaultCategory(cat)}
                        className="text-danger hover:text-danger/80 font-black ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddDefaultCategory} className="flex gap-2">
                  <Input
                    placeholder="e.g. Shopping 🛍️"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button type="submit" size="sm" className="h-8 px-3 font-bold text-xs shrink-0">
                    Add Category
                  </Button>
                </form>
              </Card>
            </div>

            {/* Right: Platform Financial Metrics */}
            <Card className="p-6 border-border bg-surface shadow-xs space-y-4">
              <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span>Platform Financial Metrics</span>
              </h3>

              <div className="space-y-4 divide-y divide-border/60 text-xs">
                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium text-text-secondary">Avg Monthly Budget:</span>
                  <span className="font-bold text-success text-sm">
                    ${financeMetrics.avgBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium text-text-secondary">Total Logged Expenses:</span>
                  <span className="font-bold text-danger text-sm">
                    ${financeMetrics.totalExpensesAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium text-text-secondary">Finance Transactions Logged:</span>
                  <span className="font-bold text-primary text-sm">
                    {financeMetrics.totalExpensesCount}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* User Financial Overview & Override */}
          <Card className="p-6 border-border bg-surface shadow-xs space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-text-primary flex items-center gap-2">
                <span>🔍 User Financial Overview & Override</span>
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Select a user from the registry to inspect transactions, savings goals, and adjust account balance limits.
              </p>
            </div>

            <div className="max-w-md">
              <label className="text-xs font-bold text-text-primary block mb-1">
                Select User Registry File
              </label>
              <select
                value={inspectedUserUid}
                onChange={(e) => setInspectedUserUid(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-border bg-surface text-text-primary font-semibold"
              >
                <option value="">-- Select Registered User --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName || u.email} ({u.id.substring(0, 6)}...)
                  </option>
                ))}
              </select>
            </div>

            {inspectedUser ? (
              <div className="space-y-6 pt-4 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Balance & Vault Overrides */}
                  <div className="p-4 rounded-2xl border border-border bg-background space-y-3">
                    <h4 className="font-bold text-xs text-text-primary">
                      🛠️ Balance & Vault Adjustments
                    </h4>

                    <form onSubmit={handleSaveAccountOverrides} className="space-y-3 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-text-secondary">
                          Main Spending Income Balance ({inspectedUser.financeData?.currency || 'EGP'})
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={overrideIncome}
                          onChange={(e) => setOverrideIncome(parseFloat(e.target.value) || 0)}
                          required
                          className="h-8 text-xs mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-text-secondary">
                          Savings Vault Balance ({inspectedUser.financeData?.currency || 'EGP'})
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={overrideSavings}
                          onChange={(e) => setOverrideSavings(parseFloat(e.target.value) || 0)}
                          required
                          className="h-8 text-xs mt-1"
                        />
                      </div>

                      <Button type="submit" className="w-full h-8 font-bold text-xs mt-1">
                        Save Account Overrides
                      </Button>
                    </form>
                  </div>

                  {/* Active Goal */}
                  <div className="p-4 rounded-2xl border border-border bg-background space-y-3">
                    <h4 className="font-bold text-xs text-text-primary">
                      🎯 Active Savings Goal
                    </h4>

                    {inspectedUser.financeData?.activeGoal ? (
                      <div className="p-3 rounded-xl border border-border bg-surface space-y-2 text-xs">
                        <div className="font-bold text-text-primary">
                          {inspectedUser.financeData.activeGoal.name}
                        </div>
                        <div className="flex justify-between text-[11px] text-text-secondary">
                          <span>
                            Progress: {inspectedUser.financeData.currency || 'EGP'} {overrideSavings} /{' '}
                            {inspectedUser.financeData.activeGoal.target}
                          </span>
                          <strong className="text-primary">
                            {inspectedUser.financeData.activeGoal.target > 0
                              ? Math.min(
                                  100,
                                  Math.round(
                                    (overrideSavings /
                                      inspectedUser.financeData.activeGoal.target) *
                                      100
                                  )
                                )
                              : 0}
                            %
                          </strong>
                        </div>
                        <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all"
                            style={{
                              width: `${
                                inspectedUser.financeData.activeGoal.target > 0
                                  ? Math.min(
                                      100,
                                      Math.round(
                                        (overrideSavings /
                                          inspectedUser.financeData.activeGoal.target) *
                                          100
                                      )
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-text-secondary">
                        No active savings goal configured for this user.
                      </p>
                    )}

                    {/* Modify Savings Goal Form */}
                    <form onSubmit={handleSaveGoalOverride} className="space-y-2 text-xs pt-2">
                      <div className="font-semibold text-[11px] text-text-secondary">
                        Modify Savings Goal
                      </div>
                      <Input
                        placeholder="Goal Name (e.g. SSD)"
                        value={overrideGoalName}
                        onChange={(e) => setOverrideGoalName(e.target.value)}
                        required
                        className="h-7 text-xs"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Target"
                          value={overrideGoalTarget || ''}
                          onChange={(e) =>
                            setOverrideGoalTarget(parseFloat(e.target.value) || 0)
                          }
                          required
                          className="h-7 text-xs"
                        />
                        <Input
                          type="number"
                          placeholder="Duration (Months)"
                          value={overrideGoalDuration || ''}
                          onChange={(e) =>
                            setOverrideGoalDuration(parseInt(e.target.value, 10) || 6)
                          }
                          required
                          className="h-7 text-xs"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" size="sm" className="flex-1 h-7 text-xs font-bold">
                          Save Goal
                        </Button>
                        {inspectedUser.financeData?.activeGoal && (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={handleClearUserGoal}
                            className="h-7 text-xs font-bold"
                          >
                            Clear Goal
                          </Button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>

                {/* User Purchase Ledger */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-text-primary">
                    📋 User Purchase Ledger
                  </h4>

                  <div className="border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-background/80 border-b border-border font-bold uppercase text-[10px] text-text-secondary">
                          <th className="p-2.5 pl-3">Item</th>
                          <th className="p-2.5">Detail</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Amount</th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {inspectedUser.financeData?.expenses &&
                        inspectedUser.financeData.expenses.length > 0 ? (
                          inspectedUser.financeData.expenses.map((exp) => (
                            <tr key={exp.id} className="hover:bg-background/40">
                              <td className="p-2.5 pl-3 font-bold text-text-primary">
                                {exp.name}
                              </td>
                              <td className="p-2.5 text-text-secondary">
                                {exp.description || '—'}
                              </td>
                              <td className="p-2.5 text-text-secondary">{exp.category}</td>
                              <td className="p-2.5 text-text-secondary">
                                {new Date(exp.date).toLocaleDateString()}
                              </td>
                              <td className="p-2.5 font-bold text-danger">
                                {inspectedUser.financeData?.currency || 'EGP'}{' '}
                                {Number(exp.amount).toFixed(2)}
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUserExpense(exp.id)}
                                  className="text-danger hover:text-danger/80 font-black"
                                  title="Delete transaction"
                                >
                                  &times;
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-text-secondary">
                              No expenses logged by this user.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-text-secondary space-y-2">
                <div className="text-4xl">📂</div>
                <p className="text-xs">
                  Select a user from the dropdown registry to inspect transactions, savings goals, and adjust account balance limits.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}


    </div>
  );
};
