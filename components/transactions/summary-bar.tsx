'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format';
import { TrendingUp, TrendingDown, Wallet as WalletIcon } from 'lucide-react';
import { Wallet } from '@/types';

interface SummaryBarProps {
  income: number;
  expense: number;
  currency?: string;
  showBalance?: boolean;
  className?: string;
  // Wallet props
  wallet?: Wallet | null;
  walletBalance?: number;
}

export function SummaryBar({
  income,
  expense,
  currency = 'THB',
  showBalance = true,
  className,
  wallet,
  walletBalance,
}: SummaryBarProps) {
  const monthlyBalance = income - expense;
  const displayBalance = walletBalance ?? monthlyBalance;

  // Get wallet type label
  const getWalletTypeLabel = (type: Wallet['type']) => {
    switch (type) {
      case 'cash': return 'เงินสด';
      case 'bank': return 'บัญชีธนาคาร';
      case 'credit_card': return 'บัตรเครดิต';
      case 'e_wallet': return 'E-Wallet';
      case 'savings': return 'บัญชีออมทรัพย์';
      default: return 'บัญชี';
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-card border border-border/40 shadow-sm',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -left-8 -bottom-8 size-32 rounded-full bg-primary/3 blur-2xl" />

      <div className="relative p-4">
        {/* Header - Wallet info or default */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {wallet ? (
              <>
                <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary/15 to-primary/5 border border-primary/20">
                  <span className="text-xl">{wallet.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{wallet.name}</p>
                  <p className="text-xs text-muted-foreground">{getWalletTypeLabel(wallet.type)}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary/15 to-primary/5 border border-primary/20">
                  <svg
                    className="size-6 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="3" y="10" width="4" height="8" rx="1" fill="currentColor" opacity="0.7" />
                    <rect x="9" y="6" width="4" height="12" rx="1" fill="currentColor" />
                    <rect x="15" y="3" width="4" height="15" rx="1" fill="currentColor" opacity="0.7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">ทุกบัญชี</p>
                  <p className="text-xs text-muted-foreground">สรุปรวม</p>
                </div>
              </>
            )}
          </div>

          {/* Total Balance */}
          {showBalance && (
            <div className="text-right">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted/50">
                  <WalletIcon className="size-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mb-0.5">ยอดคงเหลือ</p>
              </div>

              <p
                className={cn(
                  'text-xl font-bold font-numbers tracking-tight',
                  displayBalance >= 0 ? 'text-foreground' : 'text-expense'
                )}
              >
                {displayBalance >= 0 ? '' : '-'}
                {formatCurrency(Math.abs(displayBalance), currency)}
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 mb-1" />

        {/* Income & Expense Row */}
        <div className="flex items-center justify-between">
          {/* Income */}
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-income/10">
              <TrendingUp className="size-4 text-income" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">รายรับ</p>
              <p className="font-numbers text-sm font-semibold text-income">
                +{formatCurrency(income, currency)}
              </p>
            </div>
          </div>

          {/* Expense */}
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-expense/10">
              <TrendingDown className="size-4 text-expense" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">รายจ่าย</p>
              <p className="font-numbers text-sm font-semibold text-expense">
                -{formatCurrency(expense, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
