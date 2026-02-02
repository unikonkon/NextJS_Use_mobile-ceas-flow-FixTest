import { create } from 'zustand';

// ============================================
// Types
// ============================================
export interface CategoryLimit {
  categoryId: string;
  limit: number;
}

interface AlertSettings {
  monthlyExpenseTarget: number | null;
  isMonthlyTargetEnabled: boolean;
  categoryLimits: CategoryLimit[];
  isCategoryLimitsEnabled: boolean;
}

const ALERT_SETTINGS_KEY = 'ceas-flow-alert-settings';

const DEFAULT_SETTINGS: AlertSettings = {
  monthlyExpenseTarget: null,
  isMonthlyTargetEnabled: false,
  categoryLimits: [],
  isCategoryLimitsEnabled: false,
};

// ============================================
// Helper Functions
// ============================================
function getStoredAlertSettings(): AlertSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(ALERT_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AlertSettings>;
      return {
        monthlyExpenseTarget: parsed.monthlyExpenseTarget ?? null,
        isMonthlyTargetEnabled: parsed.isMonthlyTargetEnabled ?? false,
        categoryLimits: Array.isArray(parsed.categoryLimits) ? parsed.categoryLimits : [],
        isCategoryLimitsEnabled: parsed.isCategoryLimitsEnabled ?? false,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

function saveAlertSettings(settings: AlertSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

// ============================================
// Store Interface
// ============================================
interface AlertSettingsStore extends AlertSettings {
  setMonthlyExpenseTarget: (value: number | null) => void;
  setIsMonthlyTargetEnabled: (value: boolean) => void;
  setCategoryLimits: (limits: CategoryLimit[]) => void;
  addCategoryLimit: (categoryId: string, limit: number) => void;
  removeCategoryLimit: (categoryId: string) => void;
  updateCategoryLimit: (categoryId: string, limit: number) => void;
  setIsCategoryLimitsEnabled: (value: boolean) => void;
}

// ============================================
// Helper to get current settings from state
// ============================================
function getCurrentSettings(state: AlertSettings): AlertSettings {
  return {
    monthlyExpenseTarget: state.monthlyExpenseTarget,
    isMonthlyTargetEnabled: state.isMonthlyTargetEnabled,
    categoryLimits: state.categoryLimits,
    isCategoryLimitsEnabled: state.isCategoryLimitsEnabled,
  };
}

// ============================================
// Create Store
// ============================================
export const useAlertSettingsStore = create<AlertSettingsStore>((set, get) => {
  const initial = getStoredAlertSettings();

  return {
    ...initial,

    setMonthlyExpenseTarget: (value) => {
      set({ monthlyExpenseTarget: value });
      saveAlertSettings(getCurrentSettings({ ...get(), monthlyExpenseTarget: value }));
    },

    setIsMonthlyTargetEnabled: (value) => {
      set({ isMonthlyTargetEnabled: value });
      saveAlertSettings(getCurrentSettings({ ...get(), isMonthlyTargetEnabled: value }));
    },

    setCategoryLimits: (limits) => {
      set({ categoryLimits: limits });
      saveAlertSettings(getCurrentSettings({ ...get(), categoryLimits: limits }));
    },

    addCategoryLimit: (categoryId, limit) => {
      const existing = get().categoryLimits;
      if (existing.some((cl) => cl.categoryId === categoryId)) return;
      const updated = [...existing, { categoryId, limit }];
      set({ categoryLimits: updated });
      saveAlertSettings(getCurrentSettings({ ...get(), categoryLimits: updated }));
    },

    removeCategoryLimit: (categoryId) => {
      const updated = get().categoryLimits.filter((cl) => cl.categoryId !== categoryId);
      set({ categoryLimits: updated });
      saveAlertSettings(getCurrentSettings({ ...get(), categoryLimits: updated }));
    },

    updateCategoryLimit: (categoryId, limit) => {
      const updated = get().categoryLimits.map((cl) =>
        cl.categoryId === categoryId ? { ...cl, limit } : cl
      );
      set({ categoryLimits: updated });
      saveAlertSettings(getCurrentSettings({ ...get(), categoryLimits: updated }));
    },

    setIsCategoryLimitsEnabled: (value) => {
      set({ isCategoryLimitsEnabled: value });
      saveAlertSettings(getCurrentSettings({ ...get(), isCategoryLimitsEnabled: value }));
    },
  };
});
