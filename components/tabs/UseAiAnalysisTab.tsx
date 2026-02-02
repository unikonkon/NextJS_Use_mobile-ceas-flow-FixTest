'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Header, PageContainer } from '@/components/layout';
import { WalletSelector } from '@/components/common/wallet-selector';
import { useTransactionStore, useWalletStore } from '@/lib/stores';
import { useAiHistoryStore } from '@/lib/stores/ai-history-store';
import type { Wallet } from '@/types';
import { ChevronLeft, ChevronRight, Download, Sparkles, Loader2, AlertCircle, TrendingUp, TrendingDown, Wallet as WalletIcon, Target, ShieldAlert, ChevronDown, ChevronUp, History, Trash2, ArrowLeft, CheckCircle2, PieChart, Lightbulb, Calendar, Star, BadgeAlert, BadgeCheck, BadgeMinus } from 'lucide-react';
import { cn } from '@/lib/utils';

function fmt(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

type PromptType = 'compact' | 'structured' | 'full';

interface StructuredResult {
  summary: {
    healthScore: string;
    totalIncome: number;
    totalExpense: number;
    savingRate: number;
    rule503020: {
      needs: { ideal: number; actual: number };
      wants: { ideal: number; actual: number };
      savings: { ideal: number; actual: number };
    };
  };
  recommendations: {
    monthlySaving: number;
    monthlyInvestment: number;
    emergencyFundTarget: number;
    investmentTypes: string[];
  };
  expensesToReduce: {
    category: string;
    amount: number;
    percent: number;
    targetReduction: number;
  }[];
  needExtraIncome: {
    required: boolean;
    suggestedAmount: number;
    reason: string;
  };
  actionPlan: string[];
  warnings: string[];
}

interface FullResult {
  summary: {
    healthScore: string;
    healthDescription: string;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    savingRate: number;
    incomeExpenseRatio: number;
    rule503020: {
      needs: { ideal: number; actual: number; amount: number; status: string };
      wants: { ideal: number; actual: number; amount: number; status: string };
      savings: { ideal: number; actual: number; amount: number; status: string };
    };
  };
  savingsAndInvestment: {
    currentSavingRate: number;
    recommendedSavingRate: number;
    monthlySaving: number;
    monthlyInvestment: number;
    emergencyFundTarget: number;
    emergencyFundMonths: number;
    investmentTypes: {
      name: string;
      allocation: number;
      reason: string;
    }[];
  };
  expensesToReduce: {
    rank: number;
    category: string;
    amount: number;
    percent: number;
    targetReduction: number;
    monthlySavings: number;
    suggestion: string;
  }[];
  goodExpenses: {
    category: string;
    amount: number;
    percent: number;
    reason: string;
  }[];
  needExtraIncome: {
    required: boolean;
    suggestedAmount: number;
    reason: string;
    suggestions: string[];
  };
  actionPlan3Months: {
    month1: { action: string; target: string }[];
    month2: { action: string; target: string }[];
    month3: { action: string; target: string }[];
  };
  warnings: {
    level: string;
    message: string;
    suggestion: string;
  }[];
  overallScore: number;
  topRecommendation: string;
}

interface AiResponse {
  type: 'structured' | 'full' | 'text';
  data: StructuredResult | FullResult | string;
  remaining?: number;
}

const PROMPT_OPTIONS: { value: PromptType; label: string; desc: string }[] = [
  { value: 'structured', label: 'วิเคราะห์เชิงลึก', desc: 'ผลลัพธ์แบบสั้น' },
  { value: 'full', label: 'วิเคราะห์เชิงลึก (แบบละเอียด)', desc: 'ผลลัพธ์แบบละเอียด รายละเอียดทุกหัวข้อ' },
];

/** จำนวนครั้งที่ยิง API ได้ต่อวัน (จาก env NEXT_PUBLIC_AI_DAILY_LIMIT) */
const AI_DAILY_LIMIT = Math.max(1, Number(process.env.NEXT_PUBLIC_AI_DAILY_LIMIT) || 2);

export function UseAiAnalysisTab() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [promptType, setPromptType] = useState<PromptType>('structured');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showHistory, setShowHistory] = useState(false);

  // Stores
  const transactions = useTransactionStore((s) => s.transactions);
  const walletBalances = useTransactionStore((s) => s.walletBalances);
  const wallets = useWalletStore((s) => s.wallets);
  const loadWallets = useWalletStore((s) => s.loadWallets);
  const walletInitialized = useWalletStore((s) => s.isInitialized);

  const addAiHistory = useAiHistoryStore((s) => s.addHistory);

  useEffect(() => {
    if (!walletInitialized) loadWallets();
  }, [walletInitialized, loadWallets]);

  // Available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach((t) => years.add(t.date.getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Filtered transactions by year + wallet
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const yearMatch = t.date.getFullYear() === selectedYear;
      const walletMatch = !selectedWalletId || t.walletId === selectedWalletId;
      return yearMatch && walletMatch;
    });
  }, [transactions, selectedYear, selectedWalletId]);

  // Compute stats
  const stats = useMemo(() => {
    const expenses = filtered.filter((t) => t.type === 'expense');
    const incomes = filtered.filter((t) => t.type === 'income');

    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
    const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);

    const expenseMonths = new Set(expenses.map((t) => t.date.getMonth()));
    const incomeMonths = new Set(incomes.map((t) => t.date.getMonth()));
    const monthCountExpense = Math.max(expenseMonths.size, 1);
    const monthCountIncome = Math.max(incomeMonths.size, 1);

    const expenseDays = new Set(expenses.map((t) => t.date.toDateString()));
    const incomeDays = new Set(incomes.map((t) => t.date.toDateString()));
    const dayCountExpense = Math.max(expenseDays.size, 1);
    const dayCountIncome = Math.max(incomeDays.size, 1);

    const expenseCount = Math.max(expenses.length, 1);
    const incomeCount = Math.max(incomes.length, 1);

    return {
      totalExpense,
      totalIncome,
      balance: totalIncome - totalExpense,
      avgExpensePerMonth: totalExpense / monthCountExpense,
      avgIncomePerMonth: totalIncome / monthCountIncome,
      avgExpensePerDay: totalExpense / dayCountExpense,
      avgIncomePerDay: totalIncome / dayCountIncome,
      avgExpensePerTx: totalExpense / expenseCount,
      avgIncomePerTx: totalIncome / incomeCount,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
      monthCountExpense,
      monthCountIncome,
      dayCountExpense: expenseDays.size,
      dayCountIncome: incomeDays.size,
    };
  }, [filtered]);

  const selectedWallet = selectedWalletId
    ? wallets.find((w) => w.id === selectedWalletId)
    : null;

  // Build financial data text for AI
  const buildFinancialData = useCallback(() => {
    const walletName = selectedWallet ? selectedWallet.name : 'ทุกกระเป๋า';
    const lines = [
      `สรุปปี ${selectedYear + 543} | ${walletName}`,
      `รายจ่ายรวม: ${fmt(stats.totalExpense)} บาท (${stats.expenseCount} รายการ)`,
      `รายรับรวม: ${fmt(stats.totalIncome)} บาท (${stats.incomeCount} รายการ)`,
      `คงเหลือ: ${fmt(stats.balance)} บาท`,
      `เฉลี่ยจ่าย/เดือน: ${fmt(stats.avgExpensePerMonth)} | รับ/เดือน: ${fmt(stats.avgIncomePerMonth)}`,
      `เฉลี่ยจ่าย/วัน: ${fmt(stats.avgExpensePerDay)} | รับ/วัน: ${fmt(stats.avgIncomePerDay)}`,
      `เฉลี่ยจ่าย/รายการ: ${fmt(stats.avgExpensePerTx)} | รับ/รายการ: ${fmt(stats.avgIncomePerTx)}`,
      ``,
      `รายการทั้งหมด:`,
      `วันที่|ประเภท|หมวด|จำนวน|โน้ต`,
    ];

    const sorted = [...filtered].sort((a, b) => a.date.getTime() - b.date.getTime());
    for (const t of sorted) {
      const d = t.date;
      const dd = `${d.getDate()}/${d.getMonth() + 1}`;
      const type = t.type === 'expense' ? 'จ่าย' : 'รับ';
      const cat = t.category?.name || t.categoryId;
      const note = t.note ? `|${t.note}` : '';
      lines.push(`${dd}|${type}|${cat}|${t.amount}${note}`);
    }

    return lines.join('\n');
  }, [filtered, stats, selectedWallet, selectedYear]);

  const handleExportText = () => {
    const walletName = selectedWallet ? selectedWallet.name : 'ทุกกระเป๋า';
    const lines = [
      `สรุป ${selectedYear + 543} | ${walletName}`,
      `จ่าย ${fmt(stats.totalExpense)} | รับ ${fmt(stats.totalIncome)} | เหลือ ${fmt(stats.balance)}`,
      `เฉลี่ย จ่าย/เดือน ${fmt(stats.avgExpensePerMonth)} รับ/เดือน ${fmt(stats.avgIncomePerMonth)}`,
      `เฉลี่ย จ่าย/วัน ${fmt(stats.avgExpensePerDay)} รับ/วัน ${fmt(stats.avgIncomePerDay)}`,
      `เฉลี่ย จ่าย/รายการ ${fmt(stats.avgExpensePerTx)} รับ/รายการ ${fmt(stats.avgIncomePerTx)}`,
      ``,
      `วันที่|ประเภท|หมวด|จำนวน|โน้ต`,
    ];

    const sorted = [...filtered].sort((a, b) => a.date.getTime() - b.date.getTime());
    for (const t of sorted) {
      const d = t.date;
      const dd = `${d.getDate()}/${d.getMonth() + 1}`;
      const type = t.type === 'expense' ? 'จ' : 'ร';
      const cat = t.category?.name || t.categoryId;
      const note = t.note ? `|${t.note}` : '';
      lines.push(`${dd}|${type}|${cat}|${t.amount}${note}`);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `สรุป-${selectedYear + 543}-${walletName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const financialData = buildFinancialData();
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialData, promptType }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.error || `HTTP ${res.status}`;
        throw new Error(message);
      }

      setResult(data as AiResponse);
      if (typeof data?.remaining === 'number') {
        setRemainingToday(data.remaining);
      }

      // Save to AI history store
      await addAiHistory({
        walletId: selectedWalletId,
        promptType,
        year: selectedYear,
        responseType: (data as AiResponse).type,
        responseData: (data as AiResponse).data,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (showHistory) {
    return (
      <>
        <AiHistoryView onBack={() => setShowHistory(false)} wallets={wallets} />
      </>
    );
  }

  return (
    <>
      <Header
        title=""
        leftAction={
          <WalletSelector
            wallets={wallets}
            selectedWalletId={selectedWalletId}
            walletBalances={walletBalances}
            onSelect={setSelectedWalletId}
          />

        }
        rightAction={
          <>
            {/* Year Selector */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                disabled={!availableYears.includes(selectedYear - 1) && selectedYear <= Math.min(...availableYears)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="size-8" />
              </button>
              <span className="text-md font-semibold">{selectedYear + 543}</span>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                disabled={selectedYear >= new Date().getFullYear()}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
              >
                <ChevronRight className="size-8" />
              </button>
            </div>
          </>
        }
      />
      <PageContainer className="pt-2 pb-8">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            ไม่มีข้อมูลในปีนี้
          </div>
        ) : (
          <>
            {/* Total Summary */}
            <div className="mb-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[10px] text-muted-foreground">รายจ่ายรวม</p>
                <p className="text-base font-bold text-expense">{fmt(stats.totalExpense)}</p>
                <p className="text-[10px] text-muted-foreground">{fmt(stats.expenseCount)} รายการ</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[10px] text-muted-foreground">รายรับรวม</p>
                <p className="text-base font-bold text-income">{fmt(stats.totalIncome)}</p>
                <p className="text-[10px] text-muted-foreground">{fmt(stats.incomeCount)} รายการ</p>
              </div>
              {/* Balance */}
              <div className="mb-4 rounded-xl bg-muted/40 p-3 text-center">
                <p className="text-[10px] text-muted-foreground">คงเหลือ</p>
                <p className={cn('text-lg font-bold', stats.balance >= 0 ? 'text-income' : 'text-expense')}>
                  {stats.balance >= 0 ? '+' : ''}{fmt(stats.balance)}
                </p>
              </div>
            </div>

            {/* Prompt Type Selector */}
            <div className="mb-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-medium text-muted-foreground">เลือกรูปแบบการวิเคราะห์</p>
                  <span className="text-sm font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">{selectedWallet ? selectedWallet.name : 'ทุกกระเป๋า'} ปี {selectedYear + 543}</span>
                </div>
                {/* History Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors bg-card shadow-xs"
                  >
                    <History className="size-3.5" />
                    ประวัติการวิเคราะห์
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2 overflow-x-auto scrollbar-none">
                {PROMPT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setPromptType(opt.value); setResult(null); }}
                    className={cn(
                      'shrink-0 rounded-xl px-3 py-2 text-center transition-colors border',
                      promptType === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground'
                    )}
                  >
                    <p className="text-xs font-semibold">{opt.label}</p>
                    <p className="text-[10px] opacity-70">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Rate limit info: ใน 1 วัน ยิงใช้ API ได้ X ครั้งเท่านั้น */}
            <p className="mb-2 text-[10px] text-muted-foreground text-center">
              ใน 1 วัน ใช้วิเคราะห์ได้ {AI_DAILY_LIMIT} ครั้งเท่านั้น
              {remainingToday !== null && (
                <span className="ml-1.5 text-primary font-medium">
                  · ใช้ได้อีก {remainingToday} ครั้งวันนี้
                </span>
              )}
            </p>

            {/* Action Buttons */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium transition-colors',
                  'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
                )}
              >
                {loading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {loading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ด้วย AI'}
              </button>
              {/* <button
                onClick={handleExportText}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border border-border',
                  'bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground',
                  'hover:bg-muted transition-colors'
                )}
              >
                <Download className="size-3.5" />
                Export .txt
              </button> */}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-expense/10 p-3 text-xs text-expense">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* AI Result */}
            {result && (
              <div className="space-y-3 h-full mb-18">
                <p className="text-xs font-semibold text-muted-foreground">ผลวิเคราะห์ AI</p>

                {result.type === 'structured' ? (
                  <StructuredResultView
                    data={result.data as StructuredResult}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                  />
                ) : result.type === 'full' ? (
                  <FullResultView
                    data={result.data as FullResult}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                  />
                ) : (
                  <TextResultView text={result.data as string} />
                )}
              </div>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}

/* ─── Full Result UI (รายงานเต็มแบบ JSON) ─── */

function FullResultView({
  data,
  expandedSections,
  toggleSection,
}: {
  data: FullResult;
  expandedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
}) {
  const healthColor =
    data.summary.healthScore === 'ดี'
      ? 'text-income'
      : data.summary.healthScore === 'ปานกลาง'
        ? 'text-yellow-500'
        : 'text-expense';

  const healthBg =
    data.summary.healthScore === 'ดี'
      ? 'bg-income/10'
      : data.summary.healthScore === 'ปานกลาง'
        ? 'bg-yellow-500/10'
        : 'bg-expense/10';

  const scoreColor = data.overallScore >= 70 ? 'text-income' : data.overallScore >= 40 ? 'text-yellow-500' : 'text-expense';

  return (
    <div className="space-y-3">
      {/* Overall Score & Health */}
      <div className="rounded-xl bg-muted/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] text-muted-foreground">สุขภาพการเงิน</p>
            <p className={cn('text-lg font-bold', healthColor)}>
              {data.summary.healthScore}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">คะแนนรวม</p>
            <p className={cn('text-2xl font-black', scoreColor)}>
              {data.overallScore}<span className="text-xs font-normal text-muted-foreground">/100</span>
            </p>
          </div>
        </div>
        {/* Score bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-2">
          <div
            className={cn('h-full rounded-full transition-all', data.overallScore >= 70 ? 'bg-income' : data.overallScore >= 40 ? 'bg-yellow-500' : 'bg-expense')}
            style={{ width: `${Math.min(data.overallScore, 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{data.summary.healthDescription}</p>
      </div>

      {/* Top Recommendation */}
      {data.topRecommendation && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex gap-2 items-start">
          <Lightbulb className="size-4 shrink-0 text-primary mt-0.5" />
          <div>
            <p className="text-[10px] font-semibold text-primary mb-0.5">คำแนะนำสำคัญ</p>
            <p className="text-xs text-foreground leading-relaxed">{data.topRecommendation}</p>
          </div>
        </div>
      )}

      {/* Income / Expense / Balance Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-muted/40 p-3 text-center">
          <TrendingUp className="size-3.5 mx-auto mb-1 text-income" />
          <p className="text-[10px] text-muted-foreground">รายรับ</p>
          <p className="text-sm font-bold text-income">{fmt(data.summary.totalIncome)}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3 text-center">
          <TrendingDown className="size-3.5 mx-auto mb-1 text-expense" />
          <p className="text-[10px] text-muted-foreground">รายจ่าย</p>
          <p className="text-sm font-bold text-expense">{fmt(data.summary.totalExpense)}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3 text-center">
          <WalletIcon className="size-3.5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">คงเหลือ</p>
          <p className={cn('text-sm font-bold', data.summary.balance >= 0 ? 'text-income' : 'text-expense')}>
            {data.summary.balance >= 0 ? '+' : ''}{fmt(data.summary.balance)}
          </p>
        </div>
      </div>

      {/* Ratios */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-[10px] text-muted-foreground">อัตราการออม</p>
          <p className={cn('text-lg font-bold', data.summary.savingRate >= 20 ? 'text-income' : data.summary.savingRate >= 10 ? 'text-yellow-500' : 'text-expense')}>
            {data.summary.savingRate}%
          </p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-[10px] text-muted-foreground">อัตราส่วนรายรับ/รายจ่าย</p>
          <p className={cn('text-lg font-bold', data.summary.incomeExpenseRatio >= 1 ? 'text-income' : 'text-expense')}>
            {data.summary.incomeExpenseRatio.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 50/30/20 Rule */}
      <div className="rounded-xl bg-muted/40 p-3">
        <p className="mb-2 text-xs font-semibold flex items-center gap-1.5">
          <PieChart className="size-3.5" />
          กฎ 50/30/20
        </p>
        <div className="space-y-3">
          {([
            { label: 'ค่าใช้จ่ายจำเป็น', key: 'needs' as const, color: 'bg-blue-500', colorText: 'text-blue-500' },
            { label: 'ความต้องการ', key: 'wants' as const, color: 'bg-yellow-500', colorText: 'text-yellow-500' },
            { label: 'ออม/ลงทุน', key: 'savings' as const, color: 'bg-income', colorText: 'text-income' },
          ]).map((item) => {
            const rule = data.summary.rule503020[item.key];
            const diff = rule.actual - rule.ideal;
            const StatusIcon = rule.status === 'ดี' ? BadgeCheck : rule.status === 'เกิน' ? BadgeAlert : BadgeMinus;
            const statusColor = rule.status === 'ดี' ? 'text-income' : rule.status === 'เกิน' ? 'text-expense' : 'text-yellow-500';
            return (
              <div key={item.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    {item.label}
                    <StatusIcon className={cn('size-3', statusColor)} />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rule.actual}%</span>
                    <span className="text-[10px] text-muted-foreground">/ {rule.ideal}%</span>
                    {diff !== 0 && (
                      <span className={cn('text-[10px] font-medium', diff > 0 ? 'text-expense' : 'text-income')}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', item.color)}
                      style={{ width: `${Math.min(rule.actual, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-16 text-right">{fmt(rule.amount)} ฿</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Savings & Investment */}
      <CollapsibleSection
        title="การออมและการลงทุน"
        icon={<WalletIcon className="size-3.5" />}
        sectionKey="fullSavings"
        expanded={expandedSections['fullSavings'] ?? true}
        toggle={toggleSection}
      >
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg bg-background/60 p-2.5">
            <p className="text-[10px] text-muted-foreground">อัตราออมปัจจุบัน</p>
            <p className="text-sm font-bold">{data.savingsAndInvestment.currentSavingRate}%</p>
          </div>
          <div className="rounded-lg bg-background/60 p-2.5">
            <p className="text-[10px] text-muted-foreground">อัตราออมแนะนำ</p>
            <p className="text-sm font-bold text-income">{data.savingsAndInvestment.recommendedSavingRate}%</p>
          </div>
          <div className="rounded-lg bg-background/60 p-2.5">
            <p className="text-[10px] text-muted-foreground">ควรออม/เดือน</p>
            <p className="text-sm font-bold text-income">{fmt(data.savingsAndInvestment.monthlySaving)}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-2.5">
            <p className="text-[10px] text-muted-foreground">ควรลงทุน/เดือน</p>
            <p className="text-sm font-bold text-income">{fmt(data.savingsAndInvestment.monthlyInvestment)}</p>
          </div>
        </div>
        <div className="rounded-lg bg-background/60 p-2.5 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">เงินสำรองฉุกเฉินเป้าหมาย</p>
              <p className="text-sm font-bold">{fmt(data.savingsAndInvestment.emergencyFundTarget)} บาท</p>
            </div>
            <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
              {data.savingsAndInvestment.emergencyFundMonths} เดือน
            </span>
          </div>
        </div>
        {data.savingsAndInvestment.investmentTypes.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold text-muted-foreground">ประเภทการลงทุนแนะนำ</p>
            <div className="space-y-2">
              {data.savingsAndInvestment.investmentTypes.map((inv, i) => (
                <div key={i} className="rounded-lg bg-background/60 p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{inv.name}</span>
                    <span className="text-xs font-bold text-primary">{inv.allocation}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-1.5">
                    <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${inv.allocation}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{inv.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Expenses to Reduce */}
      {data.expensesToReduce.length > 0 && (
        <CollapsibleSection
          title="หมวดที่ควรลด"
          icon={<TrendingDown className="size-3.5" />}
          sectionKey="fullExpReduce"
          expanded={expandedSections['fullExpReduce'] ?? true}
          toggle={toggleSection}
        >
          <div className="space-y-2">
            {data.expensesToReduce.map((item, i) => (
              <div key={i} className="rounded-lg bg-background/60 p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-expense/10 text-[10px] font-bold text-expense">
                      {item.rank || i + 1}
                    </span>
                    <span className="text-xs font-medium">{item.category}</span>
                  </div>
                  <span className="text-xs font-bold text-expense">{fmt(item.amount)} ฿</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span>{item.percent}% ของรายจ่าย</span>
                  <span className="text-income font-medium">ลดได้ {fmt(item.targetReduction)} ฿ (ประหยัด {fmt(item.monthlySavings)}/เดือน)</span>
                </div>
                {item.suggestion && (
                  <p className="text-[10px] text-muted-foreground bg-muted/60 rounded-md px-2 py-1">{item.suggestion}</p>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Good Expenses */}
      {data.goodExpenses && data.goodExpenses.length > 0 && (
        <CollapsibleSection
          title="รายจ่ายที่เหมาะสม"
          icon={<CheckCircle2 className="size-3.5" />}
          sectionKey="fullGoodExp"
          expanded={expandedSections['fullGoodExp'] ?? true}
          toggle={toggleSection}
        >
          <div className="space-y-2">
            {data.goodExpenses.map((item, i) => (
              <div key={i} className="rounded-lg bg-background/60 p-2.5 flex items-start gap-2.5">
                <CheckCircle2 className="size-4 shrink-0 text-income mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium">{item.category}</span>
                    <span className="text-xs font-medium">{fmt(item.amount)} ฿ <span className="text-[10px] text-muted-foreground">({item.percent}%)</span></span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Need Extra Income */}
      <CollapsibleSection
        title="ความจำเป็นหารายได้เสริม"
        icon={<TrendingUp className="size-3.5" />}
        sectionKey="fullExtraIncome"
        expanded={expandedSections['fullExtraIncome'] ?? true}
        toggle={toggleSection}
      >
        <div className="flex items-center gap-2 text-xs mb-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold',
              data.needExtraIncome.required
                ? 'bg-expense/10 text-expense'
                : 'bg-income/10 text-income'
            )}
          >
            {data.needExtraIncome.required ? 'จำเป็น' : 'ไม่จำเป็น'}
          </span>
          {data.needExtraIncome.required && data.needExtraIncome.suggestedAmount > 0 && (
            <span className="text-muted-foreground">
              แนะนำเพิ่ม {fmt(data.needExtraIncome.suggestedAmount)} บาท/เดือน
            </span>
          )}
        </div>
        {data.needExtraIncome.reason && (
          <p className="text-[11px] text-muted-foreground mb-2">{data.needExtraIncome.reason}</p>
        )}
        {data.needExtraIncome.suggestions && data.needExtraIncome.suggestions.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground mb-1">แนวทางหารายได้เสริม</p>
            <div className="space-y-1">
              {data.needExtraIncome.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <Star className="size-3 shrink-0 text-yellow-500 mt-0.5" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* 3-Month Action Plan */}
      <CollapsibleSection
        title="แผนปฏิบัติ 3 เดือน"
        icon={<Calendar className="size-3.5" />}
        sectionKey="fullActionPlan"
        expanded={expandedSections['fullActionPlan'] ?? true}
        toggle={toggleSection}
      >
        {(['month1', 'month2', 'month3'] as const).map((monthKey, mi) => {
          const actions = data.actionPlan3Months?.[monthKey];
          if (!actions || actions.length === 0) return null;
          return (
            <div key={monthKey} className={cn('pb-3', mi < 2 && 'border-b border-border mb-3')}>
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {mi + 1}
                </span>
                เดือนที่ {mi + 1}
              </p>
              <div className="space-y-1.5">
                {actions.map((step, i) => (
                  <div key={i} className="rounded-lg bg-background/60 p-2 flex items-start gap-2">
                    <Target className="size-3 shrink-0 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[11px] font-medium">{step.action}</p>
                      {step.target && (
                        <p className="text-[10px] text-muted-foreground">เป้าหมาย: {step.target}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CollapsibleSection>

      {/* Warnings */}
      {data.warnings && data.warnings.length > 0 && (
        <CollapsibleSection
          title="ข้อควรระวัง"
          icon={<ShieldAlert className="size-3.5" />}
          sectionKey="fullWarnings"
          expanded={expandedSections['fullWarnings'] ?? true}
          toggle={toggleSection}
        >
          <div className="space-y-2">
            {data.warnings.map((w, i) => {
              const levelColor = w.level === 'high' ? 'bg-expense/10 text-expense' : w.level === 'medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500';
              const levelLabel = w.level === 'high' ? 'สูง' : w.level === 'medium' ? 'ปานกลาง' : 'ต่ำ';
              return (
                <div key={i} className="rounded-lg bg-background/60 p-2.5">
                  <div className="flex items-start gap-2 mb-1">
                    <AlertCircle className="size-3.5 shrink-0 text-expense mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold', levelColor)}>
                          {levelLabel}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-foreground">{w.message}</p>
                      {w.suggestion && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{w.suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

/* ─── Structured Result UI ─── */

function StructuredResultView({
  data,
  expandedSections,
  toggleSection,
}: {
  data: StructuredResult;
  expandedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
}) {
  const healthColor =
    data.summary.healthScore === 'ดี'
      ? 'text-income'
      : data.summary.healthScore === 'ปานกลาง'
        ? 'text-yellow-500'
        : 'text-expense';
  return (
    <div className="space-y-3">
      {/* Health Score */}
      <div className="rounded-xl bg-muted/40 p-4 text-center">
        <p className="text-[10px] text-muted-foreground">สุขภาพการเงิน</p>
        <p className={cn('text-lg font-bold', healthColor)}>
          {data.summary.healthScore}
        </p>
        <p className="text-[10px] text-muted-foreground">
          อัตราการออม {data.summary.savingRate}%
        </p>
      </div>

      {/* 50/30/20 Rule */}
      <div className="rounded-xl bg-muted/40 p-3">
        <p className="mb-2 text-xs font-semibold">กฎ 50/30/20</p>
        <div className="space-y-2">
          {[
            { label: 'ค่าใช้จ่ายจำเป็น', key: 'needs' as const },
            { label: 'ความต้องการ', key: 'wants' as const },
            { label: 'ออม/ลงทุน', key: 'savings' as const },
          ].map((item) => {
            const rule = data.summary.rule503020[item.key];
            const diff = rule.actual - rule.ideal;
            return (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{rule.actual}%</span>
                  <span className="text-[10px] text-muted-foreground">/ {rule.ideal}%</span>
                  {diff !== 0 && (
                    <span className={cn('text-[10px] font-medium', diff > 0 ? 'text-expense' : 'text-income')}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Progress bars */}
        <div className="mt-3 space-y-1.5">
          {[
            { key: 'needs' as const, color: 'bg-blue-500' },
            { key: 'wants' as const, color: 'bg-yellow-500' },
            { key: 'savings' as const, color: 'bg-income' },
          ].map((item) => {
            const rule = data.summary.rule503020[item.key];
            return (
              <div key={item.key} className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full transition-all', item.color)}
                    style={{ width: `${Math.min(rule.actual, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <CollapsibleSection
        title="คำแนะนำการออม/ลงทุน"
        icon={<WalletIcon className="size-3.5" />}
        sectionKey="recommendations"
        expanded={expandedSections['recommendations'] ?? true}
        toggle={toggleSection}
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground">ควรออม/เดือน</p>
            <p className="text-sm font-bold text-income">{fmt(data.recommendations.monthlySaving)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">ควรลงทุน/เดือน</p>
            <p className="text-sm font-bold text-income">{fmt(data.recommendations.monthlyInvestment)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] text-muted-foreground">เงินสำรองฉุกเฉินเป้าหมาย</p>
            <p className="text-sm font-bold">{fmt(data.recommendations.emergencyFundTarget)} บาท</p>
          </div>
        </div>
        {data.recommendations.investmentTypes.length > 0 && (
          <div className="mt-2">
            <p className="mb-1 text-[10px] text-muted-foreground">ประเภทการลงทุนแนะนำ</p>
            <div className="flex flex-wrap gap-1">
              {data.recommendations.investmentTypes.map((type, i) => (
                <span key={i} className="rounded-full bg-income/10 px-2 py-0.5 text-[10px] font-medium text-income">
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Expenses to Reduce */}
      {data.expensesToReduce.length > 0 && (
        <CollapsibleSection
          title="หมวดที่ควรลด"
          icon={<TrendingDown className="size-3.5" />}
          sectionKey="expensesToReduce"
          expanded={expandedSections['expensesToReduce'] ?? true}
          toggle={toggleSection}
        >
          <div className="space-y-2">
            {data.expensesToReduce.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium">{item.category}</p>
                  <p className="text-[10px] text-muted-foreground">{item.percent}% ของรายจ่าย</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-expense">{fmt(item.amount)}</p>
                  <p className="text-[10px] text-income">ลดได้ {fmt(item.targetReduction)}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Need Extra Income */}
      <CollapsibleSection
        title="ความจำเป็นหารายได้เสริม"
        icon={<TrendingUp className="size-3.5" />}
        sectionKey="extraIncome"
        expanded={expandedSections['extraIncome'] ?? true}
        toggle={toggleSection}
      >
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold',
              data.needExtraIncome.required
                ? 'bg-expense/10 text-expense'
                : 'bg-income/10 text-income'
            )}
          >
            {data.needExtraIncome.required ? 'จำเป็น' : 'ไม่จำเป็น'}
          </span>
          {data.needExtraIncome.required && data.needExtraIncome.suggestedAmount > 0 && (
            <span className="text-muted-foreground">
              แนะนำเพิ่ม {fmt(data.needExtraIncome.suggestedAmount)} บาท/เดือน
            </span>
          )}
        </div>
        {data.needExtraIncome.reason && (
          <p className="mt-1 text-[11px] text-muted-foreground">{data.needExtraIncome.reason}</p>
        )}
      </CollapsibleSection>

      {/* Action Plan */}
      {data.actionPlan.length > 0 && (
        <CollapsibleSection
          title="แผนปฏิบัติ"
          icon={<Target className="size-3.5" />}
          sectionKey="actionPlan"
          expanded={expandedSections['actionPlan'] ?? true}
          toggle={toggleSection}
        >
          <div className="space-y-1.5">
            {data.actionPlan.map((step, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {i + 1}
                </span>
                <p className="text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <CollapsibleSection
          title="ข้อควรระวัง"
          icon={<ShieldAlert className="size-3.5" />}
          sectionKey="warnings"
          expanded={expandedSections['warnings'] ?? true}
          toggle={toggleSection}
        >
          <div className="space-y-1.5">
            {data.warnings.map((w, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <AlertCircle className="mt-0.5 size-3 shrink-0 text-expense" />
                <p className="text-muted-foreground">{w}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

/* ─── Collapsible Section ─── */

function CollapsibleSection({
  title,
  icon,
  sectionKey,
  expanded,
  toggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  sectionKey: string;
  expanded: boolean;
  toggle: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <button
        onClick={() => toggle(sectionKey)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {icon}
          {title}
        </div>
        {expanded ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
      </button>
      {expanded && <div className="mt-2">{children}</div>}
    </div>
  );
}

/* ─── Text Result UI ─── */

function TextResultView({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-4">
      <div className="prose prose-sm max-w-none text-xs leading-relaxed text-foreground whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}

/* ─── AI History View ─── */

const PROMPT_LABELS: Record<string, string> = {
  compact: 'สรุปย่อ',
  structured: 'วิเคราะห์เชิงลึก',
  full: 'วิเคราะห์เชิงลึก (แบบละเอียด)',
};

function AiHistoryView({ onBack, wallets }: { onBack: () => void; wallets: Wallet[] }) {
  const records = useAiHistoryStore((s) => s.records);
  const loadHistory = useAiHistoryStore((s) => s.loadHistory);
  const deleteHistory = useAiHistoryStore((s) => s.deleteHistory);
  const clearHistory = useAiHistoryStore((s) => s.clearHistory);
  const isInitialized = useAiHistoryStore((s) => s.isInitialized);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isInitialized) loadHistory();
  }, [isInitialized, loadHistory]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getWalletName = (walletId: string | null) => {
    if (!walletId) return 'ทุกกระเป๋า';
    const w = wallets.find((w) => w.id === walletId);
    return w ? `${w.icon} ${w.name}` : 'ไม่ทราบ';
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <Header
        title="ประวัติการวิเคราะห์ AI"
        leftAction={
          <>
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              กลับ
            </button>
          </>
        }
        rightAction={
          <>
            {records.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-expense hover:bg-expense/10 transition-colors bg-card shadow-xs"
              >
                <Trash2 className="size-3" />
                ลบทั้งหมด
              </button>
            )}
          </>
        }
      />
      <PageContainer className="pt-4 pb-18">
        {records.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            ยังไม่มีประวัติการวิเคราะห์
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => {
              const isExpanded = expandedId === record.id;
              let parsedData: FullResult | StructuredResult | string | null = null;
              try {
                parsedData = JSON.parse(record.responseData);
              } catch {
                parsedData = record.responseData;
              }

              return (
                <div key={record.id} className="rounded-xl bg-muted/40 overflow-hidden">
                  {/* Card Header: use div + role="button" to avoid nesting a button (delete) inside a button */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : record.id);
                      }
                    }}
                    className="flex w-full cursor-pointer items-center justify-between p-3"
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {PROMPT_LABELS[record.promptType] || record.promptType}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ปี {record.year + 543}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{getWalletName(record.walletId)}</span>
                        <span>·</span>
                        <span>{formatDate(record.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => deleteHistory(record.id)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-expense hover:bg-expense/10 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && parsedData && (
                    <div className="border-t border-border p-3">
                      {record.responseType === 'full' && typeof parsedData === 'object' ? (
                        <FullResultView
                          data={parsedData as FullResult}
                          expandedSections={expandedSections}
                          toggleSection={toggleSection}
                        />
                      ) : record.responseType === 'structured' && typeof parsedData === 'object' ? (
                        <StructuredResultView
                          data={parsedData as StructuredResult}
                          expandedSections={expandedSections}
                          toggleSection={toggleSection}
                        />
                      ) : (
                        <TextResultView text={typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData, null, 2)} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
