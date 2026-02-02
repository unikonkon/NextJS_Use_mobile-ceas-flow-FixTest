import { create } from 'zustand';

// ============================================
// Types
// ============================================
interface AppSettings {
  autoOpenTransaction: boolean;
}

const SETTINGS_STORAGE_KEY = 'ceas-flow-settings';

// ============================================
// Helper Functions
// ============================================
function getStoredSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return { autoOpenTransaction: false };
  }
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored) as AppSettings;
      return {
        autoOpenTransaction: settings.autoOpenTransaction ?? false,
      };
    }
  } catch (e) {
    // Ignore parse errors
  }
  return { autoOpenTransaction: false };
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
    hasAutoOpened: false,

    // Actions
    setAutoOpenTransaction: (value: boolean) => {
      const currentSettings = {
        autoOpenTransaction: value,
      };
      saveSettings(currentSettings);
      set({ autoOpenTransaction: value });
    },

    setHasAutoOpened: (value: boolean) => {
      set({ hasAutoOpened: value });
    },
  };
});
