'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Header, PageContainer } from '@/components/layout';
import { useWalletStore, useTransactionStore, useAnalysisStore } from '@/lib/stores';
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils/format';
import { Wallet, TransactionWithCategory, WalletType } from '@/types';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  MoreHorizontal,
  AlertTriangle,
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  X,
  Check,
} from 'lucide-react';

// ============================================
// Wallet Type Config
// ============================================
const WALLET_TYPES: {
  value: WalletType;
  label: string;
  icon: string;
  description: string;
  color: string;
}[] = [
    { value: 'cash', label: 'เงินสด', icon: '💵', description: 'เงินสดในกระเป๋า', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' },
    { value: 'daily_expense', label: 'เงินเดือน', icon: '💰', description: 'เงินเดือน/เงินเดือนที่จะใช้', color: 'from-red-500/20 to-red-600/10 border-red-500/30' },
    { value: 'bank', label: 'บัญชีธนาคาร', icon: '🏦', description: 'บัญชีออมทรัพย์/กระแสรายวัน', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30' },
    { value: 'credit_card', label: 'บัตรเครดิต', icon: '💳', description: 'บัตรเครดิต/บัตรเดบิต', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30' },
    { value: 'e_wallet', label: 'E-Wallet', icon: '📱', description: 'กระเป๋าเงินออนไลน์', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30' },
    { value: 'savings', label: 'เงินออม', icon: '🐷', description: 'บัญชีเงินออม/เงินฝากประจำ', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30' },
  ];

const getWalletTypeConfig = (type: WalletType) => {
  return WALLET_TYPES.find(t => t.value === type) || WALLET_TYPES[0];
};

// ============================================
// Wallet Card Component
// ============================================
interface WalletCardProps {
  wallet: Wallet;
  balance: number;
  income: number;
  expense: number;
  transactionCount: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

function WalletCard({
  wallet,
  balance,
  income,
  expense,
  transactionCount,
  onClick,
  onEdit,
  onDelete,
  index,
}: WalletCardProps) {
  const [showActions, setShowActions] = useState(false);
  const typeConfig = getWalletTypeConfig(wallet.type);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl transition-all duration-500',
        'bg-linear-to-br border shadow-soft',
        typeConfig.color,
        'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
        'animate-slide-up'
      )}
      style={{ animationDelay: `${index * 0.01}s` }}
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-card/60 backdrop-blur-xl" />

      {/* Decorative elements */}
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-linear-to-br from-primary/10 to-transparent blur-2xl" />
      <div className="absolute -left-4 -bottom-4 size-24 rounded-full bg-linear-to-tr from-primary/5 to-transparent blur-xl" />

      {/* Content */}
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={onClick}
            className="flex-1 text-left"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex size-12 items-center justify-center rounded-xl text-2xl',
                'bg-linear-to-br shadow-sm',
                typeConfig.color
              )}>
                {wallet.icon || typeConfig.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {wallet.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {typeConfig.label} • {transactionCount} รายการ
                </p>
              </div>
            </div>
          </button>

          {/* Action Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
            >
              <MoreHorizontal className="size-4" />
            </Button>

            {/* Dropdown Actions */}
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 top-8 z-50 w-36 overflow-hidden rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-xl animate-scale-in">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActions(false);
                      onEdit();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors"
                  >
                    <Edit3 className="size-4" />
                    แก้ไข
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActions(false);
                      onDelete();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="size-4" />
                    ลบ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Balance */}
        <button onClick={onClick} className="w-full text-left">
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">ยอดคงเหลือ</p>
            <p className={cn(
              'text-2xl font-bold font-numbers tracking-tight',
              balance >= 0 ? 'text-foreground' : 'text-expense'
            )}>
              {balance >= 0 ? '' : '-'}฿{formatCurrency(Math.abs(balance), 'THB')}
            </p>
          </div>

          {/* Income / Expense Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="flex size-6 items-center justify-center rounded-full bg-income/10">
                <ArrowDownRight className="size-3.5 text-income" />
              </div>
              <span className="text-xs font-medium font-numbers text-income">
                +฿{formatCurrency(income, 'THB')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex size-6 items-center justify-center rounded-full bg-expense/10">
                <ArrowUpRight className="size-3.5 text-expense" />
              </div>
              <span className="text-xs font-medium font-numbers text-expense">
                -฿{formatCurrency(expense, 'THB')}
              </span>
            </div>
          </div>
        </button>

        {/* Chevron indicator */}
        <div className="absolute right-4 bottom-4 opacity-30 group-hover:opacity-60 transition-opacity">
          <ChevronRight className="size-5" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Transaction Item Component
// ============================================
interface TransactionItemProps {
  transaction: TransactionWithCategory;
  onClick: () => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  selectionMode: boolean;
}

function TransactionItem({
  transaction,
  onClick,
  onDelete,
  isSelected,
  onSelect,
  selectionMode,
}: TransactionItemProps) {
  const isExpense = transaction.type === 'expense';

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-xl p-3 transition-all duration-200',
        'border border-transparent hover:border-border/50',
        'hover:bg-accent/30 active:scale-[0.99]',
        isSelected && 'bg-primary/10 border-primary/30'
      )}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <button
          onClick={() => onSelect(!isSelected)}
          className={cn(
            'flex size-6 items-center justify-center rounded-full border-2 transition-all',
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30 hover:border-primary/50'
          )}
        >
          {isSelected && <Check className="size-3.5" />}
        </button>
      )}

      {/* Main Content */}
      <button
        onClick={selectionMode ? () => onSelect(!isSelected) : onClick}
        className="flex-1 flex items-center gap-3 text-left"
      >
        {/* Category Icon */}
        <div className={cn(
          'flex size-10 items-center justify-center rounded-xl text-2xl',
          isExpense ? 'bg-expense/10' : 'bg-income/10'
        )}>
          {transaction.category.icon || transaction.category.name.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {transaction.category.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {transaction.note || formatRelativeDate(transaction.date)}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className={cn(
            'font-semibold font-numbers',
            isExpense ? 'text-expense' : 'text-income'
          )}>
            {isExpense ? '-' : '+'}฿{formatCurrency(transaction.amount, 'THB')}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {formatDate(transaction.date, { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </button>

    </div>
  );
}

// ============================================
// Add/Edit Wallet Sheet
// ============================================
interface WalletFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet?: Wallet | null;
  onSubmit: (data: Omit<Wallet, 'id' | 'createdAt'>) => void;
}

function WalletFormSheet({ open, onOpenChange, wallet, onSubmit }: WalletFormSheetProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('cash');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    if (wallet) {
      setName(wallet.name);
      setType(wallet.type);
      setIcon(wallet.icon);
    } else {
      setName('');
      setType('cash');
      setIcon('');
    }
  }, [wallet, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;

    const typeConfig = getWalletTypeConfig(type);
    onSubmit({
      name: name.trim(),
      type,
      icon: icon || typeConfig.icon,
      color: wallet?.color || '#6366f1',
      currency: 'THB',
      initialBalance: wallet?.initialBalance || 0,
      currentBalance: wallet?.currentBalance || 0,
      isAsset: type !== 'credit_card',
    });
    onOpenChange(false);
  };

  const selectedTypeConfig = getWalletTypeConfig(type);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="min-h-[60vh] rounded-t-[2rem] px-0 pb-0 border-t-0">
        <SheetTitle className="sr-only">
          {wallet ? 'แก้ไขกระเป๋าเงิน' : 'เพิ่มกระเป๋าเงินใหม่'}
        </SheetTitle>

        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 h-40 bg-linear-to-b from-primary/10 via-primary/5 to-transparent" />

          <div data-drag-handle className="flex justify-center pt-2 pb-2 touch-none">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          <div className="relative px-4 pb-4">
            <h2 className="text-lg font-bold text-center">
              {wallet ? 'แก้ไขกระเป๋าเงิน' : 'เพิ่มกระเป๋าเงินใหม่'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <div className="px-4 pb-6 space-y-6">
          {/* Preview Card */}
          <div className={cn(
            'relative overflow-hidden rounded-2xl p-4',
            'bg-linear-to-br border shadow-soft',
            selectedTypeConfig.color
          )}>
            <div className="absolute inset-0 bg-card/60 backdrop-blur-xl" />
            <div className="relative flex items-center gap-3">
              <div className={cn(
                'flex size-14 items-center justify-center rounded-xl text-3xl',
                'bg-linear-to-br shadow-sm',
                selectedTypeConfig.color
              )}>
                {icon || selectedTypeConfig.icon}
              </div>
              <div>
                <p className="font-semibold text-lg">{name || 'ชื่อกระเป๋า'}</p>
                <p className="text-sm text-muted-foreground">{selectedTypeConfig.label}</p>
              </div>
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                ชื่อกระเป๋า
              </label>
              <span className="text-xs text-muted-foreground/70">
                {name.length}/25
              </span>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น บัญชี SCB, กระเป๋าตังค์"
              className="h-12 rounded-xl text-base"
              maxLength={25}
            />
          </div>

          {/* Wallet Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              ประเภท
            </label>
            <div className="grid grid-cols-2 gap-2">
              {WALLET_TYPES.map((walletType) => (
                <button
                  key={walletType.value}
                  onClick={() => {
                    setType(walletType.value);
                    if (!icon) setIcon('');
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-xl p-3 border transition-all',
                    type === walletType.value
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border/50 hover:border-border hover:bg-accent/30'
                  )}
                >
                  <span className="text-xl">{walletType.icon}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium">{walletType.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Icon Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              ไอคอน (emoji)
            </label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder={selectedTypeConfig.icon}
              className="h-12 rounded-xl text-2xl text-center"
              maxLength={2}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full h-12 rounded-xl text-base font-semibold"
          >
            {wallet ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างกระเป๋าเงิน'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================
// Wallet Detail View
// ============================================
interface WalletDetailViewProps {
  wallet: Wallet;
  transactions: TransactionWithCategory[];
  balance: { income: number; expense: number; balance: number };
  onBack: () => void;
  onDeleteWallet: () => void;
  onEditWallet: () => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (transaction: TransactionWithCategory) => void;
  onDeleteAllTransactions: () => void;
}

// ============================================
// Wallet Detail Loading Skeleton
// ============================================
function WalletDetailSkeleton() {
  return (
    <>
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="size-9 rounded-lg bg-muted animate-pulse" />
        <div className="h-5 w-32 rounded-md bg-muted animate-pulse" />
        <div className="size-9 rounded-lg bg-muted animate-pulse" />
      </div>

      <div className="px-4 pt-4 pb-20">
        {/* Wallet Summary Card Skeleton */}
        <div className="relative overflow-hidden rounded-2xl mb-4 bg-muted/30 border border-border/30">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-xl bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-28 rounded-md bg-muted animate-pulse" />
                <div className="h-4 w-20 rounded-md bg-muted animate-pulse" />
              </div>
              <div className="size-9 rounded-lg bg-muted animate-pulse ml-auto" />
            </div>

            <div className="space-y-2">
              <div className="h-4 w-16 rounded-md bg-muted animate-pulse" />
              <div className="h-8 w-40 rounded-md bg-muted animate-pulse" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/50 p-3 space-y-2">
                <div className="h-4 w-16 rounded-md bg-muted animate-pulse" />
                <div className="h-6 w-24 rounded-md bg-muted animate-pulse" />
              </div>
              <div className="rounded-xl bg-muted/50 p-3 space-y-2">
                <div className="h-4 w-16 rounded-md bg-muted animate-pulse" />
                <div className="h-6 w-24 rounded-md bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-32 rounded-md bg-muted animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-14 rounded-lg bg-muted animate-pulse" />
            <div className="h-8 w-20 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>

        <div className="h-10 w-full rounded-xl bg-muted animate-pulse mb-3" />

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl p-3 bg-muted/20"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="size-10 rounded-xl bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
                <div className="h-3 w-16 rounded-md bg-muted animate-pulse" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-4 w-20 rounded-md bg-muted animate-pulse ml-auto" />
                <div className="h-3 w-12 rounded-md bg-muted animate-pulse ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function WalletDetailView({
  wallet,
  transactions,
  balance,
  onBack,
  onDeleteWallet,
  onEditWallet,
  onDeleteTransaction,
  onEditTransaction,
  onDeleteAllTransactions,
}: WalletDetailViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'selected' | 'all' | 'wallet' | null>(null);

  const typeConfig = getWalletTypeConfig(wallet.type);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [wallet.id]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter(t =>
      t.category.name.toLowerCase().includes(query) ||
      t.note?.toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

  const handleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const handleDeleteSelected = () => {
    setDeleteTarget('selected');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteTarget === 'selected') {
      selectedIds.forEach(id => onDeleteTransaction(id));
      setSelectedIds(new Set());
      setSelectionMode(false);
    } else if (deleteTarget === 'all') {
      onDeleteAllTransactions();
    } else if (deleteTarget === 'wallet') {
      onDeleteWallet();
    }
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return <WalletDetailSkeleton />;
  }

  return (
    <>
      <Header
        leftAction={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className="rounded-sm bg-primary/10 hover:bg-primary/20"
          >
            <ChevronLeft className="size-8" />
          </Button>
        }
        title={wallet.name}
        rightAction={
          <div className="flex items-center gap-1.5">

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setDeleteTarget('wallet');
                setShowDeleteConfirm(true);
              }}
              className="rounded-sm bg-destructive/10 hover:bg-destructive/20 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        }
      />

      <PageContainer className="pt-4">
        {/* Wallet Summary Card */}
        <div className={cn(
          'relative overflow-hidden rounded-2xl mb-4',
          'bg-linear-to-br border shadow-soft',
          typeConfig.color
        )}>
          <div className="absolute inset-0 bg-card/60 backdrop-blur-xl" />
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-linear-to-br from-primary/10 to-transparent blur-3xl" />

          <div className="relative p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className={cn(
                'flex size-16 items-center justify-center rounded-xl text-4xl',
                'bg-linear-to-br shadow-lg',
                typeConfig.color
              )}>
                {wallet.icon || typeConfig.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold">{wallet.name}</h2>
                <p className="text-sm text-muted-foreground">{typeConfig.label}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onEditWallet}
                className="rounded-sm bg-primary/10 hover:bg-primary/20"
              >
                <Edit3 className="size-4" />
              </Button>
            </div>

            {/* Balance */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-1">ยอดคงเหลือ</p>
              <p className={cn(
                'text-3xl font-bold font-numbers tracking-tight',
                balance.balance >= 0 ? 'text-foreground' : 'text-expense'
              )}>
                {balance.balance >= 0 ? '' : '-'}฿{formatCurrency(Math.abs(balance.balance), 'THB')}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-income/10 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="size-4 text-income" />
                  <span className="text-xs text-muted-foreground">รายรับ</span>
                </div>
                <p className="text-lg font-bold font-numbers text-income">
                  +฿{formatCurrency(balance.income, 'THB')}
                </p>
              </div>
              <div className="rounded-xl bg-expense/10 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="size-4 text-expense" />
                  <span className="text-xs text-muted-foreground">รายจ่าย</span>
                </div>
                <p className="text-lg font-bold font-numbers text-expense">
                  -฿{formatCurrency(balance.expense, 'THB')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Section */}
        <div className="space-y-3">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              รายการทั้งหมด ({transactions.length})
            </h3>
            <div className="flex items-center gap-2">
              {transactions.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectionMode(!selectionMode);
                      setSelectedIds(new Set());
                    }}
                    className="text-xs h-8 bg-primary/10 hover:bg-primary/20"
                  >
                    {selectionMode ? 'ยกเลิก' : 'เลือก'}
                  </Button>
                  {!selectionMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteTarget('all');
                        setShowDeleteConfirm(true);
                      }}
                      className="text-xs h-8 text-destructive hover:text-destructive bg-destructive/10 hover:bg-destructive/20"
                    >
                      ลบทั้งหมด
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Selection Actions */}
          {selectionMode && selectedIds.size > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/30 animate-slide-up">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedIds.size === filteredTransactions.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
              </Button>
              <div className="flex-1 text-center text-sm text-muted-foreground">
                เลือก {selectedIds.size} รายการ
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                className="text-xs"
              >
                <Trash2 className="size-3.5 mr-1" />
                ลบ
              </Button>
            </div>
          )}

          {/* Search */}
          {transactions.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารายการ..."
                className="h-10 pl-10 pr-10 rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="size-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          )}

          {/* Transaction List */}
          {filteredTransactions.length > 0 ? (
            <div className="space-y-1 stagger-children">
              {filteredTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onClick={() => onEditTransaction(transaction)}
                  onDelete={() => onDeleteTransaction(transaction.id)}
                  isSelected={selectedIds.has(transaction.id)}
                  onSelect={(selected) => {
                    const newSet = new Set(selectedIds);
                    if (selected) {
                      newSet.add(transaction.id);
                    } else {
                      newSet.delete(transaction.id);
                    }
                    setSelectedIds(newSet);
                  }}
                  selectionMode={selectionMode}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-20 items-center justify-center rounded-3xl bg-muted/50 text-5xl mb-4">
                📭
              </div>
              <h4 className="font-semibold text-foreground mb-1">
                {searchQuery ? 'ไม่พบรายการ' : 'ยังไม่มีรายการ'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'เพิ่มรายรับ/รายจ่ายในกระเป๋านี้'}
              </p>
            </div>
          )}
        </div>
      </PageContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="rounded-2xl max-w-[90vw]" showCloseButton={false}>
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-8 text-destructive" />
              </div>
            </div>
            <DialogTitle>
              {deleteTarget === 'wallet'
                ? 'ลบกระเป๋าเงินนี้?'
                : deleteTarget === 'all'
                  ? 'ลบรายการทั้งหมด?'
                  : `ลบ ${selectedIds.size} รายการ?`}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget === 'wallet'
                ? 'กระเป๋าเงินและรายการทั้งหมดจะถูกลบถาวร'
                : 'การดำเนินการนี้ไม่สามารถย้อนกลับได้'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 rounded-xl"
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="flex-1 rounded-xl"
            >
              <Trash2 className="size-4 mr-2" />
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================
// Main WalletsContent Component
// ============================================
export function WalletsContent() {
  // Stores
  const wallets = useWalletStore((s) => s.wallets);
  const loadWallets = useWalletStore((s) => s.loadWallets);
  const addWallet = useWalletStore((s) => s.addWallet);
  const updateWallet = useWalletStore((s) => s.updateWallet);
  const deleteWallet = useWalletStore((s) => s.deleteWallet);
  const walletInitialized = useWalletStore((s) => s.isInitialized);

  const transactions = useTransactionStore((s) => s.transactions);
  const walletBalances = useTransactionStore((s) => s.walletBalances);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const deleteTransactionsByWalletId = useTransactionStore((s) => s.deleteTransactionsByWalletId);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const transactionInitialized = useTransactionStore((s) => s.isInitialized);

  const deleteAnalysisByWalletId = useAnalysisStore((s) => s.deleteAnalysisByWalletId);

  // Local State
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [walletFormOpen, setWalletFormOpen] = useState(false);
  const [showDeleteWalletConfirm, setShowDeleteWalletConfirm] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);

  // Load data on mount
  useEffect(() => {
    if (!walletInitialized) {
      loadWallets();
    }
    if (!transactionInitialized) {
      loadTransactions();
    }
  }, [walletInitialized, transactionInitialized, loadWallets, loadTransactions]);

  // Get transactions for selected wallet
  const walletTransactions = useMemo(() => {
    if (!selectedWallet) return [];
    return transactions.filter(t => t.walletId === selectedWallet.id);
  }, [selectedWallet, transactions]);

  // Calculate wallet stats
  const getWalletStats = (walletId: string) => {
    const walletTxs = transactions.filter(t => t.walletId === walletId);
    const balance = walletBalances[walletId] || { income: 0, expense: 0, balance: 0 };
    return {
      ...balance,
      transactionCount: walletTxs.length,
    };
  };

  // Calculate total balance
  const totalBalance = useMemo(() => {
    return Object.values(walletBalances).reduce((sum, wb) => sum + wb.balance, 0);
  }, [walletBalances]);

  // Handlers
  const handleAddWallet = () => {
    setEditingWallet(null);
    setWalletFormOpen(true);
  };

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setWalletFormOpen(true);
  };

  const handleWalletFormSubmit = async (data: Omit<Wallet, 'id' | 'createdAt'>) => {
    if (editingWallet) {
      await updateWallet(editingWallet.id, data);
      if (selectedWallet?.id === editingWallet.id) {
        setSelectedWallet({ ...editingWallet, ...data });
      }
    } else {
      await addWallet(data);
    }
  };

  const handleDeleteWallet = async () => {
    if (!walletToDelete) return;

    await deleteTransactionsByWalletId(walletToDelete.id);
    await deleteAnalysisByWalletId(walletToDelete.id);
    await deleteWallet(walletToDelete.id);

    setSelectedWallet(null);
    setWalletToDelete(null);
    setShowDeleteWalletConfirm(false);
  };

  const handleDeleteAllTransactions = async () => {
    if (!selectedWallet) return;
    await deleteTransactionsByWalletId(selectedWallet.id);
  };

  const handleDeleteWalletDirect = async () => {
    if (!selectedWallet) return;

    await deleteTransactionsByWalletId(selectedWallet.id);
    await deleteAnalysisByWalletId(selectedWallet.id);
    await deleteWallet(selectedWallet.id);

    setSelectedWallet(null);
  };

  // Render Wallet Detail View
  if (selectedWallet) {
    return (
      <>
        <WalletDetailView
          wallet={selectedWallet}
          transactions={walletTransactions}
          balance={walletBalances[selectedWallet.id] || { income: 0, expense: 0, balance: 0 }}
          onBack={() => setSelectedWallet(null)}
          onDeleteWallet={handleDeleteWalletDirect}
          onEditWallet={() => handleEditWallet(selectedWallet)}
          onDeleteTransaction={deleteTransaction}
          onEditTransaction={() => { }}
          onDeleteAllTransactions={handleDeleteAllTransactions}
        />

        {/* Wallet Form Sheet - for editing wallet in detail view */}
        <WalletFormSheet
          open={walletFormOpen}
          onOpenChange={setWalletFormOpen}
          wallet={editingWallet}
          onSubmit={handleWalletFormSubmit}
        />
      </>
    );
  }

  // Render Wallets List
  return (
    <>
      <PageContainer className="pt-4">
        {/* Total Balance Card */}
        <div className="relative overflow-hidden rounded-2xl mb-6 bg-linear-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 shadow-soft">
          <div className="absolute inset-0 bg-card/70 backdrop-blur-xl" />
          <div className="absolute -right-20 -top-20 size-56 rounded-full bg-linear-to-br from-primary/20 to-transparent blur-3xl" />
          <div className="absolute -left-10 -bottom-10 size-40 rounded-full bg-linear-to-tr from-primary/10 to-transparent blur-2xl" />

          <div className="relative p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <WalletIcon className="size-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ยอดรวมทั้งหมด</p>
                <p className="text-xs text-muted-foreground/70">{wallets.length} กระเป๋า</p>
              </div>
            </div>

            <p className={cn(
              'text-4xl font-bold font-numbers tracking-tight',
              totalBalance >= 0 ? 'text-foreground' : 'text-expense'
            )}>
              {totalBalance >= 0 ? '' : '-'}฿{formatCurrency(Math.abs(totalBalance), 'THB')}
            </p>
          </div>
        </div>

        {/* Wallets Grid */}
        {wallets.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {wallets.map((wallet, index) => {
              const stats = getWalletStats(wallet.id);
              return (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  balance={stats.balance}
                  income={stats.income}
                  expense={stats.expense}
                  transactionCount={stats.transactionCount}
                  onClick={() => setSelectedWallet(wallet)}
                  onEdit={() => handleEditWallet(wallet)}
                  onDelete={() => {
                    setWalletToDelete(wallet);
                    setShowDeleteWalletConfirm(true);
                  }}
                  index={index}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex size-24 items-center justify-center rounded-3xl bg-muted/50 text-6xl mb-4 animate-pulse-soft">
              💰
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              ยังไม่มีกระเป๋าเงิน
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              เริ่มต้นจัดการการเงินด้วยการสร้างกระเป๋าเงินใบแรก
            </p>
            <Button onClick={handleAddWallet} className="rounded-xl">
              <Plus className="size-4 mr-2" />
              สร้างกระเป๋าเงิน
            </Button>
          </div>
        )}

        {/* Add Button (FAB style) */}
        {wallets.length > 0 && (
          <div className="fixed bottom-24 right-4 z-40">
            <Button
              onClick={handleAddWallet}
              className="size-14 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus className="size-6" />
            </Button>
          </div>
        )}
      </PageContainer>

      {/* Wallet Form Sheet */}
      <WalletFormSheet
        open={walletFormOpen}
        onOpenChange={setWalletFormOpen}
        wallet={editingWallet}
        onSubmit={handleWalletFormSubmit}
      />

      {/* Delete Wallet Confirmation */}
      <Dialog open={showDeleteWalletConfirm} onOpenChange={setShowDeleteWalletConfirm}>
        <DialogContent className="rounded-2xl max-w-[90vw]" showCloseButton={false}>
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-8 text-destructive" />
              </div>
            </div>
            <DialogTitle>ลบกระเป๋าเงินนี้?</DialogTitle>
            <DialogDescription>
              {walletToDelete ? (
                <>"{walletToDelete.name}" และรายการทั้งหมดจะถูกลบถาวร</>
              ) : (
                <>กระเป๋าเงินนี้และรายการทั้งหมดจะถูกลบถาวร</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteWalletConfirm(false);
                setWalletToDelete(null);
              }}
              className="flex-1 rounded-xl"
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWallet}
              className="flex-1 rounded-xl"
            >
              <Trash2 className="size-4 mr-2" />
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
