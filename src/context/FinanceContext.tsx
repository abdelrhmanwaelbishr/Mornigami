import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';
import { loadLocalData, saveLocalData } from '@/lib/storage';
import type { FinanceData, Expense, SavingsGoal } from '@/types';

interface CycleDetails {
  cycleEndDate: Date;
  remainingDays: number;
  formattedRange: string;
}

const DAY_MS = 1000 * 60 * 60 * 24;

/** Add whole months, clamping the day so the 31st lands on the 28th/30th instead of overflowing. */
const addMonths = (d: Date, months: number): Date => {
  const year = d.getFullYear();
  const month = d.getMonth() + months;
  const day = Math.min(d.getDate(), new Date(year, month + 1, 0).getDate());
  return new Date(year, month, day);
};

interface FinanceContextType {
  financeData: FinanceData;
  cycleDetails: CycleDetails;
  setupFinance: (income: number, startingDate: string, currency: string, visaAlloc?: number, walletAlloc?: number) => void;
  logExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addFunds: (amount: number, account: 'visa' | 'wallet') => void;
  transferToSavings: (amount: number, sourceAccount: 'visa' | 'wallet') => boolean;
  setActiveGoal: (goal: SavingsGoal) => void;
  deleteActiveGoal: () => void;
  toggleCategoryEssential: (category: string) => void;
  addCustomCategory: (cat: string) => void;
  removeCategory: (cat: string) => void;
  claimDailyBonusXP: () => boolean;
  isTodayBonusClaimed: boolean;
  totalSpentThisCycle: number;
  remainingBalance: number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const DEFAULT_FINANCE_DATA: FinanceData = {
  monthYear: '',
  startingDate: '',
  monthlyIncome: 0,
  dailyBudget: 0,
  expenses: [],
  xpBonusClaimedDates: {},
  categories: ['Coffee ☕', 'Diet & Groceries 🍏', 'Gaming 🎮', 'PC Accessories 💻', 'Transportation 🚗'],
  currency: 'EGP',
  savingsBalance: 0,
  savingsGoals: [],
  activeGoal: null,
  essentialCategories: {
    'Diet & Groceries 🍏': true,
    'Transportation 🚗': true,
  },
  itemPreferences: {},
  lastClaimedBonusDate: '',
  visaBalance: 0,
  walletBalance: 0,
  visaIncluded: true,
  visaAllocation: 0,
  walletAllocation: 0,
};

export const normalizeFinanceData = (raw?: Partial<FinanceData> | null): FinanceData => {
  if (!raw) return { ...DEFAULT_FINANCE_DATA };
  const categories = Array.isArray(raw.categories) && raw.categories.length > 0
    ? raw.categories
    : DEFAULT_FINANCE_DATA.categories;
  const expenses = Array.isArray(raw.expenses) ? raw.expenses : [];
  const savingsGoals = Array.isArray(raw.savingsGoals) ? raw.savingsGoals : [];
  const essentialCategories = raw.essentialCategories && typeof raw.essentialCategories === 'object'
    ? raw.essentialCategories
    : DEFAULT_FINANCE_DATA.essentialCategories;

  let visaBalance = raw.visaBalance !== undefined && raw.visaBalance !== null ? Number(raw.visaBalance) : null;
  let walletBalance = raw.walletBalance !== undefined && raw.walletBalance !== null ? Number(raw.walletBalance) : null;
  if (visaBalance === null && walletBalance === null) {
    const totalSpent = expenses.filter(e => e.type !== 'income').reduce((sum, e) => sum + (e.amount || 0), 0);
    visaBalance = Math.max(0, (Number(raw.monthlyIncome) || 0) - totalSpent);
    walletBalance = 0;
  } else {
    visaBalance = visaBalance || 0;
    walletBalance = walletBalance || 0;
  }

  return {
    monthYear: raw.monthYear || '',
    startingDate: raw.startingDate || '',
    monthlyIncome: Number(raw.monthlyIncome) || 0,
    dailyBudget: Number(raw.dailyBudget) || 0,
    expenses,
    xpBonusClaimedDates: raw.xpBonusClaimedDates || {},
    categories,
    currency: raw.currency || 'EGP',
    savingsBalance: Number(raw.savingsBalance) || 0,
    savingsGoals,
    activeGoal: raw.activeGoal || null,
    essentialCategories,
    itemPreferences: raw.itemPreferences || {},
    lastClaimedBonusDate: raw.lastClaimedBonusDate || '',
    visaBalance,
    walletBalance,
    visaIncluded: raw.visaIncluded !== undefined ? Boolean(raw.visaIncluded) : true,
    visaAllocation: Number(raw.visaAllocation ?? visaBalance),
    walletAllocation: Number(raw.walletAllocation ?? walletBalance),
  };
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userDoc } = useAuth();
  const { gainXP } = useGamification();

  const [financeData, setFinanceData] = useState<FinanceData>(() => {
    return normalizeFinanceData(loadLocalData<Partial<FinanceData>>('financeData', {}));
  });

