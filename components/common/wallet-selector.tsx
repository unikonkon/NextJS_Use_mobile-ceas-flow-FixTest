'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check, Wallet as WalletIcon } from 'lucide-react';
import { Wallet } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { WalletBalance } from '@/lib/stores';

interface WalletSelectorProps {
  wallets: Wallet[];
  selectedWalletId: string | null;
  walletBalances: Record<string, WalletBalance>;
  onSelect: (walletId: string | null) => void;
  className?: string;
}

export function WalletSelector({
  wallets,
  selectedWalletId,
  walletBalances,
  onSelect,
  className,
}: WalletSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedWallet = selectedWalletId
    ? wallets.find((w) => w.id === selectedWalletId)
    : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-wallet-selector]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const getWalletIcon = (wallet: Wallet) => {
    return wallet.icon || '💰';
  };

  const getWalletColor = (type: Wallet['type']) => {
    switch (type) {
      case 'cash':
        return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30';
      case 'bank':
        return 'from-blue-500/20 to-blue-600/10 border-blue-500/30';
      case 'credit_card':
        return 'from-purple-500/20 to-purple-600/10 border-purple-500/30';
      case 'e_wallet':
        return 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30';
      case 'savings':
        return 'from-amber-500/20 to-amber-600/10 border-amber-500/30';
      default:
        return 'from-gray-500/20 to-gray-600/10 border-gray-500/30';
    }
  };

  // Get wallet balance from walletBalances (computed from transactions)
  const getWalletBalance = (walletId: string): number => {
    const balance = walletBalances[walletId];
    return balance ? balance.balance : 0;
  };

  // Calculate total balance across all wallets
  const getTotalBalance = (): number => {
    return Object.values(walletBalances).reduce((sum, wb) => sum + wb.balance, 0);
  };

  return (
    <div className={cn('relative', className)} data-wallet-selector>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'gap-2 font-medium transition-all duration-300',
          'hover:bg-accent/50 active:scale-[0.98]',
          'border border-transparent',
          isOpen && 'bg-accent/30 border-border/50'
        )}
      >
        <span className="text-lg">
          {selectedWallet ? getWalletIcon(selectedWallet) : <svg
            className="size-6 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="3" y="10" width="4" height="8" rx="1" fill="currentColor" opacity="0.7" />
            <rect x="9" y="6" width="4" height="12" rx="1" fill="currentColor" />
            <rect x="15" y="3" width="4" height="15" rx="1" fill="currentColor" opacity="0.7" />
          </svg>}
        </span>
        <span className="max-w-[250px] truncate text-sm font-semibold">
          {selectedWallet ? selectedWallet.name : 'เลือกบัญชี'}
        </span>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {/* Dropdown */}
      <div
        className={cn(
          'absolute left-0 top-full z-50 mt-2 w-72',
          'origin-top-left transition-all duration-300',
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
          {/* Header */}
          <div className="border-b border-border/30 bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <WalletIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                เลือกบัญชี
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="max-h-[360px] overflow-y-auto p-2">
            {/* All Wallets Option */}
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl p-3',
                'transition-all duration-200',
                'hover:bg-accent/50 active:scale-[0.98]',
                selectedWalletId === null && 'bg-primary/10 ring-1 ring-primary/30'
              )}
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10 border border-primary/30">
                <span className="text-lg"><svg
                  className="size-6 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="3" y="10" width="4" height="8" rx="1" fill="currentColor" opacity="0.7" />
                  <rect x="9" y="6" width="4" height="12" rx="1" fill="currentColor" />
                  <rect x="15" y="3" width="4" height="15" rx="1" fill="currentColor" opacity="0.7" />
                </svg></span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">ทั้งหมด</p>
                <p
                  className={cn(
                    'text-xs font-medium font-numbers',
                    getTotalBalance() >= 0 ? 'text-income' : 'text-expense'
                  )}
                >
                  {getTotalBalance() >= 0 ? '' : '-'}
                  {formatCurrency(Math.abs(getTotalBalance()), 'THB')}
                </p>
              </div>
              {selectedWalletId === null && (
                <Check className="size-4 text-primary" />
              )}
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-border/30" />

            {/* Wallet Options */}
            {wallets.map((wallet) => {
              const balance = getWalletBalance(wallet.id);
              return (
                <button
                  key={wallet.id}
                  onClick={() => {
                    onSelect(wallet.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl p-3',
                    'transition-all duration-200',
                    'hover:bg-accent/50 active:scale-[0.98]',
                    selectedWalletId === wallet.id && 'bg-primary/10 ring-1 ring-primary/30'
                  )}
                >
                  <div
                    className={cn(
                      'flex size-10 items-center justify-center rounded-xl',
                      'bg-linear-to-br border',
                      getWalletColor(wallet.type)
                    )}
                  >
                    <span className="text-lg">{getWalletIcon(wallet)}</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm truncate">{wallet.name}</p>
                    <p
                      className={cn(
                        'text-xs font-medium font-numbers',
                        balance >= 0 ? 'text-income' : 'text-expense'
                      )}
                    >
                      {balance >= 0 ? '' : '-'}
                      {formatCurrency(Math.abs(balance), wallet.currency)}
                    </p>
                  </div>
                  {selectedWalletId === wallet.id && (
                    <Check className="size-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
