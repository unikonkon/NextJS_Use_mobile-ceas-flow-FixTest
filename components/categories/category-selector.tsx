'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Category, CategoryType } from '@/types';
import { CategoryGrid } from './category-grid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CategorySelectorProps {
  expenseCategories: Category[];
  incomeCategories: Category[];
  selectedId?: string;
  defaultType?: CategoryType;
  onSelect?: (category: Category) => void;
  onTypeChange?: (type: CategoryType) => void;
  className?: string;
}

export function CategorySelector({
  expenseCategories,
  incomeCategories,
  selectedId,
  defaultType = 'expense',
  onSelect,
  onTypeChange,
  className,
}: CategorySelectorProps) {
  const [activeType, setActiveType] = useState<CategoryType>(defaultType);

  const handleTypeChange = (value: string) => {
    const type = value as CategoryType;
    setActiveType(type);
    onTypeChange?.(type);
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <Tabs value={activeType} onValueChange={handleTypeChange} className="w-full">
        {/* Type Tabs */}
        <TabsList className="mx-4 mb-4 grid w-auto grid-cols-2 bg-muted/50">
          <TabsTrigger
            value="expense"
            className="data-[state=active]:bg-expense/10 data-[state=active]:text-expense data-[state=active]:shadow-none"
          >
            <span className="mr-1.5">💸</span>
            รายจ่าย
          </TabsTrigger>
          <TabsTrigger
            value="income"
            className="data-[state=active]:bg-income/10 data-[state=active]:text-income data-[state=active]:shadow-none"
          >
            <span className="mr-1.5">💰</span>
            รายรับ
          </TabsTrigger>
        </TabsList>

        {/* Category Grids */}
        <TabsContent value="expense" className="mt-0">
          <ScrollArea className="h-[280px]">
            <div className="px-4 pb-4">
              <CategoryGrid
                categories={expenseCategories}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="income" className="mt-0">
          <ScrollArea className="h-[280px]">
            <div className="px-4 pb-4">
              <CategoryGrid
                categories={incomeCategories}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
