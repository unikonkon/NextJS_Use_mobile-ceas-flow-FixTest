'use client';

import { useState, useCallback, useMemo } from 'react';

export type TabType = 'home' | 'wallets' | 'analytics' | 'ai-analysis' | 'more';
export type AnalyticsSubTab = 'stats' | 'wallets';

interface UseTabNavigationReturn {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isActive: (tab: TabType) => boolean;
  analyticsSubTab: AnalyticsSubTab;
  setAnalyticsSubTab: (subTab: AnalyticsSubTab) => void;
  handleTabChange: (tab: TabType) => void;
}

export function useTabNavigation(initialTab: TabType = 'home'): UseTabNavigationReturn {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [analyticsSubTab, setAnalyticsSubTab] = useState<AnalyticsSubTab>('stats');

  const isActive = useCallback((tab: TabType) => activeTab === tab, [activeTab]);

  const handleTabChange = useCallback((tab: TabType) => {
    if (tab === 'wallets') {
      setActiveTab('analytics');
      setAnalyticsSubTab('wallets');
    } else if (tab === 'analytics') {
      setActiveTab('analytics');
      setAnalyticsSubTab('stats');
    } else {
      setActiveTab(tab);
    }
  }, []);

  return useMemo(() => ({
    activeTab,
    setActiveTab,
    isActive,
    analyticsSubTab,
    setAnalyticsSubTab,
    handleTabChange,
  }), [activeTab, isActive, analyticsSubTab, handleTabChange]);
}
