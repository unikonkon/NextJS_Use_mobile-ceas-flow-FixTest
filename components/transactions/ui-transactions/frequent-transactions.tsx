'use client';

import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useAnalysisStore } from '@/lib/stores/analysis-store';
import { useCategoryStore } from '@/lib/stores';
import { formatNumber } from '@/lib/utils/format';
import { Repeat, FileText, Zap } from 'lucide-react';
import type { TransactionType, TransactionInput } from '@/types';
import type { Analysis } from '@/lib/stores/db';

interface FrequentTransactionsProps {
  walletId: string | null;
  transactionType: TransactionType;
  onSelect: (input: TransactionInput) => void;
  maxItems?: number;
}

interface FrequentItemProps {
  analysis: Analysis;
  transactionType: TransactionType;
  onClick: () => void;
}

function FrequentItem({ analysis, transactionType, onClick }: FrequentItemProps) {
  const getCategoryById = useCategoryStore((s) => s.getCategoryById);
  const category = getCategoryById(analysis.categoryId);

  if (!category) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 p-1 rounded-xl w-full',
        'bg-muted/30 hover:bg-muted/50 active:scale-[0.98]',
        'border border-transparent hover:border-border/50',
        'transition-all duration-200',
        'text-left'
      )}
    >
      {/* Category Icon */}
      <div
        className={cn(
          'flex size-7 items-center justify-center rounded-lg text-lg shrink-0',
          transactionType === 'expense' ? 'bg-expense/15 text-expense' : 'bg-income/15 text-income'
        )}
      >
        {category.icon || category.name.charAt(0)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">

          <span
            className={cn(
              'text-xs font-bold shrink-0',
              transactionType === 'expense' ? 'text-expense' : 'text-income'
            )}
          >
            ฿{formatNumber(analysis.amount)}
          </span>
        </div>

        {/* Note & Count */}
        <div className="flex items-center justify-between gap-1 mt-0.5">
          {analysis.note ? (
            <span className="text-[10px] text-muted-foreground truncate flex items-center gap-0.5">
              <FileText className="size-2.5" />
              {analysis.note}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0 truncate w-full">
              {category.name}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function FrequentTransactions({
  walletId,
  transactionType,
  onSelect,
  maxItems = 4,
}: FrequentTransactionsProps) {
  const { analysisRecords, isInitialized, loadAnalysis } = useAnalysisStore();

  // Load analysis on mount
  useEffect(() => {
    if (!isInitialized) {
      loadAnalysis();
    }
  }, [isInitialized, loadAnalysis]);

  // Filter and sort by count
  const filteredRecords = analysisRecords.filter(
    (a) =>
      a.type === transactionType &&
      (walletId === null || a.walletId === walletId) &&
      a.count > 1
  );

  // Separate basic and full matches
  const basicMatches = filteredRecords
    .filter((a) => a.matchType === 'basic')
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);

  const fullMatches = filteredRecords
    .filter((a) => a.matchType === 'full')
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);

  // Handle item selection
  const handleSelect = (analysis: Analysis) => {
    onSelect({
      type: analysis.type,
      amount: analysis.amount,
      categoryId: analysis.categoryId,
      walletId: analysis.walletId,
      note: analysis.note,
      date: new Date(),
    });
  };

  // Don't render if no matches
  if (basicMatches.length === 0 && fullMatches.length === 0) {
    return null;
  }

  return (
    <div className="px-1 py-1">
      <div
        className={cn(
          'rounded-xl border border-border/30 bg-card/50 overflow-hidden',
          'transition-all duration-300'
        )}
      >
        {/* Header */}
        {/* <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/30 bg-muted/20">
          <Zap
            className={cn(
              'size-3.5',
              transactionType === 'expense' ? 'text-expense' : 'text-income'
            )}
          />
          <span className="text-xs font-medium text-foreground">รายการใช้ซ้ำบ่อย</span>
        </div> */}

        <div className="p-2 space-y-3">
          {/* Basic Matches Section */}
          {basicMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1.5 px-1">
                <span className="text-[10px] font-medium text-muted-foreground">
                  เลือกใช้ซ้ำ หมวดหมู่ + จำนวนเงิน
                </span>
                <span
                  className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full',
                    transactionType === 'expense'
                      ? 'bg-expense/10 text-expense'
                      : 'bg-income/10 text-income'
                  )}
                >
                  {basicMatches.length}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {basicMatches.map((analysis) => (
                  <FrequentItem
                    key={analysis.id}
                    analysis={analysis}
                    transactionType={transactionType}
                    onClick={() => handleSelect(analysis)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Full Matches Section */}
          {fullMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1.5 px-1">
                <span className="text-[10px] font-medium text-muted-foreground">
                  เลือกใช้ซ้ำ หมวดหมู่ + จำนวนเงิน + บันทึก
                </span>
                <span
                  className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full',
                    transactionType === 'expense'
                      ? 'bg-expense/10 text-expense'
                      : 'bg-income/10 text-income'
                  )}
                >
                  {fullMatches.length}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {fullMatches.map((analysis) => (
                  <FrequentItem
                    key={analysis.id}
                    analysis={analysis}
                    transactionType={transactionType}
                    onClick={() => handleSelect(analysis)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
