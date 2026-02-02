'use client';

import { Header } from '@/components/layout';
import { cn } from '@/lib/utils';
import { AnalyticsContent } from './AnalyticsTabComponent/AnalyticsContent';
import { WalletsContent } from './AnalyticsTabComponent/WalletsContent';
import type { AnalyticsSubTab } from '@/hooks/useTabNavigation';
import { PieChart, Wallet } from 'lucide-react';

// ============================================
// AnalyticsTab - Container with sub-tab toggle
// ============================================
interface AnalyticsTabProps {
  subTab?: AnalyticsSubTab;
  onSubTabChange?: (subTab: AnalyticsSubTab) => void;
}

export function AnalyticsTab({ subTab = 'stats', onSubTabChange }: AnalyticsTabProps) {
  return (
    <>
      <Header
        leftAction={
          <div className="flex gap-1 bg-muted/50 rounded-full p-1">
            <button
              onClick={() => onSubTabChange?.('stats')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300',
                subTab === 'stats'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <PieChart className="size-4" />
              <span>สถิติ</span>
            </button>
            <button
              onClick={() => onSubTabChange?.('wallets')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300',
                subTab === 'wallets'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Wallet className="size-4" />
              <span>กระเป๋าเงิน</span>
            </button>
          </div>
        }
      />

      {subTab === 'stats' ? <AnalyticsContent /> : <WalletsContent />}
    </>
  );
}
