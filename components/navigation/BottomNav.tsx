'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddTransactionSheet } from '@/components/transactions';
import { useTransactionStore, useCategoryStore, useSettingsStore } from '@/lib/stores';
import { TabType, AnalyticsSubTab } from '@/hooks/useTabNavigation';

interface NavItem {
  id: TabType;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    activeIcon: (
      <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
      </svg>
    ),
    label: 'จด',
  },
  {
    id: 'analytics',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
      </svg>
    ),
    activeIcon: (
      <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 0 1 8.25-8.25.75.75 0 0 1 .75.75v6.75H18a.75.75 0 0 1 .75.75 8.25 8.25 0 0 1-16.5 0Z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M12.75 3a.75.75 0 0 1 .75-.75 8.25 8.25 0 0 1 8.25 8.25.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75V3Z" clipRule="evenodd" />
      </svg>
    ),
    label: 'วิเคราะห์',
  },
  {
    id: 'ai-analysis',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    activeIcon: (
      <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.394a.75.75 0 0 1 0 1.424l-1.183.394c-.447.15-.799.5-.948.948l-.394 1.183a.75.75 0 0 1-1.424 0l-.394-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.394a.75.75 0 0 1 0-1.424l1.183-.394a1.5 1.5 0 0 0 .948-.948l.394-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" />
      </svg>
    ),
    label: 'AI',
  },
  {
    id: 'more',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
      </svg>
    ),
    activeIcon: (
      <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clipRule="evenodd" />
      </svg>
    ),
    label: 'เพิ่มเติม',
  },
];

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ item, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-1/2 relative flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-1.5',
        'transition-colors duration-50 active:scale-95 touch-manipulation',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {isActive && (
        <span className="absolute inset-0 rounded-2xl bg-primary/10 animate-scale-in pointer-events-none" />
      )}
      <span className={cn(
        'relative z-10 transition-transform duration-50 pointer-events-none',
        isActive && 'animate-bounce-subtle'
      )}>
        {isActive ? item.activeIcon : item.icon}
      </span>
      <span className={cn(
        'relative z-10 text-[10px] font-medium tracking-wide transition-colors duration-50 pointer-events-none',
        isActive && 'font-semibold'
      )}>
        {item.label}
      </span>
    </button>
  );
}

interface BottomNavProps {
  activeTab: TabType;
  analyticsSubTab?: AnalyticsSubTab;
  onTabChange: (tab: TabType) => void;
}

export function BottomNav({ activeTab, analyticsSubTab, onTabChange }: BottomNavProps) {
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const expenseCategories = useCategoryStore((s) => s.expenseCategories);
  const incomeCategories = useCategoryStore((s) => s.incomeCategories);

  // Settings store for auto-open feature
  const autoOpenTransaction = useSettingsStore((s) => s.autoOpenTransaction);
  const hasAutoOpened = useSettingsStore((s) => s.hasAutoOpened);
  const setHasAutoOpened = useSettingsStore((s) => s.setHasAutoOpened);

  // Controlled sheet state
  const [sheetOpen, setSheetOpen] = useState(false);

  // Auto-open sheet on first load if setting is enabled
  useEffect(() => {
    if (autoOpenTransaction && !hasAutoOpened) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setSheetOpen(true);
        setHasAutoOpened(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoOpenTransaction, hasAutoOpened, setHasAutoOpened]);

  const getIsActive = useCallback((itemId: TabType) => {
    if (itemId === 'wallets') return activeTab === 'analytics' && analyticsSubTab === 'wallets';
    if (itemId === 'analytics') return activeTab === 'analytics' && analyticsSubTab === 'stats';
    return activeTab === itemId;
  }, [activeTab, analyticsSubTab]);

  const handleNavClick = useCallback((itemId: TabType) => {
    if (!getIsActive(itemId)) {
      onTabChange(itemId);
    }
  }, [getIsActive, onTabChange]);

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 pb-safe">
      <div className="mx-auto flex max-w-lg items-center justify-between px-2">
        {/* Left nav items */}
        <div className="flex items-center justify-around flex-1">
          {leftItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={getIsActive(item.id)}
              onClick={() => handleNavClick(item.id)}
            />
          ))}
        </div>

        {/* Center FAB - Add Transaction */}
        <div className="relative flex items-center justify-center px-2">
          <AddTransactionSheet
            trigger={
              <Button
                size="lg"
                className="relative -top-3 size-16 rounded-full shadow-lg shadow-primary/25
                  hover:scale-110 active:scale-95 transition-transform duration-50
                  bg-primary hover:bg-primary/90"
              >
                <Plus className="size-10" />
              </Button>
            }
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            onSubmit={addTransaction}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            onCreateWallet={() => {
              setSheetOpen(false);
              onTabChange('wallets');
            }}
          />
        </div>

        {/* Right nav items */}
        <div className="flex items-center justify-around flex-1">
          {rightItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={getIsActive(item.id)}
              onClick={() => handleNavClick(item.id)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
