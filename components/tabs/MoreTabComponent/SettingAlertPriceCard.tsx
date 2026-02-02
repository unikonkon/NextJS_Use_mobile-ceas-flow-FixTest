'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAlertSettingsStore, useCategoryStore } from '@/lib/stores';
import { Bell, Target, Tags, Info, Plus, Trash2, X } from 'lucide-react';
import type { Category } from '@/types';

function formatNumber(value: number): string {
  return value.toLocaleString('th-TH');
}

function CategorySelector({
  categories,
  selectedIds,
  onSelect,
  onClose,
}: {
  categories: Category[];
  selectedIds: string[];
  onSelect: (categoryId: string) => void;
  onClose: () => void;
}) {
  const available = categories.filter((c) => !selectedIds.includes(c.id));

  if (available.length === 0) {
    return (
      <div className="rounded-lg bg-muted/30 p-3 text-center text-sm text-muted-foreground">
        เลือกหมวดหมู่ทั้งหมดแล้ว
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">เลือกหมวดหมู่</span>
        <button onClick={onClose} className="rounded-md p-0.5 hover:bg-muted transition-colors">
          <X className="size-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium',
              'hover:border-primary/50 hover:bg-primary/5 transition-colors'
            )}
          >
            {cat.icon && <span>{cat.icon}</span>}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingAlertPriceCard() {
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [newLimitAmount, setNewLimitAmount] = useState<Record<string, string>>({});

  // Alert settings store
  const monthlyExpenseTarget = useAlertSettingsStore((s) => s.monthlyExpenseTarget);
  const isMonthlyTargetEnabled = useAlertSettingsStore((s) => s.isMonthlyTargetEnabled);
  const categoryLimits = useAlertSettingsStore((s) => s.categoryLimits);
  const isCategoryLimitsEnabled = useAlertSettingsStore((s) => s.isCategoryLimitsEnabled);
  const setMonthlyExpenseTarget = useAlertSettingsStore((s) => s.setMonthlyExpenseTarget);
  const setIsMonthlyTargetEnabled = useAlertSettingsStore((s) => s.setIsMonthlyTargetEnabled);
  const setIsCategoryLimitsEnabled = useAlertSettingsStore((s) => s.setIsCategoryLimitsEnabled);
  const addCategoryLimit = useAlertSettingsStore((s) => s.addCategoryLimit);
  const removeCategoryLimit = useAlertSettingsStore((s) => s.removeCategoryLimit);
  const updateCategoryLimit = useAlertSettingsStore((s) => s.updateCategoryLimit);

  // Category store
  const expenseCategories = useCategoryStore((s) => s.expenseCategories);

  const getCategoryById = (id: string) => expenseCategories.find((c) => c.id === id);

  const handleMonthlyTargetChange = (value: string) => {
    const num = value === '' ? null : Number(value.replace(/,/g, ''));
    if (num !== null && isNaN(num)) return;
    setMonthlyExpenseTarget(num);
  };

  const handleAddCategory = (categoryId: string) => {
    const defaultLimit = 1000;
    addCategoryLimit(categoryId, defaultLimit);
    setShowCategorySelector(false);
  };

  const handleLimitChange = (categoryId: string, value: string) => {
    setNewLimitAmount((prev) => ({ ...prev, [categoryId]: value }));
    const num = Number(value.replace(/,/g, ''));
    if (!isNaN(num) && num > 0) {
      updateCategoryLimit(categoryId, num);
    }
  };

  return (
    <Card className="group relative overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-soft">
      {/* Decorative gradient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          background:
            'radial-gradient(ellipse at top right, var(--primary) 0%, transparent 50%), radial-gradient(ellipse at bottom left, var(--accent) 0%, transparent 50%)',
        }}
      />

      <CardContent className="relative p-5">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5">
            <Bell className="size-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">แจ้งเตือนรายจ่าย</h3>
            <p className="text-xs text-muted-foreground">ตั้งเป้าหมายและลิมิตรายจ่าย</p>
          </div>
        </div>

        {/* ===== Section 1: Monthly Expense Target ===== */}
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Target className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">เป้าหมายรายจ่ายต่อเดือน</span>
                <span className="text-xs text-muted-foreground">
                  แจ้งเตือนเมื่อรายจ่ายใกล้ถึงหรือเกินเป้า
                </span>
              </div>
            </div>
            <Switch
              checked={isMonthlyTargetEnabled}
              onCheckedChange={setIsMonthlyTargetEnabled}
              className={cn('data-[state=checked]:bg-primary', 'transition-colors duration-200')}
            />
          </div>

          {isMonthlyTargetEnabled && (
            <div className="mt-3 animate-slide-up">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                จำนวนเงิน (บาท)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="เช่น 10,000"
                value={monthlyExpenseTarget !== null ? String(monthlyExpenseTarget) : ''}
                onChange={(e) => handleMonthlyTargetChange(e.target.value)}
                className="h-10"
              />
              {monthlyExpenseTarget !== null && monthlyExpenseTarget > 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  เป้าหมาย: {formatNumber(monthlyExpenseTarget)} บาท/เดือน
                </p>
              )}
            </div>
          )}
        </div>

        {/* ===== Section 2: Category Limits ===== */}
        <div className="mt-3 rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Tags className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">ลิมิตรายจ่ายเฉพาะหมวดหมู่</span>
                <span className="text-xs text-muted-foreground">
                  กำหนดวงเงินแต่ละหมวดหมู่
                </span>
              </div>
            </div>
            <Switch
              checked={isCategoryLimitsEnabled}
              onCheckedChange={setIsCategoryLimitsEnabled}
              className={cn('data-[state=checked]:bg-primary', 'transition-colors duration-200')}
            />
          </div>

          {isCategoryLimitsEnabled && (
            <div className="mt-3 space-y-2 animate-slide-up">
              {/* Selected category limits */}
              {categoryLimits.map((cl) => {
                const cat = getCategoryById(cl.categoryId);
                if (!cat) return null;

                return (
                  <div
                    key={cl.categoryId}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {cat.icon && <span className="text-base">{cat.icon}</span>}
                      <span className="text-sm font-medium truncate">{cat.name}</span>
                    </div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={
                        newLimitAmount[cl.categoryId] !== undefined
                          ? newLimitAmount[cl.categoryId]
                          : String(cl.limit)
                      }
                      onChange={(e) => handleLimitChange(cl.categoryId, e.target.value)}
                      className="h-8 w-24 text-right text-sm"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">บาท</span>
                    <button
                      onClick={() => removeCategoryLimit(cl.categoryId)}
                      className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* Add category button */}
              {!showCategorySelector && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCategorySelector(true)}
                  className="w-full gap-1.5 text-xs"
                >
                  <Plus className="size-3.5" />
                  เพิ่มหมวดหมู่
                </Button>
              )}

              {/* Category selector */}
              {showCategorySelector && (
                <CategorySelector
                  categories={expenseCategories}
                  selectedIds={categoryLimits.map((cl) => cl.categoryId)}
                  onSelect={handleAddCategory}
                  onClose={() => setShowCategorySelector(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent/50 p-3 text-xs">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p className="leading-relaxed text-muted-foreground">
            ระบบจะแจ้งเตือนที่หน้าหลักเมื่อรายจ่ายถึง 80% ของเป้าหมาย
            และแจ้งเตือนสีแดงเมื่อเกินเป้าหมาย ค่าตั้งค่าจะถูกบันทึกไว้ในเครื่อง
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