  useEffect(() => {
    if (userDoc?.financeData) {
      const normalized = normalizeFinanceData(userDoc.financeData);
      setFinanceData(normalized);
      localStorage.setItem('financeData', JSON.stringify(normalized));
    }
  }, [userDoc]);

  const saveFinance = (data: FinanceData) => {
    const normalized = normalizeFinanceData(data);
    setFinanceData(normalized);
    saveLocalData('financeData', normalized, user?.uid);
  };

  const getCycleDetails = (data: FinanceData = financeData): CycleDetails => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // No usable start date means the cycle is simply the current calendar month.
    const parsedStart = new Date(data?.startingDate || '');
    const startDate = isNaN(parsedStart.getTime())
      ? new Date(today.getFullYear(), today.getMonth(), 1)
      : new Date(parsedStart.getFullYear(), parsedStart.getMonth(), parsedStart.getDate());

    // The cycle recurs monthly, so roll it forward until the period holds today.
    // An expired cycle used to be clamped to "1 day remaining" forever. No clamp
    // here either: a start date later this month must roll back to the period that
    // contains today, or the range would begin in the future.
    let cycles =
      (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
    if (addMonths(startDate, cycles).getTime() > today.getTime()) cycles -= 1;

    const cycleStartDate = addMonths(startDate, cycles);
    const cycleEndDate = addMonths(startDate, cycles + 1);

    // Local calendar days, not UTC milliseconds: a midnight boundary must not shift the count.
    const remainingDays = Math.max(1, Math.round((cycleEndDate.getTime() - today.getTime()) / DAY_MS));

    const formatOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const formattedRange = `${cycleStartDate.toLocaleDateString('default', formatOpts)} - ${cycleEndDate.toLocaleDateString('default', formatOpts)}`;

    return { cycleEndDate, remainingDays, formattedRange };
  };

  const cycleDetails = getCycleDetails();

  const totalSpentThisCycle = (financeData.expenses || [])
    .filter((e) => e.type !== 'income')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const remainingBalance = Math.max(0, (financeData.monthlyIncome || 0) - totalSpentThisCycle);

  const setupFinance = (
    income: number,
    startingDate: string,
    currency: string = 'EGP',
    visaAlloc?: number,
    walletAlloc?: number
  ) => {
    const remainingDays = getCycleDetails({ ...financeData, startingDate }).remainingDays;
    const dailyBudget = parseFloat((income / Math.max(1, remainingDays)).toFixed(2));

    const updated: FinanceData = {
      ...financeData,
      monthlyIncome: income,
      startingDate,
      currency: currency || 'EGP',
      dailyBudget,
      visaBalance: visaAlloc !== undefined ? visaAlloc : income,
      walletBalance: walletAlloc !== undefined ? walletAlloc : 0,
      visaAllocation: visaAlloc !== undefined ? visaAlloc : income,
      walletAllocation: walletAlloc !== undefined ? walletAlloc : 0,
      expenses: [],
    };
    saveFinance(updated);
  };

