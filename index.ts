// ============================================
// Transaction Types
// ============================================
export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  walletId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  date: Date;
  note?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionWithCategory extends Transaction {
  category: Category;
  wallet?: Wallet;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  walletId?: string;
  date?: Date;
  note?: string;
}

// ============================================
// Category Types
// ============================================
export type CategoryType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  order?: number; // For sorting categories
  icon?: string;
  color?: string;
}

export interface CategorySummary {
  category: Category;
  amount: number;
  percentage: number;
  transactionCount: number;
}

// ============================================
// Wallet Types
// ============================================
export type WalletType = 'cash' | 'bank' | 'credit_card' | 'e_wallet' | 'savings' | 'daily_expense';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  icon: string;
  color: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  isAsset: boolean;
  createdAt: Date;
}

// ============================================
// Summary Types
// ============================================
export interface DailySummary {
  date: Date;
  income: number;
  expense: number;
  transactions: TransactionWithCategory[];
}
