import { create } from 'zustand';
import {
  TransactionWithCategory,
  TransactionInput,
  TransactionType,
  DailySummary,
} from '@/types';
import { db, toStoredTransaction, fromStoredTransaction } from './db';
import { useCategoryStore } from './category-store';
import { useAnalysisStore } from './analysis-store';
// import { mockTransactions } from '@/lib/mock/data';

// ============================================
// Helper Functions
// ============================================
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

function filterTransactionsByMonth(
  transactions: TransactionWithCategory[],
  selectedMonth: Date
): TransactionWithCategory[] {
  const month = selectedMonth.getMonth();
  const year = selectedMonth.getFullYear();
  return transactions.filter((t) => {
    return t.date.getMonth() === month && t.date.getFullYear() === year;
  });
}

function filterTransactionsByDay(
  transactions: TransactionWithCategory[],
  selectedDay: Date
): TransactionWithCategory[] {
  return transactions.filter((t) => isSameDay(t.date, selectedDay));
}

function filterTransactionsByWallet(
  transactions: TransactionWithCategory[],
  walletId: string | null
): TransactionWithCategory[] {
  if (!walletId) return transactions; // null = All wallets
  return transactions.filter((t) => t.walletId === walletId);
}

function computeDailySummaries(
  transactions: TransactionWithCategory[],
  selectedMonth?: Date,
  selectedDay?: Date | null,
  selectedWalletId?: string | null
): DailySummary[] {
  // Filter by wallet first
  let filteredTransactions = filterTransactionsByWallet(transactions, selectedWalletId ?? null);

  // Then filter by day if provided, otherwise by month
  if (selectedDay) {
    filteredTransactions = filterTransactionsByDay(filteredTransactions, selectedDay);
  } else if (selectedMonth) {
    filteredTransactions = filterTransactionsByMonth(filteredTransactions, selectedMonth);
  }

  const grouped = filteredTransactions.reduce((acc, transaction) => {
    const dateKey = transaction.date.toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: transaction.date,
        income: 0,
        expense: 0,
        transactions: [],
      };
    }
    acc[dateKey].transactions.push(transaction);
    if (transaction.type === 'income') {
      acc[dateKey].income += transaction.amount;
    } else if (transaction.type === 'expense') {
      acc[dateKey].expense += transaction.amount;
    }
    return acc;
  }, {} as Record<string, DailySummary>);

  return Object.values(grouped).sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
}

function computeMonthlySummary(
  transactions: TransactionWithCategory[],
  selectedMonth: Date,
  selectedWalletId?: string | null
) {
  const month = selectedMonth.getMonth();
  const year = selectedMonth.getFullYear();

  // Filter by wallet first
  const walletFiltered = filterTransactionsByWallet(transactions, selectedWalletId ?? null);

  const monthTransactions = walletFiltered.filter((t) => {
    return t.date.getMonth() === month && t.date.getFullYear() === year;
  });

  const income = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, balance: income - expense };
}

// คำนวณยอดคงเหลือของแต่ละ wallet จาก transactions ทั้งหมด
function computeWalletBalances(
  transactions: TransactionWithCategory[]
): Record<string, { income: number; expense: number; balance: number }> {
  const balances: Record<string, { income: number; expense: number; balance: number }> = {};

  transactions.forEach((t) => {
    if (!balances[t.walletId]) {
      balances[t.walletId] = { income: 0, expense: 0, balance: 0 };
    }

    if (t.type === 'income') {
      balances[t.walletId].income += t.amount;
    } else if (t.type === 'expense') {
      balances[t.walletId].expense += t.amount;
    }
  });

  // คำนวณ balance สำหรับแต่ละ wallet
  Object.keys(balances).forEach((walletId) => {
    balances[walletId].balance = balances[walletId].income - balances[walletId].expense;
  });

  return balances;
}

// ============================================
// Wallet Balance Type
export interface WalletBalance {
  income: number;
  expense: number;
  balance: number;
}

// Store Interface
// ============================================
interface TransactionStore {
  // Data
  transactions: TransactionWithCategory[];
  newTransactionIds: string[];
  isLoading: boolean;
  isInitialized: boolean;

