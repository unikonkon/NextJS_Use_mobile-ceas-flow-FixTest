'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  exportToTxt,
  type TxtExportProgress,
  type TxtExportData,
} from '@/lib/utils/txt-export';
import {
  importFromTxt,
  type TxtImportProgress,
  type TxtImportDependencies,
} from '@/lib/utils/txt-import';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderDown,
  Wallet,
  Tags,
  Info,
  Table,
  Calendar,
  FileUp,
  FileCheck,
  ChevronRight,
  Plus,
} from 'lucide-react';

type ActiveMode = 'export' | 'import';

function ProgressBar({
  progress,
  status,
  colorComplete = 'bg-income',
  colorError = 'bg-expense',
  colorActive = 'bg-primary',
  glowComplete = '--income',
}: {
  progress: number;
  status: string;
  colorComplete?: string;
  colorError?: string;
  colorActive?: string;
  glowComplete?: string;
}) {
  const getBarColor = () => {
    switch (status) {
      case 'complete':
        return colorComplete;
      case 'error':
        return colorError;
      default:
        return colorActive;
    }
  };

  const isActive = status !== 'complete' && status !== 'error' && status !== 'idle';

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
      {isActive && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, var(--primary) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      )}
      <div
        className={cn(
          'h-full transition-all duration-500 ease-out',
          getBarColor()
        )}
        style={{
          width: `${progress}%`,
          boxShadow:
            status === 'complete' ? `0 0 12px var(${glowComplete})` : undefined,
        }}
      />
    </div>
  );
}

function DetailRow({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-accent/40 text-accent-foreground">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-medium leading-tight text-foreground">{label}</span>
        <span className="text-[11px] leading-snug text-muted-foreground">{description}</span>
      </div>
    </div>
  );
}

