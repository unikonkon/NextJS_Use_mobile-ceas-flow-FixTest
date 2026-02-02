'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  showSign?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'income' | 'expense' | 'muted';
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl',
};

const variantClasses = {
  default: 'text-foreground',
  income: 'text-income',
  expense: 'text-expense',
  muted: 'text-muted-foreground',
};

export function CurrencyDisplay({
  amount,
  currency = 'THB',
  showSign = false,
  size = 'md',
  variant = 'default',
  className,
}: CurrencyDisplayProps) {
  const displayAmount = showSign
    ? amount >= 0
      ? `+${formatCurrency(amount, currency)}`
      : formatCurrency(amount, currency)
    : formatCurrency(Math.abs(amount), currency);

  return (
    <span
      className={cn(
        'font-numbers font-semibold tabular-nums tracking-tight',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {displayAmount}
    </span>
  );
}
