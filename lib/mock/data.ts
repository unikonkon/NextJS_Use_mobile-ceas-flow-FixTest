import {
  Wallet,
  TransactionWithCategory,
  DailySummary,
  CategorySummary,
} from '@/types';
// import {
//   expenseCategories,
//   incomeCategories,
// } from '@/lib/constants/categories';
// import { mockTransactions as mockTransactionsFromFile } from '@/lib/mock/mockTransactions';

// Mock Wallets
export const mockWallets: Wallet[] = [
  // {
  //   id: 'w1',
  //       name: 'เงินสด',
  //   type: 'cash',
  //   icon: '💵',
  //   color: 'green',
  //   currency: 'THB',
  //   initialBalance: 5000,
  //   currentBalance: 12450,
  //   isAsset: true,
  //   createdAt: new Date(),
  // },
  // {
  //   id: 'w2',
  //       name: 'ธ.กสิกรไทย',
  //   type: 'bank',
  //   icon: '🏦',
  //   color: 'green',
  //   currency: 'THB',
  //   initialBalance: 50000,
  //   currentBalance: 145680,
  //   isAsset: true,
  //   createdAt: new Date(),
  // },
  // {
  //   id: 'w3',
  //       name: 'PromptPay',
  //   type: 'e_wallet',
  //   icon: '📱',
  //   color: 'blue',
  //   currency: 'THB',
  //   initialBalance: 0,
  //   currentBalance: 3200,
  //   isAsset: true,
  //   createdAt: new Date(),
  // },
  // {
  //   id: 'w4',
  //       name: 'บัตรเครดิต KBank',
  //   type: 'credit_card',
  //   icon: '💳',
  //   color: 'purple',
  //   currency: 'THB',
  //   initialBalance: 0,
  //   currentBalance: -15420,
  //   isAsset: false,
  //   createdAt: new Date(),
  // },
];

// Helper to create dates
// const today = new Date();
// const yesterday = new Date(today);
// yesterday.setDate(yesterday.getDate() - 1);
// const twoDaysAgo = new Date(today);
// twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

// Helper to find category by id
// const findExpense = (id: string) => expenseCategories.find((c) => c.id === id)!;
// const findIncome = (id: string) => incomeCategories.find((c) => c.id === id)!;

// Helper function to ensure date is within 1 year range (1 year ago to today)
// const ensureDateInRange = (date: Date): Date => {
//   const today = new Date();
//   today.setHours(23, 59, 59, 999); // End of today
//   const oneYearAgo = new Date(today);
//   oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
//   oneYearAgo.setHours(0, 0, 0, 0); // Start of one year ago
//
//   // If date is before one year ago, set to one year ago
//   if (date.getTime() < oneYearAgo.getTime()) {
//     return new Date(oneYearAgo);
//   }
//   // If date is after today, set to today
//   if (date.getTime() > today.getTime()) {
//     return new Date(today);
//   }
//   return date;
// };

// Generate mock transactions from mockTransactions.ts and merge with local data
// const generateAllMockTransactions = (): TransactionWithCategory[] => {
//   // Get transactions from mockTransactions.ts
//   const transactionsFromFile = mockTransactionsFromFile;
//
//   // Map transactions to use correct wallet and category structure from data.ts
//   const mappedTransactions = transactionsFromFile.map((transaction) => {
//     // Find matching wallet from mockWallets
//     const wallet = mockWallets.find(w => w.id === transaction.walletId) || mockWallets[0];
//
//     // Ensure date is within 1 year range (1 year ago to today)
//     const date = ensureDateInRange(transaction.date);
//
//     // Find category from constants
//     const category = transaction.type === 'expense'
//       ? findExpense(transaction.categoryId)
//       : findIncome(transaction.categoryId);
//
//     return {
//       ...transaction,
//       wallet,
//       category: category || transaction.category,
//       date,
//       createdAt: date,
//       updatedAt: date,
//     };
//   });
//
//   // Sort by date (newest first)
//   return mappedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
// };

// Mock Transactions - disabled, no mock data will be generated
// export const mockTransactions: TransactionWithCategory[] = generateAllMockTransactions();
export const mockTransactions: TransactionWithCategory[] = [];

// Group transactions by day - disabled
// export const mockDailySummaries: DailySummary[] = [
//   {
//     date: today,
//     income: 0,
//     expense: 464,
//     transactions: mockTransactions.filter((t) => t.date.toDateString() === today.toDateString()),
//   },
//   {
//     date: yesterday,
//     income: 45000,
//     expense: 840,
//     transactions: mockTransactions.filter((t) => t.date.toDateString() === yesterday.toDateString()),
//   },
//   {
//     date: twoDaysAgo,
//     income: 0,
//     expense: 9350,
//     transactions: mockTransactions.filter((t) => t.date.toDateString() === twoDaysAgo.toDateString()),
//   },
// ];
export const mockDailySummaries: DailySummary[] = [];

// Mock Category Summaries for Analytics - disabled
// export const mockExpenseSummaries: CategorySummary[] = [
//   { category: findExpense('6'), amount: 8500, percentage: 45.2, transactionCount: 1 },
//   { category: findExpense('1'), amount: 370, percentage: 19.7, transactionCount: 2 },
//   { category: findExpense('14'), amount: 850, percentage: 15.3, transactionCount: 1 },
//   { category: findExpense('18'), amount: 590, percentage: 10.6, transactionCount: 1 },
//   { category: findExpense('11'), amount: 299, percentage: 5.4, transactionCount: 1 },
//   { category: findExpense('3'), amount: 45, percentage: 3.8, transactionCount: 1 },
// ];
export const mockExpenseSummaries: CategorySummary[] = [];

// export const mockIncomeSummaries: CategorySummary[] = [
//   { category: findIncome('101'), amount: 45000, percentage: 100, transactionCount: 1 },
// ];
export const mockIncomeSummaries: CategorySummary[] = [];

// Monthly Summary
export const mockMonthlySummary = {
  income: 0,
  expense: 0,
  balance: 0,
};

// Wallet Summary
export const mockWalletSummary = {
  netWorth: 0,
  totalAssets: 0,
  totalLiabilities: 0,
};
