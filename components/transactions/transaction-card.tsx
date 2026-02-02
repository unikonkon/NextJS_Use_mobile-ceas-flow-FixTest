'use client';

import { cn } from '@/lib/utils';
import { TransactionWithCategory } from '@/types';
import { formatCurrency, formatTime } from '@/lib/utils/format';

interface TransactionCardProps {
  transaction: TransactionWithCategory;
  onClick?: () => void;
  className?: string;
  isNew?: boolean;
}

export function TransactionCard({
  transaction,
  onClick,
  className,
  isNew = false,
}: TransactionCardProps) {
  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';

  const amountDisplay = isExpense
    ? `-${formatCurrency(transaction.amount, transaction.currency)}`
    : `+${formatCurrency(transaction.amount, transaction.currency)}`;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-all duration-200',
        'border-b border-border/50 bg-card',
        'hover:bg-accent/50 active:scale-[0.98]',
        isNew && 'animate-pop-in-glow transaction-new bg-accent/30',
        className
      )}
    >
      {/* Category Initial */}
      <div
        className={cn(
          'flex size-10 items-center justify-center rounded-xl bg-muted/60 text-3xl font-medium',
          isExpense && 'bg-expense/15 text-expense',
          isIncome && 'bg-income/15 text-income'
        )}
      >
        {transaction.category.icon ? (
          <span className="opacity-75">{transaction.category.icon}</span>
        ) : (
          <span>{transaction.category.name.charAt(0)}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <span className="truncate font-semibold text-foreground">
          <span className="mr-1.5 text-xs font-normal text-muted-foreground">
            {formatTime(transaction.date)}
          </span>
          {transaction.category.name}
        </span>

        {transaction.note && (
          <span className="truncate text-xs text-muted-foreground">
            {transaction.note}
          </span>
        )}
      </div>

      {/* Amount */}
      <div className="flex flex-col items-end gap-0.5">
        <span
          className={cn(
            'font-numbers text-base font-semibold tabular-nums',
            isExpense && 'text-expense',
            isIncome && 'text-income'
          )}
        >
          {amountDisplay}
        </span>

        {transaction.wallet && (
          <span className="text-[10px] text-muted-foreground">
            {transaction.wallet.name}
          </span>
        )}
      </div>
    </button>
  );
}
