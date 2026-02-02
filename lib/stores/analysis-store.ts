import { create } from 'zustand';
import {
  db,
  Analysis,
  toStoredAnalysis,
  fromStoredAnalysis,
} from './db';
import type { Transaction } from '@/types';

// ============================================
// Store Interface
// ============================================
interface AnalysisState {
  // State
  analysisRecords: Analysis[];
  isInitialized: boolean;
  isLoading: boolean;

  // Computed getters
  getAnalysisByWallet: (walletId: string) => Analysis[];
  getAnalysisByType: (type: 'income' | 'expense') => Analysis[];
  getAnalysisByWalletAndType: (walletId: string, type: 'income' | 'expense') => Analysis[];
  getTopDuplicates: (limit?: number) => Analysis[];

  // Actions
  loadAnalysis: () => Promise<void>;
  updateAnalysisOnNewTransaction: (transaction: Transaction) => Promise<void>;
  deleteAnalysisByWalletId: (walletId: string) => Promise<void>;
  clearAnalysis: () => Promise<void>;
  rebuildAnalysis: () => Promise<void>;
}

// ============================================
// Create Store
// ============================================
export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  // Initial State
  analysisRecords: [],
  isInitialized: false,
  isLoading: false,

  // ============================================
  // COMPUTED GETTERS
  // ============================================

  /**
   * ดึง analysis records ตาม walletId
   */
  getAnalysisByWallet: (walletId: string) => {
    return get().analysisRecords.filter((a) => a.walletId === walletId);
  },

  /**
   * ดึง analysis records ตาม type (income/expense)
   */
  getAnalysisByType: (type: 'income' | 'expense') => {
    return get().analysisRecords.filter((a) => a.type === type);
  },

  /**
   * ดึง analysis records ตาม walletId และ type
   */
  getAnalysisByWalletAndType: (walletId: string, type: 'income' | 'expense') => {
    return get().analysisRecords.filter(
      (a) => a.walletId === walletId && a.type === type
    );
  },

  /**
   * ดึง top duplicates เรียงตาม count มากสุด
   */
  getTopDuplicates: (limit = 10) => {
    return [...get().analysisRecords]
      .filter((a) => a.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * โหลด analysis records จาก IndexedDB
   */
  loadAnalysis: async () => {
    if (get().isInitialized || get().isLoading) return;

    set({ isLoading: true });

    try {
      const storedAnalysis = await db.analysis.toArray();
      const analysisRecords = storedAnalysis.map(fromStoredAnalysis);

      set({
        analysisRecords,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load analysis:', error);
      set({ isLoading: false });
    }
  },

  /**
   * อัปเดต analysis เมื่อมี transaction ใหม่
   * - ตรวจสอบ basic match (walletId + type + categoryId + amount)
   * - ตรวจสอบ full match (basic + note)
   */
  updateAnalysisOnNewTransaction: async (transaction: Transaction) => {
    const now = new Date();
    const { analysisRecords } = get();

    try {
      // ============================================
      // 1. Basic Match: walletId + type + categoryId + amount
      // ============================================
      const basicAnalysis = analysisRecords.find(
        (a) =>
          a.matchType === 'basic' &&
          a.walletId === transaction.walletId &&
          a.type === transaction.type &&
          a.categoryId === transaction.categoryId &&
          a.amount === transaction.amount
      );

      if (basicAnalysis) {
        // มีอยู่แล้ว → เพิ่ม count
        const updatedBasic: Analysis = {
          ...basicAnalysis,
          count: basicAnalysis.count + 1,
          lastTransactionId: transaction.id,
          updatedAt: now,
        };
        await db.analysis.put(toStoredAnalysis(updatedBasic));

        // อัปเดต state
        set({
          analysisRecords: analysisRecords.map((a) =>
            a.id === basicAnalysis.id ? updatedBasic : a
          ),
        });
      } else {
        // ยังไม่มี → สร้างใหม่ (count = 1)
        const newBasicAnalysis: Analysis = {
          id: `a-basic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          walletId: transaction.walletId,
          type: transaction.type,
          categoryId: transaction.categoryId,
          amount: transaction.amount,
          matchType: 'basic',
          count: 1,
          lastTransactionId: transaction.id,
          createdAt: now,
          updatedAt: now,
        };
        await db.analysis.put(toStoredAnalysis(newBasicAnalysis));

        set({
          analysisRecords: [...analysisRecords, newBasicAnalysis],
        });
      }

      // ============================================
      // 2. Full Match: walletId + type + categoryId + amount + note
      // ============================================
      if (transaction.note && transaction.note.trim() !== '') {
        const currentRecords = get().analysisRecords;
        const fullAnalysis = currentRecords.find(
          (a) =>
            a.matchType === 'full' &&
            a.walletId === transaction.walletId &&
            a.type === transaction.type &&
            a.categoryId === transaction.categoryId &&
            a.amount === transaction.amount &&
            a.note === transaction.note
        );

        if (fullAnalysis) {
          // มีอยู่แล้ว → เพิ่ม count
          const updatedFull: Analysis = {
            ...fullAnalysis,
            count: fullAnalysis.count + 1,
            lastTransactionId: transaction.id,
            updatedAt: now,
          };
          await db.analysis.put(toStoredAnalysis(updatedFull));

          set({
            analysisRecords: currentRecords.map((a) =>
              a.id === fullAnalysis.id ? updatedFull : a
            ),
          });
        } else {
          // ยังไม่มี → สร้างใหม่ (count = 1)
          const newFullAnalysis: Analysis = {
            id: `a-full-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            walletId: transaction.walletId,
            type: transaction.type,
            categoryId: transaction.categoryId,
            amount: transaction.amount,
            note: transaction.note,
            matchType: 'full',
            count: 1,
            lastTransactionId: transaction.id,
            createdAt: now,
            updatedAt: now,
          };
          await db.analysis.put(toStoredAnalysis(newFullAnalysis));

          set({
            analysisRecords: [...currentRecords, newFullAnalysis],
          });
        }
      }
    } catch (error) {
      console.error('Failed to update analysis:', error);
    }
  },

  /**
   * ลบ analysis ตาม walletId
   */
  deleteAnalysisByWalletId: async (walletId: string) => {
    try {
      // ลบจาก IndexedDB
      await db.analysis.where('walletId').equals(walletId).delete();

      // อัปเดต state
      set({
        analysisRecords: get().analysisRecords.filter((a) => a.walletId !== walletId),
      });
    } catch (error) {
      console.error('Failed to delete analysis by walletId:', error);
    }
  },

  /**
   * ล้าง analysis ทั้งหมด
   */
  clearAnalysis: async () => {
    try {
      await db.analysis.clear();
      set({ analysisRecords: [], isInitialized: false });
    } catch (error) {
      console.error('Failed to clear analysis:', error);
    }
  },

  /**
   * สร้าง analysis ใหม่จาก transactions ทั้งหมด
   */
  rebuildAnalysis: async () => {
    set({ isLoading: true });

    try {
      // 1. ล้าง analysis เดิม
      await db.analysis.clear();

      // 2. โหลด transactions ทั้งหมด
      const transactions = await db.transactions.toArray();

      // 3. สร้าง maps สำหรับนับ
      const basicMap = new Map<string, Analysis>();
      const fullMap = new Map<string, Analysis>();
      const now = new Date();

      for (const storedTx of transactions) {
        // Basic Match Key
        const basicKey = `${storedTx.walletId}|${storedTx.type}|${storedTx.categoryId}|${storedTx.amount}`;

        if (basicMap.has(basicKey)) {
          const existing = basicMap.get(basicKey)!;
          existing.count += 1;
          existing.lastTransactionId = storedTx.id;
          existing.updatedAt = now;
        } else {
          basicMap.set(basicKey, {
            id: `a-basic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            walletId: storedTx.walletId,
            type: storedTx.type,
            categoryId: storedTx.categoryId,
            amount: storedTx.amount,
            matchType: 'basic',
            count: 1,
            lastTransactionId: storedTx.id,
            createdAt: now,
            updatedAt: now,
          });
        }

        // Full Match Key (only if note exists)
        if (storedTx.note && storedTx.note.trim() !== '') {
          const fullKey = `${basicKey}|${storedTx.note}`;

          if (fullMap.has(fullKey)) {
            const existing = fullMap.get(fullKey)!;
            existing.count += 1;
            existing.lastTransactionId = storedTx.id;
            existing.updatedAt = now;
          } else {
            fullMap.set(fullKey, {
              id: `a-full-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              walletId: storedTx.walletId,
              type: storedTx.type,
              categoryId: storedTx.categoryId,
              amount: storedTx.amount,
              note: storedTx.note,
              matchType: 'full',
              count: 1,
              lastTransactionId: storedTx.id,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      }

      // 4. บันทึกลง DB
      const allAnalysis = [...basicMap.values(), ...fullMap.values()];
      await db.analysis.bulkPut(allAnalysis.map(toStoredAnalysis));

      // 5. อัปเดต state
      set({
        analysisRecords: allAnalysis,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to rebuild analysis:', error);
      set({ isLoading: false });
    }
  },
}));