  // Computed (stored to avoid recalculation)
  dailySummaries: DailySummary[];
  monthlySummary: { income: number; expense: number; balance: number };
  walletBalances: Record<string, WalletBalance>; // ยอดคงเหลือของแต่ละ wallet

  // UI State
  selectedMonth: Date;
  selectedDay: Date | null;
  selectedWalletId: string | null; // null = All wallets
  toastVisible: boolean;
  toastType: TransactionType;

  // Actions
  loadTransactions: () => Promise<void>;
  addTransaction: (input: TransactionInput) => Promise<void>;
  updateTransaction: (id: string, input: Partial<TransactionInput>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteTransactionsByWalletId: (walletId: string) => Promise<void>;
  getTransactionById: (id: string) => TransactionWithCategory | undefined;
  getWalletBalance: (walletId: string) => WalletBalance;
  setSelectedMonth: (date: Date) => void;
  setSelectedDay: (date: Date | null) => void;
  setSelectedWalletId: (walletId: string | null) => void;
  hideToast: () => void;
}

// ============================================
// localStorage key for persisting selectedWalletId
// ============================================
const SELECTED_WALLET_KEY = 'ceas-flow-selected-wallet-id';

function getStoredWalletId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(SELECTED_WALLET_KEY);
  } catch {
    return null;
  }
}

function setStoredWalletId(walletId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (walletId === null) {
      localStorage.removeItem(SELECTED_WALLET_KEY);
    } else {
      localStorage.setItem(SELECTED_WALLET_KEY, walletId);
    }
  } catch {
    // Ignore localStorage errors
  }
}

