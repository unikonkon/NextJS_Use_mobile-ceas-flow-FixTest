import { create } from 'zustand';
import { Wallet } from '@/types';
import { db, toStoredWallet, fromStoredWallet } from './db';
// import { mockWallets } from '@/lib/mock/data';

// ============================================
// Store Interface
// ============================================
interface WalletStore {
  // Data
  wallets: Wallet[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  loadWallets: () => Promise<void>;
  getWalletById: (id: string) => Wallet | undefined;
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => Promise<void>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
}

// ============================================
// Create Store
// ============================================
export const useWalletStore = create<WalletStore>((set, get) => ({
  // Initial State
  wallets: [],
  isLoading: false,
  isInitialized: false,

  // Actions
  loadWallets: async () => {
    if (get().isLoading || get().isInitialized) return;

    set({ isLoading: true });

    try {
      // Load from IndexedDB
      const storedWallets = await db.wallets.toArray();

      if (storedWallets.length === 0) {
        // Mock data seeding disabled - start with empty wallets
        // await db.wallets.bulkPut(mockWallets.map(toStoredWallet));

        set({
          wallets: [],
          isLoading: false,
          isInitialized: true,
        });
      } else {
        const wallets = storedWallets.map(fromStoredWallet);

        set({
          wallets,
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  getWalletById: (id) => {
    return get().wallets.find((w) => w.id === id);
  },

  addWallet: async (walletData) => {
    const now = new Date();
    const newWallet: Wallet = {
      ...walletData,
      id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
    };

    const newWallets = [...get().wallets, newWallet];
    set({ wallets: newWallets });

    try {
      await db.wallets.put(toStoredWallet(newWallet));
    } catch (error) {
      console.error('Failed to add wallet:', error);
    }
  },

  updateWallet: async (id, updates) => {
    const wallets = get().wallets.map((w) =>
      w.id === id ? { ...w, ...updates } : w
    );
    set({ wallets });

    const updatedWallet = wallets.find((w) => w.id === id);
    if (updatedWallet) {
      try {
        await db.wallets.put(toStoredWallet(updatedWallet));
      } catch (error) {
        console.error('Failed to update wallet:', error);
      }
    }
  },

  deleteWallet: async (id) => {
    const wallets = get().wallets.filter((w) => w.id !== id);
    set({ wallets });

    try {
      await db.wallets.delete(id);
    } catch (error) {
      console.error('Failed to delete wallet:', error);
    }
  },
}));
