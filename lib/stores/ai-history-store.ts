import { create } from 'zustand';
import {
  db,
  AiHistory,
  AiPromptType,
  toStoredAiHistory,
  fromStoredAiHistory,
} from './db';

// ============================================
// Store Interface
// ============================================
interface AiHistoryState {
  // State
  records: AiHistory[];
  isInitialized: boolean;
  isLoading: boolean;

  // Actions
  loadHistory: () => Promise<void>;
  addHistory: (params: {
    walletId: string | null;
    promptType: AiPromptType;
    year: number;
    responseType: 'structured' | 'full' | 'text';
    responseData: unknown;
  }) => Promise<void>;
  deleteHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

// ============================================
// Create Store
// ============================================
export const useAiHistoryStore = create<AiHistoryState>((set, get) => ({
  records: [],
  isInitialized: false,
  isLoading: false,

  loadHistory: async () => {
    if (get().isInitialized || get().isLoading) return;

    set({ isLoading: true });

    try {
      const stored = await db.aiHistory.toArray();
      const records = stored.map(fromStoredAiHistory).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      set({ records, isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('Failed to load AI history:', error);
      set({ isLoading: false });
    }
  },

  addHistory: async ({ walletId, promptType, year, responseType, responseData }) => {
    try {
      const now = new Date();
      const record: AiHistory = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        walletId,
        promptType,
        year,
        responseType,
        responseData: JSON.stringify(responseData),
        createdAt: now,
      };

      await db.aiHistory.put(toStoredAiHistory(record));

      set({ records: [record, ...get().records] });
    } catch (error) {
      console.error('Failed to save AI history:', error);
    }
  },

  deleteHistory: async (id: string) => {
    try {
      await db.aiHistory.delete(id);
      set({ records: get().records.filter((r) => r.id !== id) });
    } catch (error) {
      console.error('Failed to delete AI history:', error);
    }
  },

  clearHistory: async () => {
    try {
      await db.aiHistory.clear();
      set({ records: [] });
    } catch (error) {
      console.error('Failed to clear AI history:', error);
    }
  },
}));