// ============================================
// Create Store
// ============================================
export const useTransactionStore = create<TransactionStore>((set, get) => ({
  // Initial State
  transactions: [],
  newTransactionIds: [],
  isLoading: false,
  isInitialized: false,
  dailySummaries: [],
  monthlySummary: { income: 0, expense: 0, balance: 0 },
  walletBalances: {}, // ยอดคงเหลือของแต่ละ wallet
  selectedMonth: new Date(),
  selectedDay: null,
  selectedWalletId: getStoredWalletId(), // โหลดค่าเริ่มต้นจาก localStorage
  toastVisible: false,
  toastType: 'expense',

  // Actions
  loadTransactions: async () => {
    // Prevent multiple loads
    if (get().isLoading || get().isInitialized) return;

    set({ isLoading: true });

    try {
      // Ensure categories are loaded first
      const categoryStore = useCategoryStore.getState();
      if (!categoryStore.isInitialized) {
        await categoryStore.loadCategories();
      }

      // Load from IndexedDB
      const storedTransactions = await db.transactions
        .orderBy('date')
        .reverse()
        .toArray();

      if (storedTransactions.length === 0) {
        // Mock data seeding disabled - start with empty transactions
        // const baseTransactions = mockTransactions.map((t) => ({
        //   id: t.id,
        //   walletId: t.walletId,
        //   categoryId: t.categoryId,
        //   type: t.type,
        //   amount: t.amount,
        //   currency: t.currency,
        //   date: t.date,
        //   note: t.note,
        //   createdAt: t.createdAt,
        //   updatedAt: t.updatedAt,
        // }));
        //
        // await db.transactions.bulkPut(
        //   baseTransactions.map(toStoredTransaction)
        // );
        //
        // const transactionsWithCategory: TransactionWithCategory[] = mockTransactions.map((t) => {
        //   const category = categoryStore.getCategoryById(t.categoryId);
        //   return {
        //     ...t,
        //     category: category || t.category,
        //   };
        // });

        const { selectedMonth, selectedDay, selectedWalletId } = get();
        set({
          transactions: [],
          dailySummaries: computeDailySummaries([], selectedMonth, selectedDay, selectedWalletId),
          monthlySummary: computeMonthlySummary([], selectedMonth, selectedWalletId),
          walletBalances: computeWalletBalances([]),
          isLoading: false,
          isInitialized: true,
        });
      } else {
        // Convert stored transactions and attach categories
        const transactions = storedTransactions.map((s) => {
          const base = fromStoredTransaction(s);
          const category = categoryStore.getCategoryById(s.categoryId);
          return {
            ...base,
            category: category!,
          } as TransactionWithCategory;
        }).filter((t) => t.category); // Filter out transactions with missing categories

        const { selectedMonth, selectedDay, selectedWalletId } = get();
        set({
          transactions,
          dailySummaries: computeDailySummaries(transactions, selectedMonth, selectedDay, selectedWalletId),
          monthlySummary: computeMonthlySummary(transactions, selectedMonth, selectedWalletId),
          walletBalances: computeWalletBalances(transactions),
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  addTransaction: async (input) => {
    const categoryStore = useCategoryStore.getState();
    const category = categoryStore.getCategoryById(input.categoryId);
    if (!category) return;

    const now = input.date ?? new Date();
    const newTransaction: TransactionWithCategory = {
      id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      walletId: input.walletId ?? 'w1',
      categoryId: input.categoryId,
      type: input.type,
      amount: input.amount,
      currency: 'THB',
      date: now,
      note: input.note,
      category,
      createdAt: now,
      updatedAt: now,
    };

    // Update Zustand state immediately for fast UI
    const newTransactions = [newTransaction, ...get().transactions];
    const { selectedMonth, selectedDay, selectedWalletId } = get();

    set({
      transactions: newTransactions,
      newTransactionIds: [...get().newTransactionIds, newTransaction.id],
      dailySummaries: computeDailySummaries(newTransactions, selectedMonth, selectedDay, selectedWalletId),
      monthlySummary: computeMonthlySummary(newTransactions, selectedMonth, selectedWalletId),
      walletBalances: computeWalletBalances(newTransactions),
      toastVisible: true,
      toastType: input.type,
    });

    // Persist to IndexedDB (async, non-blocking)
    try {
      await db.transactions.put(
        toStoredTransaction({
          id: newTransaction.id,
          walletId: newTransaction.walletId,
          categoryId: newTransaction.categoryId,
          type: newTransaction.type,
          amount: newTransaction.amount,
          currency: newTransaction.currency,
          date: newTransaction.date,
          note: newTransaction.note,
          createdAt: newTransaction.createdAt,
          updatedAt: newTransaction.updatedAt,
        })
      );

      // Update Analysis for duplicate detection (V4)
      const analysisStore = useAnalysisStore.getState();
      await analysisStore.updateAnalysisOnNewTransaction({
        id: newTransaction.id,
        walletId: newTransaction.walletId,
        categoryId: newTransaction.categoryId,
        type: newTransaction.type,
        amount: newTransaction.amount,
        currency: newTransaction.currency,
        date: newTransaction.date,
        note: newTransaction.note,
        createdAt: newTransaction.createdAt,
        updatedAt: newTransaction.updatedAt,
      });
    } catch (error) {
      console.error('Failed to persist transaction:', error);
    }

    // Auto hide toast
    setTimeout(() => {
      set({ toastVisible: false });
    }, 2500);

    // Remove new flag
    setTimeout(() => {
      set((state) => ({
        newTransactionIds: state.newTransactionIds.filter(
          (id) => id !== newTransaction.id
        ),
      }));
    }, 3000);
  },

  updateTransaction: async (id, input) => {
    const categoryStore = useCategoryStore.getState();
    const existingTransaction = get().transactions.find((t) => t.id === id);
    if (!existingTransaction) return;

    // Get new category if changed
    const category = input.categoryId
      ? categoryStore.getCategoryById(input.categoryId)
      : existingTransaction.category;
    if (!category) return;

    const now = new Date();
    const updatedTransaction: TransactionWithCategory = {
      ...existingTransaction,
      type: input.type ?? existingTransaction.type,
      amount: input.amount ?? existingTransaction.amount,
      categoryId: input.categoryId ?? existingTransaction.categoryId,
      date: input.date ?? existingTransaction.date,
      note: input.note !== undefined ? input.note : existingTransaction.note,
      category,
      updatedAt: now,
    };

    // Update Zustand state immediately
    const transactions = get().transactions.map((t) =>
      t.id === id ? updatedTransaction : t
    );
    const { selectedMonth, selectedDay, selectedWalletId } = get();

    set({
      transactions,
      dailySummaries: computeDailySummaries(transactions, selectedMonth, selectedDay, selectedWalletId),
      monthlySummary: computeMonthlySummary(transactions, selectedMonth, selectedWalletId),
      walletBalances: computeWalletBalances(transactions),
      toastVisible: true,
      toastType: updatedTransaction.type,
    });

    // Persist to IndexedDB
    try {
      await db.transactions.put(
        toStoredTransaction({
          id: updatedTransaction.id,
          walletId: updatedTransaction.walletId,
          categoryId: updatedTransaction.categoryId,
          type: updatedTransaction.type,
          amount: updatedTransaction.amount,
          currency: updatedTransaction.currency,
          date: updatedTransaction.date,
          note: updatedTransaction.note,
          createdAt: updatedTransaction.createdAt,
          updatedAt: updatedTransaction.updatedAt,
        })
      );
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }

    // Auto hide toast
    setTimeout(() => {
      set({ toastVisible: false });
    }, 2500);
  },

  deleteTransaction: async (id: string) => {
    const transactions = get().transactions.filter((t) => t.id !== id);
    const { selectedMonth, selectedDay, selectedWalletId } = get();

    // Update Zustand state immediately
    set({
      transactions,
      dailySummaries: computeDailySummaries(transactions, selectedMonth, selectedDay, selectedWalletId),
      monthlySummary: computeMonthlySummary(transactions, selectedMonth, selectedWalletId),
      walletBalances: computeWalletBalances(transactions),
    });

    // Delete from IndexedDB
    try {
      await db.transactions.delete(id);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  },

  deleteTransactionsByWalletId: async (walletId: string) => {
    // Filter out transactions for the wallet
    const transactions = get().transactions.filter((t) => t.walletId !== walletId);
    const { selectedMonth, selectedDay, selectedWalletId } = get();

    // Update Zustand state immediately
    set({
      transactions,
      dailySummaries: computeDailySummaries(transactions, selectedMonth, selectedDay, selectedWalletId),
      monthlySummary: computeMonthlySummary(transactions, selectedMonth, selectedWalletId),
      walletBalances: computeWalletBalances(transactions),
    });

    // Bulk delete from IndexedDB using walletId index
    try {
      await db.transactions.where('walletId').equals(walletId).delete();
    } catch (error) {
      console.error('Failed to delete transactions by walletId:', error);
    }
  },

  getTransactionById: (id: string) => {
    return get().transactions.find((t) => t.id === id);
  },

  getWalletBalance: (walletId: string) => {
    const balances = get().walletBalances;
    return balances[walletId] || { income: 0, expense: 0, balance: 0 };
  },

  setSelectedMonth: (date) => {
    const transactions = get().transactions;
    const selectedWalletId = get().selectedWalletId;
    // Clear day selection when month changes
    set({
      selectedMonth: date,
      selectedDay: null,
      dailySummaries: computeDailySummaries(transactions, date, null, selectedWalletId),
      monthlySummary: computeMonthlySummary(transactions, date, selectedWalletId),
    });
  },

  setSelectedDay: (date) => {
    const transactions = get().transactions;
    const selectedMonth = get().selectedMonth;
    const selectedWalletId = get().selectedWalletId;
    set({
      selectedDay: date,
      dailySummaries: computeDailySummaries(transactions, selectedMonth, date, selectedWalletId),
    });
  },

  setSelectedWalletId: (walletId) => {
    const transactions = get().transactions;
    const selectedMonth = get().selectedMonth;
    const selectedDay = get().selectedDay;

    // บันทึกค่าลง localStorage
    setStoredWalletId(walletId);

    set({
      selectedWalletId: walletId,
      dailySummaries: computeDailySummaries(transactions, selectedMonth, selectedDay, walletId),
      monthlySummary: computeMonthlySummary(transactions, selectedMonth, walletId),
    });
  },

  hideToast: () => {
    set({ toastVisible: false });
  },
}));
