'use client';

import { useEffect, useState } from 'react';
import { useCategoryStore, useTransactionStore } from '@/lib/stores';

interface StoreProviderProps {
  children: React.ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const isCategoryInitialized = useCategoryStore((s) => s.isInitialized);
  const isTransactionInitialized = useTransactionStore((s) => s.isInitialized);

  useEffect(() => {
    const initStores = async () => {
      // Load categories first, then transactions
      await loadCategories();
      await loadTransactions();
      setIsHydrated(true);
    };

    initStores();
  }, [loadCategories, loadTransactions]);

  // Show loading state while initializing
  if (!isHydrated || !isCategoryInitialized || !isTransactionInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
