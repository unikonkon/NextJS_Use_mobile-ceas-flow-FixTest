import Dexie, { type EntityTable } from 'dexie';
import type { Transaction, Category, Wallet, WalletType } from '@/types';

// ============================================
// Database Schema
// ============================================

// Stored transaction (dates as ISO strings for IndexedDB)
export interface StoredTransaction {
  id: string;
  walletId: string;
  categoryId: string;
  type: 'expense' | 'income';
  amount: number;
  currency: string;
  date: string; // ISO string
  note?: string;
  imageUrl?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface StoredCategory {
  id: string;
  name: string;
  type: 'expense' | 'income';
  order?: number; // For sorting categories
  icon?: string; // Custom icon selected by user
}

export interface StoredWallet {
  id: string;
  name: string;
  type: WalletType;
  icon: string;
  color: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  isAsset: boolean;
  createdAt: string; // ISO string
}

// ============================================
// AI History Types (NEW in V5)
// ============================================
export type AiPromptType = 'compact' | 'structured' | 'full';

export interface StoredAiHistory {
  id: string;
  walletId: string | null;
  promptType: AiPromptType;
  year: number;
  responseType: 'structured' | 'full' | 'text';
  responseData: string; // JSON stringified
  createdAt: string; // ISO string
}

// ============================================
// Analysis Types (NEW in V4)
// ============================================
export type MatchType = 'basic' | 'full';

export interface StoredAnalysis {
  id: string;
  walletId: string;
  type: 'income' | 'expense';
  categoryId: string;
  amount: number;
  note?: string;
  matchType: MatchType;
  count: number;
  lastTransactionId: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// ============================================
// Dexie Database
// ============================================
export class AppDatabase extends Dexie {
  transactions!: EntityTable<StoredTransaction, 'id'>;
  categories!: EntityTable<StoredCategory, 'id'>;
  wallets!: EntityTable<StoredWallet, 'id'>;
  analysis!: EntityTable<StoredAnalysis, 'id'>;
  aiHistory!: EntityTable<StoredAiHistory, 'id'>;

  constructor() {
    super('CeasFlowDB');

    this.version(1).stores({
      transactions: 'id, walletId, categoryId, type, date, createdAt',
      categories: 'id, type',
      wallets: 'id, type',
    });

    // Version 2: Add order field to categories for sorting
    this.version(2).stores({
      transactions: 'id, walletId, categoryId, type, date, createdAt',
      categories: 'id, type, order',
      wallets: 'id, type',
    });

    // Version 3: Add icon field to categories for custom icons
    this.version(3).stores({
      transactions: 'id, walletId, categoryId, type, date, createdAt',
      categories: 'id, type, order',
      wallets: 'id, type',
    });

    // Version 4: Add analysis table for duplicate detection
    this.version(4).stores({
      transactions: 'id, walletId, categoryId, type, date, createdAt',
      categories: 'id, type, order',
      wallets: 'id, type',
      analysis: 'id, walletId, type, categoryId, amount, note, matchType, count, lastTransactionId, updatedAt',
    });

    // Version 5: Add aiHistory table for AI analysis results
    this.version(5).stores({
      transactions: 'id, walletId, categoryId, type, date, createdAt',
      categories: 'id, type, order',
      wallets: 'id, type',
      analysis: 'id, walletId, type, categoryId, amount, note, matchType, count, lastTransactionId, updatedAt',
      aiHistory: 'id, walletId, promptType, year, createdAt',
    });
  }
}

// Singleton instance
export const db = new AppDatabase();

// ============================================
// Converters: IndexedDB <-> Runtime
// ============================================

export function toStoredTransaction(t: Transaction): StoredTransaction {
  return {
    ...t,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function fromStoredTransaction(s: StoredTransaction): Transaction {
  return {
    ...s,
    date: new Date(s.date),
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  };
}

export function toStoredCategory(c: Category, index?: number): StoredCategory {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    order: c.order ?? index ?? 0,
    icon: c.icon,
  };
}

export function fromStoredCategory(s: StoredCategory): Category {
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    order: s.order ?? 0,
    icon: s.icon,
  };
}

export function toStoredWallet(w: Wallet): StoredWallet {
  return {
    ...w,
    createdAt: w.createdAt.toISOString(),
  };
}

export function fromStoredWallet(s: StoredWallet): Wallet {
  return {
    ...s,
    createdAt: new Date(s.createdAt),
  };
}

// ============================================
// Analysis Converters (NEW in V4)
// ============================================
export interface Analysis {
  id: string;
  walletId: string;
  type: 'income' | 'expense';
  categoryId: string;
  amount: number;
  note?: string;
  matchType: MatchType;
  count: number;
  lastTransactionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toStoredAnalysis(a: Analysis): StoredAnalysis {
  return {
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export function fromStoredAnalysis(s: StoredAnalysis): Analysis {
  return {
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  };
}

// ============================================
// AI History Converters (NEW in V5)
// ============================================
export interface AiHistory {
  id: string;
  walletId: string | null;
  promptType: AiPromptType;
  year: number;
  responseType: 'structured' | 'full' | 'text';
  responseData: string; // JSON stringified
  createdAt: Date;
}

export function toStoredAiHistory(a: AiHistory): StoredAiHistory {
  return {
    ...a,
    createdAt: a.createdAt.toISOString(),
  };
}

export function fromStoredAiHistory(s: StoredAiHistory): AiHistory {
  return {
    ...s,
    createdAt: new Date(s.createdAt),
  };
}