export function ExportTxtCard() {
  const [mode, setMode] = useState<ActiveMode>('export');
  const [exportProgress, setExportProgress] = useState<TxtExportProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [importProgress, setImportProgress] = useState<TxtImportProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [importSnapshot, setImportSnapshot] = useState<{
    transactions: number;
    wallets: number;
    categories: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const transactions = useTransactionStore((s) => s.transactions);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const wallets = useWalletStore((s) => s.wallets);
  const addWallet = useWalletStore((s) => s.addWallet);
  const { expenseCategories, incomeCategories, addCategory, getAllCategories } = useCategoryStore();

  const allCategories = [...expenseCategories, ...incomeCategories];
  const isExporting =
    exportProgress.status !== 'idle' &&
    exportProgress.status !== 'complete' &&
    exportProgress.status !== 'error';
  const isImporting =
    importProgress.status !== 'idle' &&
    importProgress.status !== 'complete' &&
    importProgress.status !== 'error';
  const isBusy = isExporting || isImporting;

  const handleExport = useCallback(async () => {
    if (isExporting) return;

    const data: TxtExportData = {
      transactions,
      wallets,
      categories: allCategories,
    };

    try {
      await exportToTxt(data, setExportProgress);

      setTimeout(() => {
        setExportProgress({ status: 'idle', progress: 0, message: '' });
      }, 3000);
    } catch {
      setTimeout(() => {
        setExportProgress({ status: 'idle', progress: 0, message: '' });
      }, 3000);
    }
  }, [isExporting, transactions, wallets, allCategories]);

  const handleImportClick = useCallback(() => {
    if (isImporting) return;
    fileInputRef.current?.click();
  }, [isImporting]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    // Snapshot current counts before import
    const currentWallets = useWalletStore.getState().wallets;
    const currentCategories = getAllCategories();
    const currentTransactions = useTransactionStore.getState().transactions;
    setImportSnapshot({
      transactions: currentTransactions.length,
      wallets: currentWallets.length,
      categories: currentCategories.length,
    });

    const deps: TxtImportDependencies = {
      existingWallets: useWalletStore.getState().wallets.map((w) => ({ id: w.id, name: w.name })),
      findCategoryByName: (name: string, type: 'income' | 'expense') => {
        const cats = getAllCategories();
        return cats.find((c) => c.name === name && c.type === type);
      },
      addCategory,
      addWallet,
      getWallets: () => useWalletStore.getState().wallets.map((w) => ({ id: w.id, name: w.name })),
      addTransaction,
    };

    try {
      await importFromTxt(file, deps, setImportProgress);

      setTimeout(() => {
        setImportProgress({ status: 'idle', progress: 0, message: '' });
        setImportSnapshot(null);
      }, 4000);
    } catch {
      setTimeout(() => {
        setImportProgress({ status: 'idle', progress: 0, message: '' });
        setImportSnapshot(null);
      }, 4000);
    }
  }, [getAllCategories, addCategory, addWallet, addTransaction]);

  const canExport = transactions.length > 0;

  // Active progress state
  const activeProgress = mode === 'export' ? exportProgress : importProgress;
  const showProgress = activeProgress.status !== 'idle';

  return (
    <Card className="group relative overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-soft">
      {/* Decorative gradient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          background:
            'radial-gradient(ellipse at top left, oklch(0.60 0.15 200) 0%, transparent 50%), radial-gradient(ellipse at bottom right, oklch(0.50 0.12 280) 0%, transparent 50%)',
        }}
      />

      <CardContent className="relative p-5">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 via-accent/10 to-primary/5">
            <FileText className="size-5.5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">จัดการข้อมูล TXT</h3>
            <p className="text-xs text-muted-foreground">
              ส่งออกและนำเข้าข้อมูลไฟล์ .txt
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mb-4 flex gap-2 rounded-xl bg-muted/30 p-1.5">
          <button
            onClick={() => !isBusy && setMode('export')}
            disabled={isBusy}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200',
              'disabled:cursor-not-allowed',
              mode === 'export'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground/70'
            )}
          >
            <FolderDown className="size-4" />
            <span>ส่งออก</span>
          </button>
          <button
            onClick={() => !isBusy && setMode('import')}
            disabled={isBusy}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200',
              'disabled:cursor-not-allowed',
              mode === 'import'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground/70'
            )}
          >
            <FileUp className="size-4" />
            <span>นำเข้า</span>
          </button>
        </div>

        {/* Export Mode Content */}
        {mode === 'export' && (
          <div className="animate-in fade-in-0 slide-in-from-left-2 duration-200">
            {/* Stats Preview */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center rounded-xl bg-muted/30 p-2.5">
                <FileText className="mb-1 size-3.5 text-primary" />
                <span className="text-base font-bold tabular-nums text-foreground">
                  {transactions.length.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground">รายการ</span>
              </div>
              <div className="flex flex-col items-center rounded-xl bg-muted/30 p-2.5">
                <Wallet className="mb-1 size-3.5 text-income" />
                <span className="text-base font-bold tabular-nums text-foreground">
                  {wallets.length}
                </span>
                <span className="text-[10px] text-muted-foreground">กระเป๋า</span>
              </div>
              <div className="flex flex-col items-center rounded-xl bg-muted/30 p-2.5">
                <Tags className="mb-1 size-3.5 text-expense" />
                <span className="text-base font-bold tabular-nums text-foreground">
                  {allCategories.length}
                </span>
                <span className="text-[10px] text-muted-foreground">หมวดหมู่</span>
              </div>
            </div>

            {/* Export Description */}
            <div className="mb-4 space-y-3 rounded-xl bg-muted/20 p-3.5">
              <div className="flex items-center gap-1.5">
                <Info className="size-3.5 text-muted-foreground" />
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  ไฟล์ TXT จะประกอบด้วย
                </p>
              </div>
              <DetailRow
                icon={<Table className="size-3.5" />}
                label="ภาพรวมทั้งหมด"
                description="สรุปรายรับ-รายจ่ายรวม, ยอดคงเหลือ, จำนวนข้อมูล"
              />
              <DetailRow
                icon={<Wallet className="size-3.5" />}
                label="ข้อมูลกระเป๋าเงิน"
                description="รายชื่อกระเป๋า ประเภท ยอดเริ่มต้น และยอดปัจจุบัน"
              />
              <DetailRow
                icon={<Tags className="size-3.5" />}
                label="หมวดหมู่ทั้งหมด"
                description="รายรับและรายจ่าย แยกตามประเภท"
              />
              <DetailRow
                icon={<Calendar className="size-3.5" />}
                label="รายการธุรกรรมแยกตามกระเป๋า"
                description="วันที่ ประเภท หมวดหมู่ จำนวนเงิน หมายเหตุ"
              />
            </div>

            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <p className="text-[11px] leading-relaxed text-foreground/70">
                ไฟล์จะถูกดาวน์โหลดเป็น <span className="font-semibold text-primary">PayFlow_Export_วันที่.txt</span> สามารถเปิดด้วย Notepad, TextEdit หรือแอปอ่านข้อความทั่วไป
              </p>
            </div>
          </div>
        )}

        {/* Import Mode Content */}
        {mode === 'import' && (
          <div className="animate-in fade-in-0 slide-in-from-right-2 duration-200">
            {/* Import Description */}
            <div className="mb-4 space-y-3 rounded-xl bg-muted/20 p-3.5">
              <div className="flex items-center gap-1.5">
                <Info className="size-3.5 text-muted-foreground" />
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  รูปแบบไฟล์ที่รองรับ
                </p>
              </div>
              <DetailRow
                icon={<FileCheck className="size-3.5" />}
                label="ไฟล์ .txt"
                description="ไฟล์ TXT ที่ส่งออกจาก Pay Flow โดยตรง"
              />
              <DetailRow
                icon={<Wallet className="size-3.5" />}
                label="กระเป๋าเงิน"
                description="นำเข้าข้อมูลกระเป๋า ประเภท ยอดเริ่มต้น และยอดปัจจุบัน"
              />
              <DetailRow
                icon={<Tags className="size-3.5" />}
                label="หมวดหมู่"
                description="หมวดหมู่ที่ยังไม่มีจะถูกสร้างใหม่ให้โดยอัตโนมัติ"
              />
              <DetailRow
                icon={<Calendar className="size-3.5" />}
                label="รายการธุรกรรมแยกตามกระเป๋า"
                description="นำเข้ารายการทั้งหมดพร้อมวันที่ ประเภท จำนวนเงิน หมายเหตุ"
              />
            </div>

            <div className="mb-4 space-y-2.5 rounded-xl bg-muted/20 p-3.5">
              <div className="flex items-center gap-1.5">
                <ChevronRight className="size-3.5 text-muted-foreground" />
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  ไฟล์ได้จากไหน?
                </p>
              </div>
              <div className="space-y-2 pl-0.5">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">1</span>
                  <p className="text-[12px] leading-relaxed text-foreground/80">
                    <span className="font-medium">ส่งออกจาก Pay Flow</span> — ใช้ปุ่มส่งออกในแท็บนี้ แล้วนำไฟล์กลับมานำเข้า
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">2</span>
                  <p className="text-[12px] leading-relaxed text-foreground/80">
                    <span className="font-medium">สร้างเองด้วย Text Editor</span> — สร้างไฟล์ .txt ตามรูปแบบที่กำหนด (มีส่วนกระเป๋าเงิน + ธุรกรรม)
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <p className="text-[11px] leading-relaxed text-foreground/70">
                หากชื่อกระเป๋าซ้ำกับที่มีอยู่ ระบบจะสร้างใหม่ต่อท้ายด้วย <span className="font-semibold text-primary">(ซ้ำ)</span> โดยอัตโนมัติ หมวดหมู่ที่ยังไม่มีจะถูกสร้างใหม่ให้
              </p>
            </div>

            {/* Import Live Summary — visible during/after import */}
            {importSnapshot && importProgress.status !== 'idle' && (
              <div className="mb-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <div className="rounded-xl border border-border bg-card p-3.5">
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {importProgress.status === 'complete' ? 'สรุปการนำเข้า' : 'กำลังนำเข้า...'}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Transactions */}
                    <div className="flex flex-col items-center rounded-lg bg-muted/25 p-2.5">
                      <FileText className="mb-1 size-3.5 text-primary" />
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {transactions.length.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">รายการ</span>
                      {transactions.length - importSnapshot.transactions > 0 && (
                        <span className="mt-1 flex items-center gap-0.5 rounded-full bg-income/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-income">
                          <Plus className="size-2.5" />
                          {(transactions.length - importSnapshot.transactions).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {/* Wallets */}
                    <div className="flex flex-col items-center rounded-lg bg-muted/25 p-2.5">
                      <Wallet className="mb-1 size-3.5 text-income" />
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {wallets.length}
                      </span>
                      <span className="text-[10px] text-muted-foreground">กระเป๋า</span>
                      {wallets.length - importSnapshot.wallets > 0 && (
                        <span className="mt-1 flex items-center gap-0.5 rounded-full bg-income/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-income">
                          <Plus className="size-2.5" />
                          {wallets.length - importSnapshot.wallets}
                        </span>
                      )}
                    </div>
                    {/* Categories */}
                    <div className="flex flex-col items-center rounded-lg bg-muted/25 p-2.5">
                      <Tags className="mb-1 size-3.5 text-expense" />
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {allCategories.length}
                      </span>
                      <span className="text-[10px] text-muted-foreground">หมวดหมู่</span>
                      {allCategories.length - importSnapshot.categories > 0 && (
                        <span className="mt-1 flex items-center gap-0.5 rounded-full bg-income/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-income">
                          <Plus className="size-2.5" />
                          {allCategories.length - importSnapshot.categories}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Section */}
        {showProgress && (
          <div className="mb-4 animate-slide-up">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeProgress.status === 'complete' ? (
                  <CheckCircle2 className="size-4 text-income" />
                ) : activeProgress.status === 'error' ? (
                  <AlertCircle className="size-4 text-expense" />
                ) : (
                  <Loader2 className="size-4 animate-spin text-primary" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    activeProgress.status === 'complete' && 'text-income',
                    activeProgress.status === 'error' && 'text-expense'
                  )}
                >
                  {activeProgress.message}
                </span>
              </div>
              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                {activeProgress.progress}%
              </span>
            </div>
            <ProgressBar
              progress={activeProgress.progress}
              status={activeProgress.status}
              colorComplete={mode === 'import' ? 'bg-primary' : 'bg-income'}
              glowComplete={mode === 'import' ? '--primary' : '--income'}
            />
          </div>
        )}

        {/* Action Button */}
        {mode === 'export' ? (
          <button
            onClick={handleExport}
            disabled={!canExport || isBusy}
            className={cn(
              'relative w-full overflow-hidden rounded-xl py-3.5 font-medium',
              'transition-all duration-300',
              'disabled:cursor-not-allowed disabled:opacity-50',
              canExport && !isBusy
                ? 'bg-linear-to-r from-primary to-[oklch(0.50_0.15_280)] text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {canExport && !isBusy && (
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              />
            )}
            <span className="relative flex items-center justify-center gap-2">
              {isExporting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>กำลังส่งออก...</span>
                </>
              ) : exportProgress.status === 'complete' ? (
                <>
                  <CheckCircle2 className="size-5" />
                  <span>ส่งออกสำเร็จ!</span>
                </>
              ) : (
                <>
                  <FolderDown className="size-5" />
                  <span>ส่งออกไฟล์ TXT</span>
                </>
              )}
            </span>
          </button>
        ) : (
          <button
            onClick={handleImportClick}
            disabled={isBusy}
            className={cn(
              'relative w-full overflow-hidden rounded-xl py-3.5 font-medium',
              'transition-all duration-300',
              'disabled:cursor-not-allowed disabled:opacity-50',
              !isBusy
                ? 'bg-linear-to-r from-primary to-[oklch(0.55_0.18_260)] text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {!isBusy && (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              />
            )}
            <span className="relative flex items-center justify-center gap-2">
              {isImporting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>กำลังนำเข้า...</span>
                </>
              ) : importProgress.status === 'complete' ? (
                <>
                  <CheckCircle2 className="size-5" />
                  <span>นำเข้าสำเร็จ!</span>
                </>
              ) : (
                <>
                  <FileUp className="size-5" />
                  <span>เลือกไฟล์ TXT และนำเข้า</span>
                </>
              )}
            </span>
          </button>
        )}

        {/* Helper text */}
        {mode === 'export' && !canExport && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            ไม่มีข้อมูลรายการให้ส่งออก
          </p>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </CardContent>

      {/* Shimmer keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </Card>
  );
}