  const logExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: Date.now().toString(),
    };

    const newExpenses = [newExpense, ...(financeData.expenses || [])];
    const newTotalSpent = newExpenses
      .filter((e) => e.type !== 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const newRemaining = Math.max(0, financeData.monthlyIncome - newTotalSpent);
    const newDaily = parseFloat((newRemaining / Math.max(1, cycleDetails.remainingDays)).toFixed(2));

    // Deduct from appropriate account
    let nextVisa = financeData.visaBalance || 0;
    let nextWallet = financeData.walletBalance || 0;

    if (expenseData.paymentMethod === 'visa') {
      nextVisa = Math.max(0, nextVisa - expenseData.amount);
    } else {
      nextWallet = Math.max(0, nextWallet - expenseData.amount);
    }

    const updated: FinanceData = {
      ...financeData,
      expenses: newExpenses,
      dailyBudget: newDaily,
      visaBalance: nextVisa,
      walletBalance: nextWallet,
    };

    saveFinance(updated);
  };

  const deleteExpense = (id: string) => {
    const expToDelete = financeData.expenses.find((e) => e.id === id);
    if (!expToDelete) return;

    const newExpenses = financeData.expenses.filter((e) => e.id !== id);
    const newTotalSpent = newExpenses
      .filter((e) => e.type !== 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const newRemaining = Math.max(0, financeData.monthlyIncome - newTotalSpent);
    const newDaily = parseFloat((newRemaining / Math.max(1, cycleDetails.remainingDays)).toFixed(2));

    // Refund to appropriate account
    let nextVisa = financeData.visaBalance || 0;
    let nextWallet = financeData.walletBalance || 0;
    if (expToDelete.paymentMethod === 'visa') {
      nextVisa += expToDelete.amount;
    } else {
      nextWallet += expToDelete.amount;
    }

    const updated: FinanceData = {
      ...financeData,
      expenses: newExpenses,
      dailyBudget: newDaily,
      visaBalance: nextVisa,
      walletBalance: nextWallet,
    };
    saveFinance(updated);
  };

  const addFunds = (amount: number, account: 'visa' | 'wallet') => {
    const nextIncome = (financeData.monthlyIncome || 0) + amount;
    const nextVisa = account === 'visa' ? (financeData.visaBalance || 0) + amount : financeData.visaBalance;
    const nextWallet = account === 'wallet' ? (financeData.walletBalance || 0) + amount : financeData.walletBalance;

    const newRemaining = Math.max(0, nextIncome - totalSpentThisCycle);
    const newDaily = parseFloat((newRemaining / Math.max(1, cycleDetails.remainingDays)).toFixed(2));

    const updated: FinanceData = {
      ...financeData,
      monthlyIncome: nextIncome,
      dailyBudget: newDaily,
      visaBalance: nextVisa,
      walletBalance: nextWallet,
    };
    saveFinance(updated);
  };

  const transferToSavings = (amount: number, sourceAccount: 'visa' | 'wallet'): boolean => {
    const currentAccBalance = sourceAccount === 'visa' ? (financeData.visaBalance || 0) : (financeData.walletBalance || 0);
    if (currentAccBalance < amount) return false;

    const nextVisa = sourceAccount === 'visa' ? (financeData.visaBalance || 0) - amount : financeData.visaBalance;
    const nextWallet = sourceAccount === 'wallet' ? (financeData.walletBalance || 0) - amount : financeData.walletBalance;
    const nextSavings = (financeData.savingsBalance || 0) + amount;

    // Deducting from spendable income
    const nextIncome = Math.max(0, (financeData.monthlyIncome || 0) - amount);
    const newRemaining = Math.max(0, nextIncome - totalSpentThisCycle);
    const newDaily = parseFloat((newRemaining / Math.max(1, cycleDetails.remainingDays)).toFixed(2));

    const updated: FinanceData = {
      ...financeData,
      monthlyIncome: nextIncome,
      dailyBudget: newDaily,
      visaBalance: nextVisa,
      walletBalance: nextWallet,
      savingsBalance: nextSavings,
    };
    saveFinance(updated);
    return true;
  };

  const setActiveGoal = (goal: SavingsGoal) => {
    const updated: FinanceData = {
      ...financeData,
      activeGoal: goal,
    };
    saveFinance(updated);
  };

  const deleteActiveGoal = () => {
    const updated: FinanceData = {
      ...financeData,
      activeGoal: null,
    };
    saveFinance(updated);
  };

  const toggleCategoryEssential = (cat: string) => {
    const updatedMap = {
      ...(financeData.essentialCategories || {}),
      [cat]: !financeData.essentialCategories?.[cat],
    };
    const updated: FinanceData = {
      ...financeData,
      essentialCategories: updatedMap,
    };
    saveFinance(updated);
  };

  const addCustomCategory = (cat: string) => {
    const trimmed = cat.trim();
    const categories = Array.isArray(financeData.categories) ? financeData.categories : [];
    if (!trimmed || categories.includes(trimmed)) return;
    const updated: FinanceData = {
      ...financeData,
      categories: [...categories, trimmed],
    };
    saveFinance(updated);
  };

  const removeCategory = (cat: string) => {
    const categories = Array.isArray(financeData.categories) ? financeData.categories : [];
    const updated: FinanceData = {
      ...financeData,
      categories: categories.filter((c) => c !== cat),
    };
    saveFinance(updated);
  };

  const todayStr = new Date().toISOString().substring(0, 10);
  const isTodayBonusClaimed = Boolean(financeData.xpBonusClaimedDates?.[todayStr]);

  const claimDailyBonusXP = (): boolean => {
    if (isTodayBonusClaimed) return false;

    // Check if user spent less than daily budget today
    const todayExpenses = (financeData.expenses || []).filter(
      (e) => e.date === todayStr && e.type !== 'income'
    );
    const spentToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    if (spentToday > financeData.dailyBudget) {
      return false;
    }

    const updatedClaimed = {
      ...(financeData.xpBonusClaimedDates || {}),
      [todayStr]: true,
    };

    const updated: FinanceData = {
      ...financeData,
      xpBonusClaimedDates: updatedClaimed,
      lastClaimedBonusDate: todayStr,
    };
    saveFinance(updated);

    gainXP(50, 'Daily Budget Bonus Claimed');
    return true;
  };

  return (
    <FinanceContext.Provider
      value={{
        financeData,
        cycleDetails,
        setupFinance,
        logExpense,
        deleteExpense,
        addFunds,
        transferToSavings,
        setActiveGoal,
        deleteActiveGoal,
        toggleCategoryEssential,
        addCustomCategory,
        removeCategory,
        claimDailyBonusXP,
        isTodayBonusClaimed,
        totalSpentThisCycle,
        remainingBalance,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
