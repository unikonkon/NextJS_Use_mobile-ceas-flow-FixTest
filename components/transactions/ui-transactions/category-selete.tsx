'use client';

import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { Check, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Category, TransactionType } from '@/types';

interface CategorySelectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  selectedCategory: Category | null;
  transactionType: TransactionType;
  onSelect: (category: Category) => void;
}

// Category group definitions for expense categories
const expenseCategoryGroups: { id: string; name: string; emoji: string; categoryIds: string[] }[] = [
  { id: 'food', name: 'อาหารและเครื่องดื่ม', emoji: '🍽️', categoryIds: ['1', '2'] },
  { id: 'transport', name: 'การเดินทาง', emoji: '🚗', categoryIds: ['3', '4', '5'] },
  { id: 'home', name: 'ที่อยู่อาศัย', emoji: '🏠', categoryIds: ['6', '7', '8', '9'] },
  { id: 'communication', name: 'สื่อสาร', emoji: '📱', categoryIds: ['10'] },
  { id: 'shopping', name: 'ช้อปปิ้ง', emoji: '🛒', categoryIds: ['11', '12', '13'] },
  { id: 'health', name: 'สุขภาพ', emoji: '💊', categoryIds: ['14', '15'] },
  { id: 'entertainment', name: 'ความบันเทิง', emoji: '🎬', categoryIds: ['16', '17', '18'] },
  { id: 'family', name: 'ครอบครัวและสังคม', emoji: '👨‍👩‍👧', categoryIds: ['19', '20', '21', '22'] },
  { id: 'education', name: 'การศึกษา', emoji: '📚', categoryIds: ['23', '24'] },
  { id: 'travel', name: 'ท่องเที่ยว', emoji: '✈️', categoryIds: ['25'] },
  { id: 'finance', name: 'การเงิน', emoji: '💰', categoryIds: ['26', '27', '28'] },
  { id: 'pets', name: 'สัตว์เลี้ยง', emoji: '🐱', categoryIds: ['29'] },
  { id: 'other', name: 'อื่นๆ', emoji: '📦', categoryIds: ['30'] },
];

// Category group definitions for income categories
const incomeCategoryGroups: { id: string; name: string; emoji: string; categoryIds: string[] }[] = [
  { id: 'main', name: 'รายได้หลัก', emoji: '💰', categoryIds: ['101', '102', '103', '104'] },
  { id: 'extra', name: 'รายได้เสริม', emoji: '💵', categoryIds: ['105', '106', '107'] },
  { id: 'investment', name: 'รายได้จากการลงทุน', emoji: '📊', categoryIds: ['108', '109', '110'] },
  { id: 'special', name: 'รายได้พิเศษ', emoji: '🎁', categoryIds: ['111', '112', '113'] },
  { id: 'other', name: 'อื่นๆ', emoji: '📥', categoryIds: ['114'] },
];

