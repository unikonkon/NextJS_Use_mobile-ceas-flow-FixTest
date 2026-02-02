'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Category, TransactionType, CategoryType, Wallet as WalletType } from '@/types';
import { formatNumber } from '@/lib/utils/format';
// import { AddCategoryModal } from '@/components/categories';
import { useCategoryStore, useTransactionStore, useWalletStore } from '@/lib/stores';
import { WalletPickerModal } from './wallet-picker-modal';
import {
  useCalculator,
  TypeSelector,
  CategoryScroll,
  CalculatorKeypad,
  FrequentTransactions,
} from './ui-transactions';
import {
  Wallet,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface AddTransactionSheetProps {
  trigger: React.ReactNode;
  expenseCategories: Category[];
  incomeCategories: Category[];
  onSubmit?: (data: {
    type: TransactionType;
    amount: number;
    categoryId: string;
    walletId?: string;
    date?: Date;
    note?: string;
  }) => void;
  // Controlled mode props
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreateWallet?: () => void;
}

export function AddTransactionSheet({
  trigger,
  expenseCategories,
  incomeCategories,
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onCreateWallet,
}: AddTransactionSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isNoteInputFocused, setIsNoteInputFocused] = useState(false);
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);

  // Category store for adding new categories, reordering, and deleting
  const addCategory = useCategoryStore((s) => s.addCategory);
  const reorderCategories = useCategoryStore((s) => s.reorderCategories);
  const deleteCategory = useCategoryStore((s) => s.deleteCategory);

  // Wallet stores - get selected wallet from transaction store
  const wallets = useWalletStore((s) => s.wallets);
  const walletBalances = useTransactionStore((s) => s.walletBalances);
  const selectedWalletId = useTransactionStore((s) => s.selectedWalletId);
  const setSelectedWalletId = useTransactionStore((s) => s.setSelectedWalletId);

  // Local wallet selection for this transaction (synced from store)
  const [localWalletId, setLocalWalletId] = useState<string | null>(null);

  // Sync local wallet selection when sheet opens or store selection changes
  useEffect(() => {
    if (open) {
      // When sheet opens, use store's selected wallet or first wallet
      const walletId = selectedWalletId || (wallets.length > 0 ? wallets[0].id : null);
      setLocalWalletId(walletId);
    }
  }, [open, selectedWalletId, wallets]);

  // Get selected wallet object
  const selectedWallet = localWalletId
    ? wallets.find((w) => w.id === localWalletId)
    : wallets[0];

  // Handle wallet selection from picker
  const handleWalletSelect = (walletId: string) => {
    setLocalWalletId(walletId);
    // Also update the global store selection
    setSelectedWalletId(walletId);
  };

  // Calculator hook
  const calculator = useCalculator();
  const currency = '฿';

  // Get current categories based on type
  const currentCategories = transactionType === 'income' ? incomeCategories : expenseCategories;

  // Auto-select first category when sheet opens or transaction type changes
  useEffect(() => {
    if (open && currentCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(currentCategories[0]);
    }
  }, [open, currentCategories, selectedCategory]);

  // Reset note input focus when sheet closes
  useEffect(() => {
    if (!open) {
      setIsNoteInputFocused(false);
    }
  }, [open]);

  const handleTypeChange = (type: TransactionType) => {
    setTransactionType(type);
    // Auto-select first category of new type
    const newCategories = type === 'income' ? incomeCategories : expenseCategories;
    setSelectedCategory(newCategories.length > 0 ? newCategories[0] : null);
  };

  const handleAddCategory = async (name: string, type: CategoryType, icon?: string) => {
    const newCategory = await addCategory({ name, type, icon });
    setSelectedCategory(newCategory);
  };

  // Reset form to initial values
  const resetForm = () => {
    calculator.reset();
    setTransactionType('expense');
    setSelectedCategory(null);
    setNote('');
    setSelectedDate(new Date());
    setIsNoteInputFocused(false);
    // Reset to store's selected wallet
    setLocalWalletId(selectedWalletId || (wallets.length > 0 ? wallets[0].id : null));
  };

  const handleSubmit = () => {
    if (selectedCategory && parseFloat(calculator.displayValue) > 0) {
      onSubmit?.({
        type: transactionType,
        amount: parseFloat(calculator.displayValue),
        categoryId: selectedCategory.id,
        walletId: localWalletId || undefined,
        date: selectedDate,
        note: note || undefined,
      });

      // Reset form
      resetForm();
      setOpen(false);
    }
  };

  // Handle sheet open/close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when sheet closes (including when X button is clicked)
      resetForm();
    }
  };

  // ต้องมี: category, amount > 0, และ wallet
  const hasWallet = !!(localWalletId && selectedWallet);
  const canSubmit = !!(selectedCategory && parseFloat(calculator.displayValue) > 0 && hasWallet);

  // Handle frequent transaction selection
  const handleFrequentSelect = (input: {
    type: TransactionType;
    amount: number;
    categoryId: string;
    walletId?: string;
    date?: Date;
    note?: string;
  }) => {
    // ต้องมี wallet ถึงจะบันทึกได้
    if (!hasWallet) {
      setWalletPickerOpen(true);
      return;
    }
    onSubmit?.(input);
    resetForm();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="min-h-[45vh] rounded-t-[2rem] px-0 pb-0 overflow-hidden border-t-0"
      >
        {/* Hidden title for accessibility */}
        <SheetTitle className="sr-only">เพิ่มรายการ</SheetTitle>

        {/* Elegant Header with gradient */}
        <div className="relative">
          {/* Decorative gradient background */}
          <div
            className={cn(
              "absolute inset-0  opacity-20 transition-all duration-100",
              transactionType === 'expense' && "bg-linear-to-b from-expense via-expense/50 to-transparent",
              transactionType === 'income' && "bg-linear-to-b from-income via-income/50 to-transparent"
            )}
          />

          {/* Handle bar */}
          <div data-drag-handle className="flex justify-center pt-2 pb-2 touch-none">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Transaction Type Selector */}
          <TypeSelector
            value={transactionType}
            onChange={handleTypeChange}
            showIcons={true}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col">
          {/* Category Horizontal Scroll */}
          <CategoryScroll
            categories={currentCategories}
            selectedCategory={selectedCategory}
            transactionType={transactionType}
            onSelect={setSelectedCategory}
            onReorderCategories={(cats) => reorderCategories(transactionType, cats)}
            onAddCategory={handleAddCategory}
            onDeleteCategory={deleteCategory}
          />

          {/* Amount Display - Split Layout Card */}
          <div className="px-1 py-2">
            <div
              className={cn(
                "relative overflow-hidden rounded-xl transition-all duration-300",
                "bg-linear-to-br from-card via-card to-muted/20",
                "border border-border/50 shadow-sm",
                selectedCategory && "ring-2 ring-primary/20"
              )}
            >
              {/* Split Layout Container */}
              <div className="flex w-full">
                {/* Left Half - Category Badge & Quick Actions */}
                <div className="w-3/5 flex flex-col justify-between px-2 py-1 border-r border-border/30">

                  {/* Quick Actions Row */}
                  <div className="flex gap-1.5">
                    <DateTimePicker
                      value={selectedDate}
                      onChange={setSelectedDate}
                      triggerClassName={cn(
                        "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all w-full justify-center shadow-sm",
                        "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground",
                        "active:scale-95"
                      )}
                    />
                    <button
                      onClick={() => setWalletPickerOpen(true)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all w-full justify-center shadow-sm",
                        "active:scale-95",
                        hasWallet
                          ? "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                          : "bg-destructive/10 hover:bg-destructive/20 text-destructive ring-1 ring-destructive/30"
                      )}
                    >
                      {!hasWallet && <AlertTriangle className="size-3" />}
                      {hasWallet && (selectedWallet?.icon || <Wallet className="size-3" />)}
                      <span className="pl-1 truncate max-w-[110px]">
                        {selectedWallet?.name || 'เลือกบัญชี'}
                      </span>
                    </button>
                  </div>

                  {/* Note Input - Compact */}
                  <div className="flex items-center gap-1.5 py-1 mt-1 rounded-lg bg-muted/30 transition-all focus-within:bg-muted/50 focus-within:ring-1 focus-within:ring-primary/30">
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      onFocus={() => setIsNoteInputFocused(true)}
                      onBlur={() => setIsNoteInputFocused(false)}
                      placeholder="บันทึก..."
                      className="h-8 text-[11px]"
                    />
                  </div>
                </div>

                {/* Right Half - Amount Display */}
                <div className="w-2/5 flex flex-col justify-between p-3">
                  {/* Operation Indicator */}
                  <div className="flex justify-end">
                    {calculator.previousValue && calculator.operation ? (
                      <span className="text-xs text-muted-foreground font-medium animate-in fade-in slide-in-from-right-2">
                        {formatNumber(parseFloat(calculator.previousValue))} {calculator.operation}
                      </span>
                    ) : (
                      <span className="text-xs text-transparent select-none">-</span>
                    )}
                  </div>

                  {/* Main Amount Display */}
                  <div className="flex items-end justify-end gap-0.5 mt-auto">
                    <span
                      className={cn(
                        "font-numbers text-2xl font-bold tracking-tight transition-all",
                        parseFloat(calculator.displayValue) > 0
                          ? "text-foreground"
                          : "text-muted-foreground/40"
                      )}
                    >
                      {calculator.formatDisplay(calculator.displayValue)}
                    </span>
                    {/* Blinking Cursor */}
                    <span
                      className={cn(
                        "inline-block w-0.5 h-6 rounded-full animate-cursor-blink",
                        transactionType === 'expense' ? "bg-expense" : "bg-income"
                      )}
                      style={{ marginBottom: '0.25rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Frequent Transactions - รายการใช้ซ้ำ */}
          <FrequentTransactions
            walletId={localWalletId}
            transactionType={transactionType}
            onSelect={handleFrequentSelect}
            maxItems={4}
          />

          {/* Calculator Keypad */}
          {!isNoteInputFocused && (
            <CalculatorKeypad
              operation={calculator.operation}
              transactionType={transactionType}
              canSubmit={canSubmit}
              onNumber={calculator.handleNumber}
              onOperation={calculator.handleOperation}
              onEquals={calculator.handleEquals}
              onClear={calculator.handleClear}
              onBackspace={calculator.handleBackspace}
              onSubmit={handleSubmit}
              showSparkle={true}
            />
          )}
        </div>

        {/* Add Category Modal */}
        {/* <AddCategoryModal
          open={addCategoryOpen}
          onOpenChange={setAddCategoryOpen}
          categoryType={transactionType}
          onAdd={handleAddCategory}
        /> */}

        {/* Wallet Picker Modal */}
        <WalletPickerModal
          open={walletPickerOpen}
          onOpenChange={setWalletPickerOpen}
          wallets={wallets}
          selectedWalletId={localWalletId}
          walletBalances={walletBalances}
          onSelect={handleWalletSelect}
          onCreateWallet={onCreateWallet}
        />
      </SheetContent>
    </Sheet>
  );
}
