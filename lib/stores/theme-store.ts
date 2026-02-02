import { create } from 'zustand';

// ============================================
// Types
// ============================================
export type ThemeType = 'light' | 'dark' | 'zinc' | 'stone' | 'cyan' | 'sky' | 'teal' | 'gray' | 'neutral';

const THEME_STORAGE_KEY = 'ceas-flow-theme';

// ============================================
// Helper Functions
// ============================================
function getStoredTheme(): ThemeType {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const theme = JSON.parse(stored) as ThemeType;
      if (['light', 'dark', 'zinc', 'stone', 'cyan', 'sky', 'teal', 'gray', 'neutral'].includes(theme)) {
        return theme;
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  return 'light';
}

function applyThemeClass(theme: ThemeType) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  
  // Remove all theme classes
  const themeClasses = [
    'theme-light',
    'theme-dark',
    'theme-zinc',
    'theme-stone',
    'theme-cyan',
    'theme-sky',
    'theme-teal',
    'theme-gray',
    'theme-neutral'
  ];
  
  themeClasses.forEach(cls => html.classList.remove(cls));
  
  // Remove .dark class if it exists (it might override theme styles)
  html.classList.remove('dark');
  
  // Add new theme class
  const newThemeClass = `theme-${theme}`;
  html.classList.add(newThemeClass);
  
  // Force a reflow to ensure styles are applied
  void html.offsetHeight;
}

// ============================================
// Store Interface
// ============================================
interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  getTheme: () => ThemeType;
}

// ============================================
// Create Store
// ============================================
export const useThemeStore = create<ThemeStore>((set, get) => {
  // Initialize theme from localStorage
  const initialTheme = getStoredTheme();
  
  // Apply theme class on initialization
  if (typeof window !== 'undefined') {
    applyThemeClass(initialTheme);
  }

  return {
    // Initial State
    theme: initialTheme,

    // Actions
    setTheme: (theme: ThemeType) => {
      // Apply theme class immediately before state update
      if (typeof window !== 'undefined') {
        applyThemeClass(theme);
        // Save to localStorage
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
        // Debug log
        console.log('Theme changed to:', theme);
      }
      // Update state
      set({ theme });
    },

    getTheme: () => {
      return get().theme;
    },
  };
});