export function CategorySelectSheet({
  open,
  onOpenChange,
  categories,
  selectedCategory,
  transactionType,
  onSelect,
}: CategorySelectSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Get the appropriate group definitions based on transaction type
  const categoryGroups = transactionType === 'expense' ? expenseCategoryGroups : incomeCategoryGroups;

  // Group categories by their group definitions
  const groupedCategories = useMemo(() => {
    const groups: { id: string; name: string; emoji: string; categories: Category[] }[] = [];
    const ungroupedCategories: Category[] = [];

    // Create a set of all category IDs that belong to a group
    const groupedIds = new Set(categoryGroups.flatMap(g => g.categoryIds));

    // Build groups from definitions
    categoryGroups.forEach(group => {
      const groupCats = categories.filter(cat => group.categoryIds.includes(cat.id));
      if (groupCats.length > 0) {
        groups.push({
          id: group.id,
          name: group.name,
          emoji: group.emoji,
          categories: groupCats,
        });
      }
    });

    // Find ungrouped categories (custom categories added by user)
    categories.forEach(cat => {
      if (!groupedIds.has(cat.id)) {
        ungroupedCategories.push(cat);
      }
    });

    // Add ungrouped as a separate group if there are any
    if (ungroupedCategories.length > 0) {
      groups.push({
        id: 'custom',
        name: 'หมวดหมู่ที่เพิ่มเอง',
        emoji: '✨',
        categories: ungroupedCategories,
      });
    }

    return groups;
  }, [categories, categoryGroups]);

  // Filter categories based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedCategories;

    const query = searchQuery.toLowerCase().trim();
    return groupedCategories
      .map(group => ({
        ...group,
        categories: group.categories.filter(cat =>
          cat.name.toLowerCase().includes(query)
        ),
      }))
      .filter(group => group.categories.length > 0);
  }, [groupedCategories, searchQuery]);

  const handleSelect = (category: Category) => {
    onSelect(category);
    onOpenChange(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="min-h-[60vh] max-h-[80vh] rounded-t-[2rem] px-0 pb-0 overflow-hidden border-t-0"
      >
        <SheetTitle className="sr-only">เลือกหมวดหมู่</SheetTitle>

        {/* Header */}
        <div className="relative">
          {/* Decorative gradient background */}
          <div
            className={cn(
              "absolute inset-0 opacity-20 transition-all duration-300",
              transactionType === 'expense' && "bg-linear-to-b from-expense via-expense/50 to-transparent",
              transactionType === 'income' && "bg-linear-to-b from-income via-income/50 to-transparent"
            )}
          />

          {/* Handle bar */}
          <div data-drag-handle className="flex justify-center pt-2 pb-2 touch-none">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Title & Close */}
          <div className="relative px-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl shadow-lg',
                    transactionType === 'expense'
                      ? 'bg-expense/15 shadow-expense/20'
                      : 'bg-income/15 shadow-income/20'
                  )}
                >
                  <span className="text-xl">
                    {transactionType === 'expense' ? '💸' : '💰'}
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">เลือกหมวดหมู่</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {transactionType === 'expense' ? 'รายจ่าย' : 'รายรับ'} • {categories.length} หมวดหมู่
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาหมวดหมู่..."
                className={cn(
                  "h-10 pl-10 pr-10 rounded-xl border-2 bg-muted/30",
                  "focus:bg-background transition-colors",
                  transactionType === 'expense'
                    ? 'focus:border-expense/50'
                    : 'focus:border-income/50'
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Groups List */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 max-h-[calc(85vh-180px)]">
          <div className="space-y-3 pt-3">
            {filteredGroups.map((group) => {
              const hasSelectedCategory = group.categories.some(c => c.id === selectedCategory?.id);

              return (
                <div
                  key={group.id}
                  className={cn(
                    "rounded-xl border-2 overflow-hidden transition-all duration-200",
                    hasSelectedCategory
                      ? transactionType === 'expense'
                        ? 'border-expense/30 bg-expense/5'
                        : 'border-income/30 bg-income/5'
                      : 'border-border/50 bg-card'
                  )}
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between px-3 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{group.emoji}</span>
                      <span className="text-sm font-semibold text-foreground">{group.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({group.categories.length})
                      </span>
                    </div>
                    {hasSelectedCategory && (
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full",
                          transactionType === 'expense'
                            ? 'bg-expense text-white'
                            : 'bg-income text-white'
                        )}
                      >
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>

                  {/* Category Items - Always Visible */}
                  <div className="px-2 pb-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.categories.map((category) => {
                        const isSelected = category.id === selectedCategory?.id;

                        return (
                          <button
                            key={category.id}
                            onClick={() => handleSelect(category)}
                            className={cn(
                              "flex items-center gap-2 px-2 py-0.5 rounded-lg",
                              "transition-all duration-200",
                              "hover:scale-[1.02] active:scale-[0.98]",
                              isSelected
                                ? cn(
                                    "ring-2 shadow-md",
                                    transactionType === 'expense'
                                      ? 'bg-expense/15 ring-expense/50 shadow-expense/20'
                                      : 'bg-income/15 ring-income/50 shadow-income/20'
                                  )
                                : "bg-muted/50 hover:bg-muted"
                            )}
                          >
                            <div
                              className={cn(
                                "flex size-9 items-center justify-center rounded-lg text-xl",
                                isSelected
                                  ? transactionType === 'expense'
                                    ? 'bg-expense/20'
                                    : 'bg-income/20'
                                  : 'bg-background'
                              )}
                            >
                              {category.icon || category.name.charAt(0)}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <span
                                className={cn(
                                  "text-xs font-medium truncate block",
                                  isSelected ? 'text-foreground' : 'text-muted-foreground'
                                )}
                              >
                                {category.name}
                              </span>
                            </div>
                            {isSelected && (
                              <Check
                                className={cn(
                                  "size-4 shrink-0",
                                  transactionType === 'expense' ? 'text-expense' : 'text-income'
                                )}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredGroups.length === 0 && (
              <div className="text-center py-8">
                <span className="text-4xl">🔍</span>
                <p className="text-sm text-muted-foreground mt-2">
                  ไม่พบหมวดหมู่ที่ค้นหา
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
