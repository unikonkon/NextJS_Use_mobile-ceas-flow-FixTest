'use client';

import { cn } from '@/lib/utils';
import { DailySummary, TransactionWithCategory } from '@/types';
import { formatCurrency, formatRelativeDate, getDayOfWeek, isSameDay } from '@/lib/utils/format';
import { TransactionCard } from './transaction-card';
import { GroupedTransactionCard } from './grouped-transaction-card';
import { useMemo } from 'react';

interface DayGroupProps {
  summary: DailySummary;
  onTransactionClick?: (id: string) => void;
  className?: string;
  newTransactionIds?: string[];
}

// Group transactions by category ID
interface TransactionGroup {
  categoryId: string;
  transactions: TransactionWithCategory[];
  isSingle: boolean;
}

function groupTransactionsByCategory(
  transactions: TransactionWithCategory[]
): TransactionGroup[] {
  const grouped = transactions.reduce((acc, transaction) => {
    const key = `${transaction.categoryId}-${transaction.type}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(transaction);
    return acc;
  }, {} as Record<string, TransactionWithCategory[]>);

  // Convert to array and sort by first transaction's created time (newest first)
  return Object.entries(grouped)
    .map(([key, txs]) => ({
      categoryId: key,
      transactions: txs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      isSingle: txs.length === 1,
    }))
    .sort((a, b) => {
      // Sort groups by the newest transaction in each group
      const aNewest = a.transactions[0].createdAt.getTime();
      const bNewest = b.transactions[0].createdAt.getTime();
      return bNewest - aNewest;
    });
}

export function DayGroup({
  summary,
  onTransactionClick,
  className,
  newTransactionIds = [],
}: DayGroupProps) {
  const hasIncome = summary.income > 0;
  const hasExpense = summary.expense > 0;
  const total = summary.income - summary.expense;

  // Check if date is today or yesterday
  const isTodayOrYesterday = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(summary.date, today) || isSameDay(summary.date, yesterday);
  }, [summary.date]);

  // Memoize grouped transactions
  const transactionGroups = useMemo(
    () => groupTransactionsByCategory(summary.transactions),
    [summary.transactions]
  );

  return (
    <div className={cn('animate-slide-up', className)}>
      {/* Day Header */}
      <div className="sticky top-12 z-10 -mx-4 mb-2 bg-card px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Date Info */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-foreground">
              {formatRelativeDate(summary.date)}
            </span>
            {isTodayOrYesterday && (
              <span className="text-xs text-muted-foreground">
                {getDayOfWeek(summary.date)}
              </span>
            )}
          </div>

          {/* Day Summary */}
          <div className="flex items-center gap-3 text-xs font-semibold font-numbers">
            {hasIncome && hasExpense && (
              <span className="text-income/80">
                +{formatCurrency(summary.income)}
              </span>
            )}
            {hasIncome && hasExpense && (
              <span className="text-expense/80">
                -{formatCurrency(summary.expense)}
              </span>
            )}
            <span className={cn(
              total >= 0 ? "text-income/80" : "text-expense/80"
            )}>
           รวม:{total >= 0 ? "+" : "-"}{formatCurrency(Math.abs(total))}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions List - Grouped by Category */}
      <div className="space-y-1.5">
        {transactionGroups.map((group) =>
          group.isSingle ? (
            // Single transaction - use regular card
            <TransactionCard
              key={group.transactions[0].id}
              transaction={group.transactions[0]}
              onClick={() => onTransactionClick?.(group.transactions[0].id)}
              isNew={newTransactionIds.includes(group.transactions[0].id)}
            />
          ) : (
            // Multiple transactions - use grouped card
            <GroupedTransactionCard
              key={group.categoryId}
              transactions={group.transactions}
              onTransactionClick={onTransactionClick}
              newTransactionIds={newTransactionIds}
            />
          )
        )}
      </div>
    </div>
  );
}
