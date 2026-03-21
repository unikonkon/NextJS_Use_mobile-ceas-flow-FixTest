import { create } from 'zustand';

// ============================================
// Types
// ============================================
interface AppSettings {
  autoOpenTransaction: boolean;
  frequentOnHome: boolean;
  frequentOnAddSheet: boolean;
}

const SETTINGS_STORAGE_KEY = 'ceas-flow-settings';

// ============================================
// Helper Functions
// ============================================
function getStoredSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return { autoOpenTransaction: false, frequentOnHome: true, frequentOnAddSheet: true };
  }
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored) as AppSettings;
      return {
        autoOpenTransaction: settings.autoOpenTransaction ?? false,
        frequentOnHome: settings.frequentOnHome ?? true,
        frequentOnAddSheet: settings.frequentOnAddSheet ?? true,
      };
    }
  } catch (e) {
    // Ignore parse errors
  }
  return { autoOpenTransaction: false, frequentOnHome: true, frequentOnAddSheet: true };
}

function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // Ignore storage errors
  }
}

// ============================================
// Store Interface
// ============================================
interface SettingsStore {
  autoOpenTransaction: boolean;
  setAutoOpenTransaction: (value: boolean) => void;
  frequentOnHome: boolean;
  setFrequentOnHome: (value: boolean) => void;
  frequentOnAddSheet: boolean;
  setFrequentOnAddSheet: (value: boolean) => void;
  // Track if auto-open has been triggered this session
  hasAutoOpened: boolean;
  setHasAutoOpened: (value: boolean) => void;
}

// ============================================
// Create Store
// ============================================
export const useSettingsStore = create<SettingsStore>((set, get) => {
  const initialSettings = getStoredSettings();

  return {
    // Initial State
    autoOpenTransaction: initialSettings.autoOpenTransaction,
    frequentOnHome: initialSettings.frequentOnHome,
    frequentOnAddSheet: initialSettings.frequentOnAddSheet,
    hasAutoOpened: false,

    // Actions
    setAutoOpenTransaction: (value: boolean) => {
      set({ autoOpenTransaction: value });
      saveSettings({ autoOpenTransaction: value, frequentOnHome: get().frequentOnHome, frequentOnAddSheet: get().frequentOnAddSheet });
    },

    setFrequentOnHome: (value: boolean) => {
      set({ frequentOnHome: value });
      saveSettings({ autoOpenTransaction: get().autoOpenTransaction, frequentOnHome: value, frequentOnAddSheet: get().frequentOnAddSheet });
    },

    setFrequentOnAddSheet: (value: boolean) => {
      set({ frequentOnAddSheet: value });
      saveSettings({ autoOpenTransaction: get().autoOpenTransaction, frequentOnHome: get().frequentOnHome, frequentOnAddSheet: value });
    },

    setHasAutoOpened: (value: boolean) => {
      set({ hasAutoOpened: value });
    },
  };
});
