'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { TransactionWithCategory } from '@/types';
import { formatCurrency, formatTime } from '@/lib/utils/format';
import { ChevronDown, Layers } from 'lucide-react';

interface GroupedTransactionCardProps {
  transactions: TransactionWithCategory[];
  onTransactionClick?: (id: string) => void;
  className?: string;
  newTransactionIds?: string[];
}

export function GroupedTransactionCard({
  transactions,
  onTransactionClick,
  className,
  newTransactionIds = [],
}: GroupedTransactionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // All transactions should have same category and type
  const category = transactions[0].category;
  const type = transactions[0].type;
  const isExpense = type === 'expense';
  const isIncome = type === 'income';

  // Calculate totals
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const currency = transactions[0].currency;
  const count = transactions.length;

  // Check if any transaction is new
  const hasNewTransaction = transactions.some((t) =>
    newTransactionIds.includes(t.id)
  );

  const amountDisplay = isExpense
    ? `-${formatCurrency(totalAmount, currency)}`
    : `+${formatCurrency(totalAmount, currency)}`;

  // Sort transactions by time (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl transition-all duration-300',
        'border-b border-border/30',
        isExpanded
          ? 'bg-card shadow-lg'
          : 'bg-card/50 hover:bg-card hover:shadow-md',
        hasNewTransaction && 'animate-pop-in-glow ring-2 ring-primary/20',
        className
      )}
    >
      {/* Main Summary Row - Clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left',
          'transition-all duration-200',
          'hover:bg-accent/30 active:scale-[0.995] bg-card'
        )}
      >
        {/* Category Icon with Stack Indicator */}
        <div className="relative">
          <div
            className={cn(
              'flex size-11 items-center justify-center rounded-xl text-2xl font-medium',
              'transition-all duration-300',
              'shadow-sm',
              isExpense && 'bg-expense/15 text-expense',
              isIncome && 'bg-income/15 text-income',
            )}
          >
            {category.icon ? (
              <span className="opacity-75">{category.icon}</span>
            ) : (
              <span>{category.name.charAt(0)}</span>
            )}
          </div>

          {/* Stack Count Badge */}
          <div
            className={cn(
              'absolute -bottom-1 -right-1',
              'flex items-center justify-center',
              'size-5 rounded-full text-[10px] font-bold',
              'border-2 border-card shadow-sm',
              'transition-all duration-200',
              isExpense && 'bg-expense text-white',
              isIncome && 'bg-income text-white'
            )}
          >
            {count}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-foreground">
              <span className="mr-1.5 text-xs font-normal text-muted-foreground">
                {formatTime(sortedTransactions[0].date)}
              </span>
              {category.name}
            </span>
            <div
              className={cn(
                'flex items-center gap-0.5 px-1.5 py-0.5 rounded-md',
                'text-[10px] font-medium',
                'bg-muted/60 text-muted-foreground'
              )}
            >
              <Layers className="size-2.5" />
              <span>{count}</span>
            </div>
          </div>

          {/* Preview of notes */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {sortedTransactions
              .filter((t) => t.note)
              .slice(0, 2)
              .map((t, idx) => (
                <span key={t.id} className="truncate max-w-[80px]">
                  {idx > 0 && '• '}
                  {t.note}
                </span>
              ))}
            {sortedTransactions.filter((t) => t.note).length > 2 && (
              <span className="text-muted-foreground/60">...</span>
            )}
          </div>
        </div>

        {/* Expand Arrow */}
        <div
          className={cn(
            'flex size-7 items-center justify-center rounded-full',
            'bg-muted/50 transition-all duration-300',
            isExpanded && 'rotate-180 bg-muted'
          )}
        >
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>

        {/* Amount & Expand Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground">รวม</span>
            <span
              className={cn(
                'font-numbers text-base font-semibold tabular-nums',
                'transition-all duration-200',
                isExpense && 'text-expense',
                isIncome && 'text-income'
              )}
            >
              {amountDisplay}
            </span>
          </div>


        </div>
      </button>

      {/* Expanded Items */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          {/* Divider */}
          <div className="mx-3 border-t border-dashed border-border/50" />

          {/* Individual Transactions */}
          <div className="p-2 pt-1 space-y-0.5">
            {sortedTransactions.map((transaction, idx) => {
              const isNew = newTransactionIds.includes(transaction.id);
              const itemAmount = isExpense
                ? `-${formatCurrency(transaction.amount, transaction.currency)}`
                : `+${formatCurrency(transaction.amount, transaction.currency)}`;

              return (
                <button
                  key={transaction.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTransactionClick?.(transaction.id);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 px-2 py-2 rounded-xl',
                    'text-left transition-all duration-200',
                    'hover:bg-accent/50 active:scale-[0.98]',
                    'border-b border-border/50',
                    isNew && 'bg-primary/5 ring-1 ring-primary/20'
                  )}
                  style={{
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  {/* Mini Timeline Dot */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      className={cn(
                        'size-2 rounded-full',
                        isExpense && 'bg-expense/60',
                        isIncome && 'bg-income/60'
                      )}
                    />
                    {idx < sortedTransactions.length - 1 && (
                      <div
                        className={cn(
                          'w-px h-4',
                          isExpense && 'bg-expense/20',
                          isIncome && 'bg-income/20'
                        )}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {transaction.note ? (
                      <span className="text-sm text-foreground truncate block">
                        {transaction.note}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        ไม่มีบันทึก
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground italic pl-2">
                      {transaction.createdAt.toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Amount */}
                  <span
                    className={cn(
                      'font-numbers text-sm font-medium tabular-nums',
                      isExpense && 'text-expense/80',
                      isIncome && 'text-income/80'
                    )}
                  >
                    {itemAmount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
