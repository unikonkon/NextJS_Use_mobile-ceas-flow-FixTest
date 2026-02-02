'use client';

import { cn } from '@/lib/utils';
import { DailySummary } from '@/types';
import { DayGroup } from './day-group';
import { EmptyState } from '@/components/common/empty-state';

interface TransactionListProps {
  dailySummaries: DailySummary[];
  onTransactionClick?: (id: string) => void;
  className?: string;
  newTransactionIds?: string[];
}

export function TransactionList({
  dailySummaries,
  onTransactionClick,
  className,
  newTransactionIds = [],
}: TransactionListProps) {
  if (dailySummaries.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="ยังไม่มีรายการ"
        description="เริ่มบันทึกรายรับรายจ่ายของคุณวันนี้"
      />
    );
  }

  return (
    <div className={cn('space-y-6 stagger-children', className)}>
      {dailySummaries.map((summary) => (
        <DayGroup
          key={summary.date.toISOString()}
          summary={summary}
          onTransactionClick={onTransactionClick}
          newTransactionIds={newTransactionIds}
        />
      ))}
    </div>
  );
}
