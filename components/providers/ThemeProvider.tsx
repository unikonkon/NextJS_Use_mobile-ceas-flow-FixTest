'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/theme-store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
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
    
    // Remove .dark class to prevent override
    html.classList.remove('dark');
    
    // Add current theme class
    html.classList.add(`theme-${theme}`);
  }, [theme]);

  // Apply theme on mount
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const html = document.documentElement;
    const currentTheme = useThemeStore.getState().theme;
    
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
    
    // Remove .dark class
    html.classList.remove('dark');
    
    // Add current theme class
    html.classList.add(`theme-${currentTheme}`);
  }, []);

  return <>{children}</>;
}
