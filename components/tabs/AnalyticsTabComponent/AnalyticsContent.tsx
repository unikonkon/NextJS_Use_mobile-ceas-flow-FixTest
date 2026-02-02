'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { PageContainer } from '@/components/layout';
import { CurrencyDisplay } from '@/components/common';
import { useTransactionStore, useCategoryStore, useWalletStore, useAnalysisStore } from '@/lib/stores';
import { ReusedTransactionSheet } from './ReusedTransactionFilters';
import { CategorySummary, TransactionWithCategory, Category, Wallet } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  PieChart,
  Check,
  ChevronDown,
  CalendarDays,
  Calendar,
  RotateCcw,
  Receipt,
  FileText,
  Wallet as WalletIcon,
  TrendingDown,
  TrendingUp,
  Layers,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// ============================================
// Types
// ============================================
type FilterMode = 'monthly' | 'yearly';
type ChartViewMode = 'expense' | 'income' | 'all';

interface MonthSelection {
  month: number;
  year: number;
  key: string;
}

// ============================================
// Utility Functions
// ============================================
function getMonthKey(month: number, year: number): string {
  return `${year}-${month.toString().padStart(2, '0')}`;
}

function getFullMonthName(month: number): string {
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  return months[month];
}

function getShortMonthName(month: number): string {
  const months = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  return months[month];
}

function filterByMonths(
  transactions: TransactionWithCategory[],
  selections: MonthSelection[]
): TransactionWithCategory[] {
  return transactions.filter((t) =>
    selections.some(
      (s) => t.date.getMonth() === s.month && t.date.getFullYear() === s.year
    )
  );
}

function filterByYear(
  transactions: TransactionWithCategory[],
  year: number
): TransactionWithCategory[] {
  return transactions.filter((t) => t.date.getFullYear() === year);
}

