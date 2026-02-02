'use client';

import { cn } from '@/lib/utils';
import { Wallet } from '@/types';
import { WalletBalance } from '@/lib/stores/transaction-store';
import { formatCurrency } from '@/lib/utils/format';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Wallet as WalletIcon,
  CreditCard,
  Banknote,
  PiggyBank,
  Check,
  Plus,
} from 'lucide-react';

interface WalletPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Wallet[];
  selectedWalletId: string | null;
  walletBalances: Record<string, WalletBalance>;
  onSelect: (walletId: string) => void;
  onCreateWallet?: () => void;
}

// Map wallet icons
const walletIconMap: Record<string, React.ReactNode> = {
  wallet: <WalletIcon className="size-5" />,
  'credit-card': <CreditCard className="size-5" />,
  banknote: <Banknote className="size-5" />,
  'piggy-bank': <PiggyBank className="size-5" />,
};

export function WalletPickerModal({
  open,
  onOpenChange,
  wallets,
  selectedWalletId,
  walletBalances,
  onSelect,
  onCreateWallet,
}: WalletPickerModalProps) {
  const handleSelect = (walletId: string) => {
    onSelect(walletId);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="min-h-[40vh] max-h-[65vh] rounded-t-[2rem] px-0 pb-0 overflow-hidden border-t-0"
      >
        <SheetHeader className="px-4 pt-4 pb-2">
          {/* Handle bar */}
          <div data-drag-handle className="flex justify-center pt-2 pb-2 touch-none">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <SheetTitle className="text-base font-semibold text-center">
            เลือกกระเป๋าเงิน
          </SheetTitle>
        </SheetHeader>

        <div className="px-3 pb-6 pt-3 space-y-1.5 overflow-y-auto flex-1">
          {wallets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-20 items-center justify-center rounded-3xl bg-muted/50 text-5xl mb-4">
                💰
              </div>
              <h4 className="font-semibold text-foreground mb-1">
                ยังไม่มีกระเป๋าเงิน
              </h4>
              <p className="text-sm text-muted-foreground mb-5">
                สร้างกระเป๋าเงินก่อนเพื่อเริ่มบันทึกรายการ
              </p>
              {onCreateWallet && (
                <button
                  onClick={() => {
                    onOpenChange(false);
                    onCreateWallet();
                  }}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all',
                    'bg-primary hover:bg-primary/90 active:scale-95 shadow-lg shadow-primary/25'
                  )}
                >
                  <Plus className="size-4" />
                  สร้างกระเป๋าเงิน
                </button>
              )}
            </div>
          ) : (
            wallets.map((wallet) => {
              const isSelected = wallet.id === selectedWalletId;
              const balance = walletBalances[wallet.id]?.balance ?? 0;

              return (
                <button
                  key={wallet.id}
                  onClick={() => handleSelect(wallet.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
                    'hover:bg-muted/60 active:scale-[0.98]',
                    isSelected && 'bg-primary/10 ring-2 ring-primary/30'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex items-center justify-center size-10 rounded-xl',
                      'bg-linear-to-br shadow-sm',
                      isSelected
                        ? 'from-primary/20 to-primary/10 text-primary'
                        : 'from-muted to-muted/50 text-muted-foreground'
                    )}
                    style={
                      wallet.color
                        ? {
                          background: `linear-gradient(135deg, ${wallet.color}20, ${wallet.color}10)`,
                          color: wallet.color,
                        }
                        : undefined
                    }
                  >
                    {wallet.icon || <WalletIcon className="size-5" />}
                  </div>

                  {/* Wallet Info */}
                  <div className="flex-1 text-left">
                    <p
                      className={cn(
                        'font-medium text-sm truncate max-w-[280px]',
                        isSelected ? 'text-foreground' : 'text-foreground/80'
                      )}
                    >
                      {wallet.name}
                    </p>
                    <p
                      className={cn(
                        'text-xs font-numbers',
                        balance >= 0 ? 'text-income' : 'text-expense'
                      )}
                    >
                      {formatCurrency(balance)}
                    </p>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
