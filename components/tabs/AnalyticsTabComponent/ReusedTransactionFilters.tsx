'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  Repeat,
  Receipt,
  FileText,
  Wallet as WalletIcon,
  TrendingDown,
  TrendingUp,
  Layers,
  Filter,
  Hash,
  SlidersHorizontal,
  RotateCcw,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { Analysis } from '@/lib/stores';
import type { Category, Wallet } from '@/types';

// ============================================
// Chart Colors (shared)
// ============================================
const CHART_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#84cc16', '#6366f1',
];

// ============================================
// Types
// ============================================
export interface ReusedTransactionFilters {
  type: 'all' | 'expense' | 'income';
  matchType: 'all' | 'basic' | 'full';
  minCount: number;
}

export interface ReusedTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  analysisRecords: Analysis[];
  categories: Category[];
  wallets: Wallet[];
  // Filter data from main component (read-only)
  selectedWalletId: string | null;
  periodLabel: string;
  selectedWalletName: string;
}

// ============================================
// Reused Transactions Sheet
// ============================================
export function ReusedTransactionSheet({
  isOpen,
  onClose,
  analysisRecords,
  categories,
  wallets,
  // Filter data from main component (read-only)
  selectedWalletId,
  periodLabel,
  selectedWalletName,
}: ReusedTransactionSheetProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [filters, setFilters] = useState<ReusedTransactionFilters>({
    type: 'all',
    matchType: 'all',
    minCount: 2,
  });

  // Filter records based on current filters (wallet from main component)
  const filteredRecords = useMemo(() => {
    return analysisRecords
      .filter((a) => {
        // Only show records with count >= minCount (duplicates)
        if (a.count < filters.minCount) return false;
        // Wallet filter from main component
        if (selectedWalletId !== null && a.walletId !== selectedWalletId) return false;
        // Type filter
        if (filters.type !== 'all' && a.type !== filters.type) return false;
        // Match type filter
        if (filters.matchType !== 'all' && a.matchType !== filters.matchType) return false;
        return true;
      })
      .sort((a, b) => b.count - a.count);
  }, [analysisRecords, filters, selectedWalletId]);

  // Get category by id
  const getCategoryById = useCallback(
    (categoryId: string): Category | undefined => {
      return categories.find((c) => c.id === categoryId);
    },
    [categories]
  );

  // Get wallet by id
  const getWalletById = useCallback(
    (walletId: string): Wallet | undefined => {
      return wallets.find((w) => w.id === walletId);
    },
    [wallets]
  );

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setFilters({
      type: 'all',
      matchType: 'all',
      minCount: 2,
    });
  }, []);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.type !== 'all' ||
      filters.matchType !== 'all' ||
      filters.minCount !== 2
    );
  }, [filters]);

  // Group records by category
  const groupedByCategory = useMemo(() => {
    const map = new Map<
      string,
      {
        category: Category;
        records: Analysis[];
        totalCount: number;
        totalAmount: number;
      }
    >();

    filteredRecords.forEach((record) => {
      const category = getCategoryById(record.categoryId);
      if (!category) return;

      const existing = map.get(record.categoryId);
      if (existing) {
        existing.records.push(record);
        existing.totalCount += record.count;
        existing.totalAmount += record.amount * record.count;
      } else {
        map.set(record.categoryId, {
          category,
          records: [record],
          totalCount: record.count,
          totalAmount: record.amount * record.count,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalCount - a.totalCount);
  }, [filteredRecords, getCategoryById]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0">
        {/* Drag Handle */}
        <div className="flex justify-center pt-2 pb-3" data-drag-handle>
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-5 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Repeat className="size-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg">รายการใช้ซ้ำ</SheetTitle>
                <SheetDescription className="text-xs">
                  รายการที่ถูกบันทึกซ้ำ {filteredRecords.length} รายการ
                </SheetDescription>
              </div>
            </div>
            {/* <button
              onClick={onClose}
              className="size-9 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="size-5 text-muted-foreground" />
            </button> */}
          </div>
        </SheetHeader>

        {/* Filter Section - Expandable */}
        <div className="border-b border-border/30">
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">ตัวกรอง</span>
              {selectedWalletId !== null && (
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <WalletIcon className="size-3" />
                  {selectedWalletName}
                </span>
              )}
              {hasActiveFilters && (
                <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
                  กรองเพิ่มเติม
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-200',
                isFilterExpanded && 'rotate-180'
              )}
            />
          </button>

          {/* Filter Content */}
          <div
            className={cn(
              'grid transition-all duration-300 ease-in-out',
              isFilterExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            )}
          >
            <div className="overflow-hidden">
              <div className="px-5 pb-4 space-y-4">

                {/* Type Filter */}
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Filter className="size-3" />
                    ประเภท
                  </span>
                  <div className="flex gap-2">
                    {[
                      { value: 'all' as const, label: 'ทั้งหมด', icon: <Layers className="size-3.5" /> },
                      { value: 'expense' as const, label: 'รายจ่าย', icon: <TrendingDown className="size-3.5" />, color: 'text-rose-500' },
                      { value: 'income' as const, label: 'รายรับ', icon: <TrendingUp className="size-3.5" />, color: 'text-emerald-500' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFilters((f) => ({ ...f, type: opt.value }))}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all border flex items-center justify-center gap-1.5',
                          filters.type === opt.value
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted'
                        )}
                      >
                        <span className={opt.color}>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Match Type Filter */}
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Hash className="size-3" />
                    ระดับการซ้ำ
                  </span>
                  <div className="flex gap-2">
                    {[
                      { value: 'all' as const, label: 'ทั้งหมด', desc: 'แสดงทุกระดับ' },
                      { value: 'basic' as const, label: 'พื้นฐาน', desc: 'หมวดหมู่+จำนวน' },
                      { value: 'full' as const, label: 'เต็มรูปแบบ', desc: 'รวมหมายเหตุ' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFilters((f) => ({ ...f, matchType: opt.value }))}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all border flex flex-col items-center gap-0.5',
                          filters.matchType === opt.value
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted'
                        )}
                      >
                        <span>{opt.label}</span>
                        <span className="text-[10px] opacity-70">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Min Count Filter */}
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Repeat className="size-3" />
                    จำนวนครั้งขั้นต่ำ
                  </span>
                  <div className="flex gap-2">
                    {[2, 3, 5, 10].map((count) => (
                      <button
                        key={count}
                        onClick={() => setFilters((f) => ({ ...f, minCount: count }))}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all border',
                          filters.minCount === count
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted'
                        )}
                      >
                        ≥{count} ครั้ง
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset Button */}
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="w-full px-4 py-2 rounded-xl bg-muted/50 text-muted-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="size-4" />
                    รีเซ็ตตัวกรอง
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {groupedByCategory.length === 0 ? (
            <div className="py-12 text-center">
              <Repeat className="size-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">ไม่พบรายการที่ใช้ซ้ำ</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                ลองปรับตัวกรองหรือเพิ่มรายการใหม่
              </p>
            </div>
          ) : (
            groupedByCategory.map((group, groupIdx) => (
              <ReusedCategoryItem
                key={group.category.id}
                category={group.category}
                records={group.records}
                totalCount={group.totalCount}
                totalAmount={group.totalAmount}
                getWalletById={getWalletById}
                index={groupIdx}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================
// Reused Category Item (Expandable)
// ============================================
function ReusedCategoryItem({
  category,
  records,
  totalCount,
  totalAmount,
  getWalletById,
  index,
}: {
  category: Category;
  records: Analysis[];
  totalCount: number;
  totalAmount: number;
  getWalletById: (id: string) => Wallet | undefined;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/50 bg-card overflow-hidden',
        'transition-all duration-300'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-1.5 hover:bg-muted/30 transition-colors"
      >
        <div
          className="size-12 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}20` }}
        >
          {category.icon}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">{category.name}</p>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0',
                category.type === 'expense'
                  ? 'bg-rose-500/10 text-rose-500'
                  : 'bg-emerald-500/10 text-emerald-500'
              )}
            >
              {category.type === 'expense' ? 'รายจ่าย' : 'รายรับ'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Repeat className="size-3" />
              {totalCount} ครั้ง
            </span>
            <span className="text-xs font-semibold" style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}>
              ฿{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'size-5 text-muted-foreground transition-transform duration-200 shrink-0',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Expanded Records */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-2 space-y-2">
            {records.map((record, idx) => {
              const wallet = getWalletById(record.walletId);
              return (
                <div
                  key={record.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/30',
                    'transition-all duration-200'
                  )}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Match Type Badge */}
                  <div
                    className={cn(
                      'size-9 rounded-lg flex items-center justify-center shrink-0',
                      record.matchType === 'full'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-amber-500/10 text-amber-500'
                    )}
                  >
                    {record.matchType === 'full' ? (
                      <FileText className="size-4" />
                    ) : (
                      <Receipt className="size-4" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {record.note ? (
                          <p className="text-sm font-medium text-foreground truncate">{record.note}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground truncate">ไม่มีหมายเหตุ</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-foreground shrink-0">
                        ฿{record.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {wallet && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <span>{wallet.icon}</span>
                          <span>{wallet.name}</span>
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-md',
                          record.matchType === 'full'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-amber-500/10 text-amber-500'
                        )}
                      >
                        {record.matchType === 'full' ? 'เต็มรูปแบบ' : 'พื้นฐาน'}
                      </span>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium">
                        {record.count} ครั้ง
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