function computeCategorySummaries(
  transactions: TransactionWithCategory[],
  type: 'expense' | 'income' | 'all'
): CategorySummary[] {
  const filtered = type === 'all'
    ? transactions
    : transactions.filter((t) => t.type === type);
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = new Map<string, CategorySummary>();

  filtered.forEach((t) => {
    const existing = categoryMap.get(t.categoryId);
    if (existing) {
      existing.amount += t.amount;
      existing.transactionCount += 1;
    } else {
      categoryMap.set(t.categoryId, {
        category: t.category,
        amount: t.amount,
        percentage: 0,
        transactionCount: 1,
      });
    }
  });

  const summaries = Array.from(categoryMap.values())
    .map((s) => ({
      ...s,
      percentage: total > 0 ? (s.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return summaries;
}

function getAvailableYears(transactions: TransactionWithCategory[]): number[] {
  const years = new Set(transactions.map((t) => t.date.getFullYear()));
  return Array.from(years).sort((a, b) => b - a);
}

// ============================================
// Chart Colors
// ============================================
const CHART_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#84cc16', '#6366f1',
];

// ============================================
// Sub Components
// ============================================

function FilterModeToggle({
  mode,
  onModeChange,
}: {
  mode: FilterMode;
  onModeChange: (mode: FilterMode) => void;
}) {
  return (
    <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
      <button
        onClick={() => onModeChange('monthly')}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
          mode === 'monthly'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <CalendarDays className="size-4" />
        <span>รายเดือน</span>
      </button>
      <button
        onClick={() => onModeChange('yearly')}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
          mode === 'yearly'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Calendar className="size-4" />
        <span>รายปี</span>
      </button>
    </div>
  );
}

// Chart view mode configuration
const CHART_VIEW_MODES: {
  mode: ChartViewMode;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}[] = [
    {
      mode: 'expense',
      label: 'รายจ่ายตามหมวดหมู่',
      shortLabel: 'รายจ่าย',
      icon: <TrendingDown className="size-4" />,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    {
      mode: 'income',
      label: 'รายรับตามหมวดหมู่',
      shortLabel: 'รายรับ',
      icon: <TrendingUp className="size-4" />,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      mode: 'all',
      label: 'รวมทั้งหมดตามหมวดหมู่',
      shortLabel: 'รวมทั้งหมด',
      icon: <Layers className="size-4" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

function ChartViewModeSelector({
  mode,
  onModeChange,
  expenseTotal,
  incomeTotal,
  allTotal,
}: {
  mode: ChartViewMode;
  onModeChange: (mode: ChartViewMode) => void;
  expenseTotal: number;
  incomeTotal: number;
  allTotal: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentMode = CHART_VIEW_MODES.find((m) => m.mode === mode)!;

  const getTotalForMode = (viewMode: ChartViewMode) => {
    switch (viewMode) {
      case 'expense':
        return expenseTotal;
      case 'income':
        return incomeTotal;
      case 'all':
        return allTotal;
    }
  };

  return (
    <div className="relative">
      {/* Current Selection Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-1 rounded-xl',
          'bg-linear-to-r from-card via-card to-muted/30',
          'border border-border/50',
          'transition-all duration-300 hover:shadow-md',
          isExpanded && 'ring-2 ring-primary/20'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'size-8 rounded-xl flex items-center justify-center',
              'transition-all duration-300',
              currentMode.bgColor,
              currentMode.color
            )}
          >
            {currentMode.icon}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">
              {currentMode.label}
            </p>
            {/* <p className={cn('text-xs font-medium', currentMode.color)}>
              ฿{getTotalForMode(mode).toLocaleString()}
            </p> */}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'size-5 text-muted-foreground transition-transform duration-300',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Expanded Options */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-out overflow-hidden',
          isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="flex gap-2 p-1 bg-muted/30 rounded-2xl">
            {CHART_VIEW_MODES.map((viewMode, index) => {
              const isActive = mode === viewMode.mode;
              const total = getTotalForMode(viewMode.mode);

              return (
                <button
                  key={viewMode.mode}
                  onClick={() => {
                    onModeChange(viewMode.mode);
                    setIsExpanded(false);
                  }}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl',
                    'transition-all duration-300',
                    isActive
                      ? 'bg-card shadow-md scale-[1.02]'
                      : 'hover:bg-card/50 active:scale-95'
                  )}
                  style={{
                    transitionDelay: isExpanded ? `${index * 50}ms` : '0ms',
                  }}
                >
                  <div
                    className={cn(
                      'size-9 rounded-lg flex items-center justify-center',
                      'transition-all duration-300',
                      isActive ? viewMode.bgColor : 'bg-muted/50',
                      isActive ? viewMode.color : 'text-muted-foreground'
                    )}
                  >
                    {viewMode.icon}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium transition-colors duration-300',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {viewMode.shortLabel}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold transition-colors duration-300',
                      isActive ? viewMode.color : 'text-muted-foreground/70'
                    )}
                  >
                    ฿{total.toLocaleString()}
                  </span>
                  {isActive && (
                    <div
                      className={cn(
                        'absolute -top-1 -right-1 size-4 rounded-full',
                        'flex items-center justify-center',
                        'bg-primary shadow-lg'
                      )}
                    >
                      <Check className="size-2.5 text-primary-foreground" />
                    </div>
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

function YearSelector({
  years,
  selectedYear,
  onSelect,
  showFullYear,
}: {
  years: number[];
  selectedYear: number;
  onSelect: (year: number) => void;
  showFullYear?: boolean;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {years.map((year) => (
        <button
          key={year}
          onClick={() => onSelect(year)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300',
            'border border-transparent shrink-0',
            selectedYear === year
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {showFullYear ? `พ.ศ. ${year + 543}` : year + 543}
        </button>
      ))}
    </div>
  );
}

function MonthMultiSelector({
  selectedYear,
  selectedMonths,
  onToggleMonth,
  currentMonth,
  currentYear,
  onNavigate,
}: {
  selectedYear: number;
  selectedMonths: MonthSelection[];
  onToggleMonth: (month: number) => void;
  currentMonth: number;
  currentYear: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}) {
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="space-y-3">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('prev')}
          className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:scale-95"
        >
          <ChevronLeft className="size-5 text-muted-foreground" />
        </button>

        <div className="text-center">
          <p className="text-base font-semibold text-foreground">
            {selectedMonths.length === 1
              ? getFullMonthName(selectedMonths[0].month)
              : selectedMonths.length === 12
                ? 'ทั้งปี'
                : `${selectedMonths.length} เดือน`}
          </p>
          <p className="text-xs text-muted-foreground">
            พ.ศ. {selectedYear + 543}
          </p>
        </div>

        <button
          onClick={() => onNavigate('next')}
          className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:scale-95"
        >
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-4 gap-2">
        {months.map((month) => {
          const isSelected = selectedMonths.some((s) => s.month === month);
          const isCurrent = month === currentMonth && selectedYear === currentYear;

          return (
            <button
              key={month}
              onClick={() => onToggleMonth(month)}
              className={cn(
                'relative py-1.5 px-2 rounded-xl text-sm font-medium transition-all duration-200',
                'border-2',
                isSelected
                  ? 'bg-primary/10 border-primary text-primary'
                  : isCurrent
                    ? 'bg-muted border-muted-foreground/30 text-foreground'
                    : 'bg-card border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              {getShortMonthName(month)}
              {isSelected && (
                <div className="absolute -top-1 -right-1 size-4 bg-primary rounded-full flex items-center justify-center">
                  <Check className="size-2.5 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <p className="text-xs text-center text-muted-foreground">
        กดเลือกหลายเดือนได้ • กดซ้ำเพื่อยกเลิก
      </p>
    </div>
  );
}

function WalletSelector({
  wallets,
  selectedWalletId,
  onSelect,
}: {
  wallets: Wallet[];
  selectedWalletId: string | null;
  onSelect: (walletId: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <WalletIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">กระเป๋าเงิน</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* All wallets option */}
        <button
          onClick={() => onSelect(null)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
            'border-2',
            selectedWalletId === null
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-card border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          <div className="size-5 rounded-lg bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-[10px] text-white font-bold">All</span>
          </div>
          <span>ทั้งหมด</span>
          {selectedWalletId === null && (
            <div className="size-4 bg-primary rounded-full flex items-center justify-center ml-0.5">
              <Check className="size-2.5 text-primary-foreground" />
            </div>
          )}
        </button>

        {/* Individual wallets */}
        {wallets.map((wallet) => (
          <button
            key={wallet.id}
            onClick={() => onSelect(wallet.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              'border-2',
              selectedWalletId === wallet.id
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <div
              className="size-5 rounded-lg flex items-center justify-center text-xs"
              style={{ backgroundColor: `${wallet.color}25` }}
            >
              {wallet.icon}
            </div>
            <span className="truncate max-w-[80px]">{wallet.name}</span>
            {selectedWalletId === wallet.id && (
              <div className="size-4 bg-primary rounded-full flex items-center justify-center ml-0.5">
                <Check className="size-2.5 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function DonutChart({
  summaries,
  totalAmount,
  centerLabel,
  chartKey,
  viewMode = 'expense',
}: {
  summaries: CategorySummary[];
  totalAmount: number;
  centerLabel: string;
  chartKey: string;
  viewMode?: ChartViewMode;
}) {
  // Get variant based on view mode
  const currencyVariant = viewMode === 'income' ? 'income' : viewMode === 'all' ? 'default' : 'expense';
  const [isVisible, setIsVisible] = useState(false);
  const [isSmallCategoriesExpanded, setIsSmallCategoriesExpanded] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [chartKey]);

  const data = useMemo(() => {
    if (summaries.length === 0) {
      return {
        labels: ['ไม่มีข้อมูล'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e5e7eb'],
          borderWidth: 0,
          cutout: '65%',
        }],
      };
    }

    return {
      labels: summaries.map((s) => `${s.category.icon} ${s.category.name}`),
      datasets: [{
        data: summaries.map((s) => s.amount),
        backgroundColor: summaries.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 0,
        cutout: '65%',
        borderRadius: 6,
        spacing: 3,
      }],
    };
  }, [summaries]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(20, 20, 20, 0.95)',
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        padding: 14,
        cornerRadius: 14,
        displayColors: true,
        boxPadding: 6,
        titleFont: { size: 13, weight: 600 },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context: { parsed: number }) => {
            const value = context.parsed;
            const percentage = totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : '0';
            return ` ${value.toLocaleString()} บาท (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 700,
      easing: 'easeOutQuart' as const,
    },
  }), [totalAmount]);

  // Threshold for small categories
  const SMALL_CATEGORY_THRESHOLD = 3;

  // Calculate label positions around the donut
  const labelPositions = useMemo(() => {
    if (summaries.length === 0) return [];

    const total = summaries.reduce((sum, s) => sum + s.amount, 0);
    let currentAngle = -Math.PI / 2;
    const radius = 140;

    return summaries.map((summary, index) => {
      const percentage = total > 0 ? (summary.amount / total) * 100 : 0;
      const angleSize = (summary.amount / total) * 2 * Math.PI;
      const midAngle = currentAngle + angleSize / 2;
      currentAngle += angleSize;

      const x = Math.cos(midAngle) * radius;
      const y = Math.sin(midAngle) * radius;

      const isRightSide = midAngle > -Math.PI / 2 && midAngle < Math.PI / 2;

      return {
        summary,
        index,
        x,
        y,
        percentage,
        isRightSide,
        isSmall: percentage < SMALL_CATEGORY_THRESHOLD,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
  }, [summaries]);

  const largeCategories = useMemo(() => {
    return labelPositions.filter(l => !l.isSmall);
  }, [labelPositions]);

  const smallCategories = useMemo(() => {
    return labelPositions.filter(l => l.isSmall && l.percentage > 0);
  }, [labelPositions]);

  return (
    <div className="relative">
      {/* Chart Container with Labels */}
      <div className="relative w-full max-w-[320px] mx-auto aspect-square">
        {/* The Chart */}
        <div className="absolute inset-[25px]">
          <Doughnut key={chartKey} data={data} options={options} />
        </div>

        {/* Floating Labels for LARGE categories */}
        {isVisible && largeCategories.length > 0 && largeCategories.map((item, idx) => {
          const centerOffset = 160;
          const labelX = centerOffset + item.x * 1.05;
          const labelY = centerOffset + item.y * 1.15;

          return (
            <div
              key={item.summary.category.id}
              className={cn(
                'absolute transition-all duration-600',
                'pointer-events-none',
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              )}
              style={{
                left: labelX,
                top: labelY,
                transform: `translate(-50%, -50%)`,
                transitionDelay: `${idx * 80 + 200}ms`,
              }}
            >
              <div
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-xl shadow-lg backdrop-blur-md',
                  'border bg-background/80'
                )}
                style={{
                  borderColor: `${item.color}50`,
                  boxShadow: `0 4px 12px ${item.color}20`,
                }}
              >
                <div
                  className="size-6 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ backgroundColor: `${item.color}25` }}
                >
                  {item.summary.category.icon}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-medium text-foreground truncate max-w-[80px]">
                    {item.summary.category.name}
                  </span>
                  <span
                    className="text-[12px] font-bold"
                    style={{ color: item.color }}
                  >
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">
            {centerLabel}
          </span>
          <CurrencyDisplay
            amount={totalAmount}
            size="lg"
            variant={currencyVariant}
            className="text-xl! font-bold"
          />
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {summaries.length} หมวด
          </span>
        </div>
      </div>

      {/* Legend - Small categories */}
      {smallCategories.length > 0 && (
        <div className="mt-7">
          <button
            onClick={() => setIsSmallCategoriesExpanded(!isSmallCategoriesExpanded)}
            className="w-full flex items-center justify-center gap-2 mb-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-px flex-1 bg-border/40" />
            <div className="flex items-center gap-1.5 px-2">
              <span className="text-[10px] text-muted-foreground font-medium">
                หมวดอื่นๆ ({smallCategories.length})
              </span>
              <ChevronDown
                className={cn(
                  'size-3 text-muted-foreground transition-transform duration-200',
                  isSmallCategoriesExpanded && 'rotate-180'
                )}
              />
            </div>
            <div className="h-px flex-1 bg-border/40" />
          </button>

          <div
            className={cn(
              'grid transition-all duration-100 ease-in-out overflow-hidden',
              isSmallCategoriesExpanded ? 'grid-rows-[1fr] opacity-100 pb-2' : 'grid-rows-[0fr] opacity-0'
            )}
          >
            <div className="flex flex-wrap justify-center gap-1.5 min-h-0">
              {smallCategories.map((item, idx) => (
                <div
                  key={item.summary.category.id}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md shrink-0',
                    'bg-muted/30 border border-border/20',
                    'transition-all duration-100 hover:bg-muted/50',
                    isVisible && isSmallCategoriesExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                  )}
                  style={{ transitionDelay: isSmallCategoriesExpanded ? `${idx * 30 + 50}ms` : '0ms' }}
                >
                  <span className="text-xs">{item.summary.category.icon}</span>
                  <span className="text-[10px] text-muted-foreground max-w-[65px] truncate">
                    {item.summary.category.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground"> {item.percentage.toFixed(1)}% </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Category Detail Sheet
// ============================================
interface GroupedTransactions {
  date: Date;
  dateKey: string;
  transactions: TransactionWithCategory[];
  totalAmount: number;
}

function formatDateThai(date: Date): string {
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function groupTransactionsByDate(transactions: TransactionWithCategory[]): GroupedTransactions[] {
  const grouped = new Map<string, GroupedTransactions>();

  transactions.forEach((t) => {
    const dateKey = t.date.toISOString().split('T')[0];
    const existing = grouped.get(dateKey);

    if (existing) {
      existing.transactions.push(t);
      existing.totalAmount += t.amount;
    } else {
      grouped.set(dateKey, {
        date: t.date,
        dateKey,
        transactions: [t],
        totalAmount: t.amount,
      });
    }
  });

  return Array.from(grouped.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getTotalDaysInMonths(transactions: TransactionWithCategory[]): number {
  if (transactions.length === 0) return 0;

  const monthSet = new Set<string>();
  transactions.forEach((t) => {
    const year = t.date.getFullYear();
    const month = t.date.getMonth();
    monthSet.add(`${year}-${month}`);
  });

  let totalDays = 0;
  monthSet.forEach((monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    totalDays += getDaysInMonth(year, month);
  });

  return totalDays;
}

function CategoryDetailSheet({
  isOpen,
  onClose,
  category,
  transactions,
  color,
  totalAmount,
  viewMode = 'expense',
}: {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  transactions: TransactionWithCategory[];
  color: string;
  totalAmount: number;
  viewMode?: ChartViewMode;
}) {
  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(transactions),
    [transactions]
  );

  const totalDaysInMonths = useMemo(
    () => getTotalDaysInMonths(transactions),
    [transactions]
  );

  const getCurrencyVariant = (txType: 'expense' | 'income') => {
    if (viewMode === 'all') return txType;
    return viewMode;
  };

  const viewModeLabel = viewMode === 'expense' ? 'รายจ่าย' : viewMode === 'income' ? 'รายรับ' : 'รวม';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0">
        {/* Drag Handle */}
        <div className="flex justify-center pt-2 pb-3" data-drag-handle>
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div
              className="size-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
              style={{
                backgroundColor: `${color}20`,
                boxShadow: `0 4px 20px ${color}30`,
              }}
            >
              {category.icon}
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl">{category.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <span style={{ color }}>
                  ฿{totalAmount.toLocaleString()}
                </span>
                <span
                  className={cn(
                    'ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium',
                    viewMode === 'expense' && 'bg-rose-500/10 text-rose-500',
                    viewMode === 'income' && 'bg-emerald-500/10 text-emerald-500',
                    viewMode === 'all' && 'bg-blue-500/10 text-blue-500'
                  )}
                >
                  {viewModeLabel}
                </span>
                {transactions.length > 0 && (
                  <span className="text-muted-foreground pl-2">
                    เดือน {getFullMonthName(transactions[0].date.getMonth())}
                  </span>
                )}
              </SheetDescription>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex gap-2 justify-center">
            <div className="wbg-muted/30 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">รายการ</p>
              <p className="text-lg font-bold text-foreground">{transactions.length}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">วันทำรายการ</p>
              <p className="text-lg font-bold text-foreground">{groupedTransactions.length}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">เฉลี่ย/วัน จาก {totalDaysInMonths} วัน</p>
              <p className="text-lg font-bold" style={{ color }}>
                ฿{totalDaysInMonths > 0 ? Math.round(totalAmount / totalDaysInMonths).toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Transaction List by Date */}
        <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-3">
          {groupedTransactions.map((group, groupIdx) => (
            <div key={group.dateKey} className="space-y-2">
              <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1 z-10">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium text-foreground">
                    {formatDateThai(group.date)}
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ color }}>
                  ฿{group.totalAmount.toLocaleString()}
                </span>
              </div>

              <div className="space-y-1.5 pl-4 border-l-2 ml-0.5" style={{ borderColor: `${color}30` }}>
                {group.transactions.map((transaction, txIdx) => (
                  <div
                    key={transaction.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl',
                      'bg-card border border-border/30',
                      'transition-all duration-300 hover:bg-muted/30'
                    )}
                    style={{
                      animationDelay: `${groupIdx * 50 + txIdx * 30}ms`,
                    }}
                  >
                    <div className="size-9 rounded-lg bg-muted/50 flex items-center justify-center">
                      {transaction.note ? (
                        <FileText className="size-4 text-muted-foreground" />
                      ) : (
                        <Receipt className="size-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {transaction.note || category.name}
                        </p>
                        <CurrencyDisplay
                          amount={transaction.amount}
                          size="sm"
                          variant={getCurrencyVariant(transaction.type)}
                          className="font-semibold shrink-0"
                        />
                      </div>
                      {transaction.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {category.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {transactions.length === 0 && (
            <div className="py-12 text-center">
              <Receipt className="size-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">ไม่มีรายการ</p>
            </div>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}

function CategoryList({
  summaries,
  transactions,
  viewMode,
  filterMode,
  selectedMonths,
  selectedYear,
}: {
  summaries: CategorySummary[];
  transactions: TransactionWithCategory[];
  viewMode: ChartViewMode;
  filterMode: FilterMode;
  selectedMonths: MonthSelection[];
  selectedYear: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{
    category: Category;
    color: string;
    transactions: TransactionWithCategory[];
    totalAmount: number;
  } | null>(null);

  useEffect(() => {
    setMounted(false);
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, [summaries]);

  const handleCategoryClick = useCallback(
    (summary: CategorySummary, index: number) => {
      const categoryTransactions = transactions.filter((t) => {
        const matchesCategory = t.categoryId === summary.category.id;
        if (viewMode === 'all') return matchesCategory;
        return matchesCategory && t.type === viewMode;
      });
      setSelectedCategory({
        category: summary.category,
        color: CHART_COLORS[index % CHART_COLORS.length],
        transactions: categoryTransactions,
        totalAmount: summary.amount,
      });
    },
    [transactions, viewMode]
  );

  const totalDays = useMemo(() => {
    if (filterMode === 'yearly') {
      let days = 0;
      for (let m = 0; m < 12; m++) {
        days += getDaysInMonth(selectedYear, m);
      }
      return days;
    }
    return selectedMonths.reduce((sum, s) => sum + getDaysInMonth(s.year, s.month), 0);
  }, [filterMode, selectedMonths, selectedYear]);

  if (summaries.length === 0) {
    return (
      <div className="py-12 text-center">
        <PieChart className="size-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">ไม่มีรายการในช่วงเวลานี้</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {summaries.map((summary, index) => (
          <button
            key={summary.category.id}
            onClick={() => handleCategoryClick(summary, index)}
            className={cn(
              'relative w-full overflow-hidden rounded-2xl bg-card border border-border/50',
              'transition-all duration-500 text-left',
              'hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            )}
            style={{
              transitionDelay: mounted ? `${index * 40}ms` : '0ms',
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.08] transition-all duration-500"
              style={{
                background: `linear-gradient(90deg, ${CHART_COLORS[index % CHART_COLORS.length]} ${summary.percentage}%, transparent ${summary.percentage}%)`,
              }}
            />
            <div className="relative flex items-center gap-1.5 p-2">
              <div
                className="shrink-0 size-11 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}20` }}
              >
                {summary.category.icon}
              </div>
              <div className="flex justify-between w-full items-center">
                <div className="flex-1 max-w-[125px] justify-between gap-2">
                  <div className="flex gap-2 min-w-0">
                    <p className="font-medium text-foreground truncate">{summary.category.name}</p>
                    {viewMode === 'all' && (
                      <div
                        className={cn(
                          'flex gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0',
                          summary.category.type === 'expense'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        )}
                      >
                        {summary.category.type === 'expense' ? (
                          <>
                            <TrendingDown className="size-2.5" />
                            <span>รายจ่าย</span>
                          </>
                        ) : (
                          <>
                            <TrendingUp className="size-2.5" />
                            <span>รายรับ</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[15px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      // backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}15`,
                      color: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  >
                    {summary.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-end items-center gap-2">
                  <div className="flex-col min-w-0 flex items-end gap-1">
                    <CurrencyDisplay
                      amount={summary.amount}
                      size="md"
                      variant={viewMode === 'expense' ? 'expense' : viewMode === 'income' ? 'income' : summary.category.type === 'expense' ? 'expense' : 'income'}
                      className="font-semibold shrink-0"
                    />
                    <span className="text-[8px] text-muted-foreground flex items-center gap-1">เฉลี่ยต่อวัน
                      <CurrencyDisplay
                        amount={totalDays > 0 ? Math.round(summary.amount / totalDays) : 0}
                        size="sm"
                        variant="muted"
                        className="font-medium shrink-0 opacity-75"
                      />
                    </span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/50 shrink-0" />

                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedCategory && (
        <CategoryDetailSheet
          isOpen={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          category={selectedCategory.category}
          transactions={selectedCategory.transactions}
          color={selectedCategory.color}
          totalAmount={selectedCategory.totalAmount}
          viewMode={viewMode}
        />
      )}
    </>
  );
}

// ============================================
// Daily Average Summary
// ============================================
function DailyAverageSummary({
  filterMode,
  selectedMonths,
  selectedYear,
  chartViewMode,
  totalExpense,
  totalIncome,
  totalAll,
}: {
  filterMode: FilterMode;
  selectedMonths: MonthSelection[];
  selectedYear: number;
  chartViewMode: ChartViewMode;
  totalExpense: number;
  totalIncome: number;
  totalAll: number;
}) {
  const totalDays = useMemo(() => {
    if (filterMode === 'yearly') {
      let days = 0;
      for (let m = 0; m < 12; m++) {
        days += getDaysInMonth(selectedYear, m);
      }
      return days;
    }
    return selectedMonths.reduce((sum, s) => sum + getDaysInMonth(s.year, s.month), 0);
  }, [filterMode, selectedMonths, selectedYear]);

  const items = useMemo(() => {
    if (chartViewMode === 'all') {
      return [
        {
          label: 'รายจ่าย/วัน',
          total: totalExpense,
          avg: totalDays > 0 ? Math.round(totalExpense / totalDays) : 0,
          color: 'text-rose-500',
          bgColor: 'bg-rose-500/10',
          icon: <TrendingDown className="size-3.5" />,
        },
        {
          label: 'รายรับ/วัน',
          total: totalIncome,
          avg: totalDays > 0 ? Math.round(totalIncome / totalDays) : 0,
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
          icon: <TrendingUp className="size-3.5" />,
        },
        // {
        //   label: 'รวม/วัน',
        //   total: totalAll,
        //   avg: totalDays > 0 ? Math.round(totalAll / totalDays) : 0,
        //   color: 'text-blue-500',
        //   bgColor: 'bg-blue-500/10',
        //   icon: <Layers className="size-3.5" />,
        // },
      ];
    }

    const isExpense = chartViewMode === 'expense';
    const total = isExpense ? totalExpense : totalIncome;
    return [
      {
        label: isExpense ? 'รายจ่าย/วัน' : 'รายรับ/วัน',
        total,
        avg: totalDays > 0 ? Math.round(total / totalDays) : 0,
        color: isExpense ? 'text-rose-500' : 'text-emerald-500',
        bgColor: isExpense ? 'bg-rose-500/10' : 'bg-emerald-500/10',
        icon: isExpense ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />,
      },
    ];
  }, [chartViewMode, totalExpense, totalIncome, totalAll, totalDays]);

  return (
    <div className="flex gap-2 mb-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/40',
            'bg-card'
          )}
        >
          <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', item.bgColor, item.color)}>
            {item.icon}
          </div>
          <div className={cn("min-w-0", chartViewMode === 'all' ? '' : 'flex justify-between w-full')}>
            <p className="text-[12px] font-semibold text-muted-foreground truncate">{item.label}</p>
            <p className={cn('text-sm font-bold', item.color)}>
              ฿{item.avg.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
      <div className="flex items-center px-2 bg-card rounded-xl border border-border/40">
        <span className="text-[14px] font-semibold text-muted-foreground whitespace-nowrap">
          {totalDays} วัน
        </span>
      </div>
    </div>
  );
}

// ============================================
// Main AnalyticsContent Component
// ============================================
export function AnalyticsContent() {
  const transactions = useTransactionStore((s) => s.transactions);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const isInitialized = useTransactionStore((s) => s.isInitialized);
  const selectedWalletId = useTransactionStore((s) => s.selectedWalletId);
  const setSelectedWalletId = useTransactionStore((s) => s.setSelectedWalletId);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const categoryInitialized = useCategoryStore((s) => s.isInitialized);
  const getAllCategories = useCategoryStore((s) => s.getAllCategories);
  const wallets = useWalletStore((s) => s.wallets);
  const loadWallets = useWalletStore((s) => s.loadWallets);
  const walletInitialized = useWalletStore((s) => s.isInitialized);

  // Analysis Store
  const analysisRecords = useAnalysisStore((s) => s.analysisRecords);
  const loadAnalysis = useAnalysisStore((s) => s.loadAnalysis);
  const analysisInitialized = useAnalysisStore((s) => s.isInitialized);

  // Reused Transactions Sheet state
  const [isReusedSheetOpen, setIsReusedSheetOpen] = useState(false);

  useEffect(() => {
    if (!categoryInitialized) loadCategories();
  }, [categoryInitialized, loadCategories]);

  useEffect(() => {
    if (!walletInitialized) loadWallets();
  }, [walletInitialized, loadWallets]);

  useEffect(() => {
    if (!isInitialized && categoryInitialized) loadTransactions();
  }, [isInitialized, categoryInitialized, loadTransactions]);

  useEffect(() => {
    if (!analysisInitialized) loadAnalysis();
  }, [analysisInitialized, loadAnalysis]);

  // Current date
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // State
  const [filterMode, setFilterMode] = useState<FilterMode>('monthly');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonths, setSelectedMonths] = useState<MonthSelection[]>([
    { month: currentMonth, year: currentYear, key: getMonthKey(currentMonth, currentYear) }
  ]);
  const [chartViewMode, setChartViewMode] = useState<ChartViewMode>('expense');

  // Available years
  const availableYears = useMemo(() => {
    const years = getAvailableYears(transactions);
    if (years.length === 0) return [currentYear];
    if (!years.includes(currentYear)) {
      years.unshift(currentYear);
      years.sort((a, b) => b - a);
    }
    return years;
  }, [transactions, currentYear]);

  // Check if current month is selected
  const isCurrentMonthSelected = useMemo(() => {
    if (filterMode === 'yearly') {
      return selectedYear === currentYear;
    }
    return selectedMonths.length === 1 &&
      selectedMonths[0].month === currentMonth &&
      selectedMonths[0].year === currentYear;
  }, [filterMode, selectedYear, selectedMonths, currentMonth, currentYear]);

  // Handlers
  const handleReset = useCallback(() => {
    setSelectedYear(currentYear);
    setFilterMode('monthly');
    setSelectedMonths([
      { month: currentMonth, year: currentYear, key: getMonthKey(currentMonth, currentYear) }
    ]);
    setSelectedWalletId(null);
  }, [currentMonth, currentYear, setSelectedWalletId]);

  const handleModeChange = useCallback((mode: FilterMode) => {
    setFilterMode(mode);
    if (mode === 'yearly') {
      const allMonths = Array.from({ length: 12 }, (_, i) => ({
        month: i,
        year: selectedYear,
        key: getMonthKey(i, selectedYear),
      }));
      setSelectedMonths(allMonths);
    } else {
      setSelectedMonths([
        { month: currentMonth, year: selectedYear, key: getMonthKey(currentMonth, selectedYear) }
      ]);
    }
  }, [selectedYear, currentMonth]);

  const handleYearSelect = useCallback((year: number) => {
    setSelectedYear(year);
    if (filterMode === 'yearly') {
      const allMonths = Array.from({ length: 12 }, (_, i) => ({
        month: i,
        year: year,
        key: getMonthKey(i, year),
      }));
      setSelectedMonths(allMonths);
    } else {
      const defaultMonth = year === currentYear ? currentMonth : 0;
      setSelectedMonths([
        { month: defaultMonth, year, key: getMonthKey(defaultMonth, year) }
      ]);
    }
  }, [filterMode, currentMonth, currentYear]);

  const handleToggleMonth = useCallback((month: number) => {
    if (filterMode === 'yearly') return;

    setSelectedMonths((prev) => {
      const exists = prev.find((s) => s.month === month);
      if (exists) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s.month !== month);
      } else {
        const newSelection = [...prev, { month, year: selectedYear, key: getMonthKey(month, selectedYear) }];
        return newSelection.sort((a, b) => a.month - b.month);
      }
    });
  }, [filterMode, selectedYear]);

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (filterMode === 'yearly') {
      const currentIndex = availableYears.indexOf(selectedYear);
      if (direction === 'prev' && currentIndex < availableYears.length - 1) {
        handleYearSelect(availableYears[currentIndex + 1]);
      } else if (direction === 'next' && currentIndex > 0) {
        handleYearSelect(availableYears[currentIndex - 1]);
      }
      return;
    }

    setSelectedMonths((prev) => {
      if (prev.length !== 1) return prev;

      const current = prev[0];
      let newMonth = current.month;
      let newYear = current.year;

      if (direction === 'prev') {
        if (newMonth === 0) {
          newMonth = 11;
          newYear -= 1;
        } else {
          newMonth -= 1;
        }
      } else {
        if (newMonth === 11) {
          newMonth = 0;
          newYear += 1;
        } else {
          newMonth += 1;
        }
      }

      if (newYear !== selectedYear) {
        setSelectedYear(newYear);
      }

      return [{ month: newMonth, year: newYear, key: getMonthKey(newMonth, newYear) }];
    });
  }, [filterMode, selectedYear, availableYears, handleYearSelect]);

  // Computed data
  const filteredTransactions = useMemo(() => {
    let filtered = filterMode === 'yearly'
      ? filterByYear(transactions, selectedYear)
      : filterByMonths(transactions, selectedMonths);

    if (selectedWalletId !== null) {
      filtered = filtered.filter((t) => t.walletId === selectedWalletId);
    }

    return filtered;
  }, [transactions, filterMode, selectedYear, selectedMonths, selectedWalletId]);

  const expenseSummaries = useMemo(
    () => computeCategorySummaries(filteredTransactions, 'expense'),
    [filteredTransactions]
  );

  const incomeSummaries = useMemo(
    () => computeCategorySummaries(filteredTransactions, 'income'),
    [filteredTransactions]
  );

  const allSummaries = useMemo(
    () => computeCategorySummaries(filteredTransactions, 'all'),
    [filteredTransactions]
  );

  const totalExpense = useMemo(
    () => expenseSummaries.reduce((sum, s) => sum + s.amount, 0),
    [expenseSummaries]
  );

  const totalIncome = useMemo(
    () => incomeSummaries.reduce((sum, s) => sum + s.amount, 0),
    [incomeSummaries]
  );

  const totalAll = useMemo(
    () => allSummaries.reduce((sum, s) => sum + s.amount, 0),
    [allSummaries]
  );

  const currentSummaries = useMemo(() => {
    switch (chartViewMode) {
      case 'expense':
        return expenseSummaries;
      case 'income':
        return incomeSummaries;
      case 'all':
        return allSummaries;
    }
  }, [chartViewMode, expenseSummaries, incomeSummaries, allSummaries]);

  const currentTotal = useMemo(() => {
    switch (chartViewMode) {
      case 'expense':
        return totalExpense;
      case 'income':
        return totalIncome;
      case 'all':
        return totalAll;
    }
  }, [chartViewMode, totalExpense, totalIncome, totalAll]);

  const currentCenterLabel = useMemo(() => {
    switch (chartViewMode) {
      case 'expense':
        return 'รวมรายจ่าย';
      case 'income':
        return 'รวมรายรับ';
      case 'all':
        return 'รวมทั้งหมด';
    }
  }, [chartViewMode]);

  const chartKey = useMemo(() => {
    const walletKey = selectedWalletId || 'all';
    if (filterMode === 'yearly') return `year-${selectedYear}-wallet-${walletKey}-view-${chartViewMode}`;
    return selectedMonths.map((s) => s.key).join('-') + `-wallet-${walletKey}-view-${chartViewMode}`;
  }, [filterMode, selectedYear, selectedMonths, selectedWalletId, chartViewMode]);

  const selectedWalletName = useMemo(() => {
    if (selectedWalletId === null) return 'ทุกกระเป๋า';
    const wallet = wallets.find((w) => w.id === selectedWalletId);
    return wallet?.name || 'ทุกกระเป๋า';
  }, [selectedWalletId, wallets]);

  const periodLabel = useMemo(() => {
    let dateLabel = '';
    if (filterMode === 'yearly') {
      dateLabel = `ปี พ.ศ. ${selectedYear + 543}`;
    } else if (selectedMonths.length === 1) {
      dateLabel = `${getFullMonthName(selectedMonths[0].month)} ${selectedMonths[0].year + 543}`;
    } else if (selectedMonths.length === 12) {
      dateLabel = `ทั้งปี ${selectedYear + 543}`;
    } else {
      const monthNames = selectedMonths.map((s) => getShortMonthName(s.month)).join(', ');
      dateLabel = `${monthNames} ${selectedYear + 543}`;
    }
    return dateLabel;
  }, [filterMode, selectedMonths, selectedYear]);

  return (
    <>
      {/* Reset button - inline action bar */}
      {!isCurrentMonthSelected && (
        <div className="flex justify-end px-4 mt-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <RotateCcw className="size-3.5" />
            <span>วันนี้</span>
          </button>
        </div>
      )}

      <PageContainer className="pt-2 space-y-3">
        {/* Filter Section - Expandable */}
        <div className="bg-linear-to-br from-card to-muted/20 rounded-xl border border-border/50 overflow-hidden">
          {/* Filter Header */}
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <CalendarDays className="size-5 text-primary" />
              <span className="font-medium text-foreground">ตัวกรอง</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {periodLabel}
              </span>
              {selectedWalletId !== null && (
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <WalletIcon className="size-3" />
                  {selectedWalletName}
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                'size-5 text-muted-foreground transition-transform duration-200',
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

              <div className="p-4 pt-0 space-y-4">

                {/* Wallet Selector - only show if more than 1 wallet */}
                {wallets.length > 1 && (
                  <div className="pt-2 border-t border-border/30">
                    <WalletSelector
                      wallets={wallets}
                      selectedWalletId={selectedWalletId}
                      onSelect={setSelectedWalletId}
                    />
                  </div>
                )}

                {/* Mode Toggle */}
                <FilterModeToggle mode={filterMode} onModeChange={handleModeChange} />

                {/* Year Selector */}
                <YearSelector
                  years={availableYears}
                  selectedYear={selectedYear}
                  onSelect={handleYearSelect}
                  showFullYear={filterMode === 'yearly'}
                />

                {/* Month Selector (only for monthly mode) */}
                {filterMode === 'monthly' && (
                  <MonthMultiSelector
                    selectedYear={selectedYear}
                    selectedMonths={selectedMonths}
                    onToggleMonth={handleToggleMonth}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    onNavigate={handleNavigate}
                  />
                )}

                {/* Yearly mode summary */}
                {filterMode === 'yearly' && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <button
                      onClick={() => handleNavigate('prev')}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <ChevronLeft className="size-5 text-muted-foreground" />
                    </button>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">
                        พ.ศ. {selectedYear + 543}
                      </p>
                      <p className="text-xs text-muted-foreground">ข้อมูลทั้งปี (12 เดือน)</p>
                    </div>
                    <button
                      onClick={() => handleNavigate('next')}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <ChevronRight className="size-5 text-muted-foreground" />
                    </button>
                  </div>
                )}


              </div>
            </div>
          </div>
        </div>

        {/* Donut Chart Section */}
        <div className="bg-linear-to-br from-card via-card to-muted/20 rounded-xl px-4 pt-2 border border-border/50 shadow-lg shadow-black/5 space-y-4">
          {/* Chart View Mode Selector */}
          <ChartViewModeSelector
            mode={chartViewMode}
            onModeChange={setChartViewMode}
            expenseTotal={totalExpense}
            incomeTotal={totalIncome}
            allTotal={totalAll}
          />

          <DonutChart
            summaries={currentSummaries}
            totalAmount={currentTotal}
            centerLabel={currentCenterLabel}
            chartKey={chartKey}
            viewMode={chartViewMode}
          />
        </div>

        {/* Category List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">รายละเอียดหมวดหมู่</h3>
              {/* View Mode Badge */}
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                  'transition-all duration-300 animate-in fade-in-0 slide-in-from-left-2',
                  chartViewMode === 'expense' && 'bg-rose-500/10 text-rose-500',
                  chartViewMode === 'income' && 'bg-emerald-500/10 text-emerald-500',
                  chartViewMode === 'all' && 'bg-blue-500/10 text-blue-500'
                )}
              >
                {chartViewMode === 'expense' && (
                  <>
                    <TrendingDown className="size-3" />
                    <span>รายจ่าย</span>
                  </>
                )}
                {chartViewMode === 'income' && (
                  <>
                    <TrendingUp className="size-3" />
                    <span>รายรับ</span>
                  </>
                )}
                {chartViewMode === 'all' && (
                  <>
                    <Layers className="size-3" />
                    <span>ทั้งหมด</span>
                  </>
                )}
              </div>
            </div>


            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsReusedSheetOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Repeat className="size-3" />
                <span>รายการใช้ซ้ำ</span>
                {analysisRecords.filter((a) => a.count > 1).length > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {analysisRecords.filter((a) => a.count > 1).length}
                  </span>
                )}
              </button>
            </div>
          </div>
          <DailyAverageSummary
            filterMode={filterMode}
            selectedMonths={selectedMonths}
            selectedYear={selectedYear}
            chartViewMode={chartViewMode}
            totalExpense={totalExpense}
            totalIncome={totalIncome}
            totalAll={totalAll}
          />
          <CategoryList
            summaries={currentSummaries}
            transactions={filteredTransactions}
            viewMode={chartViewMode}
            filterMode={filterMode}
            selectedMonths={selectedMonths}
            selectedYear={selectedYear}
          />
        </div>

        {/* Reused Transactions Sheet */}
        <ReusedTransactionSheet
          isOpen={isReusedSheetOpen}
          onClose={() => setIsReusedSheetOpen(false)}
          analysisRecords={analysisRecords}
          categories={getAllCategories()}
          wallets={wallets}
          selectedWalletId={selectedWalletId}
          periodLabel={periodLabel}
          selectedWalletName={selectedWalletName}
        />
      </PageContainer>
    </>
  );
}
