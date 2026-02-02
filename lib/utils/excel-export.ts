'use client';

import * as XLSX from 'xlsx';
import type { TransactionWithCategory, Wallet, Category } from '@/types';

// ============================================
// Types
// ============================================
export interface ExportData {
  transactions: TransactionWithCategory[];
  wallets: Wallet[];
  categories: Category[];
}

export interface ExportProgress {
  status: 'idle' | 'preparing' | 'generating' | 'downloading' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
}

// ============================================
// Helper Functions
// ============================================

// Format date to Thai locale with time
function formatDate(date: Date): string {
  const datePart = date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart} ${timePart}`;
}

// Format date for sheet name (YYYY-MM)
function formatMonthYear(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Format currency
function formatCurrency(amount: number): string {
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Sanitize sheet name (max 31 chars, no special chars)
function sanitizeSheetName(name: string): string {
  return name
    .replace(/[\\/*?:[\]]/g, '')
    .substring(0, 31);
}

// ============================================
// Sheet Generators
// ============================================

// Create a sheet with transactions grouped by wallet
function createWalletSheets(
  transactions: TransactionWithCategory[],
  wallets: Wallet[]
): { name: string; data: unknown[][] }[] {
  const sheets: { name: string; data: unknown[][] }[] = [];

  wallets.forEach((wallet) => {
    const walletTransactions = transactions.filter((t) => t.walletId === wallet.id);

    if (walletTransactions.length === 0) return;

    // Sort by date descending
    const sorted = [...walletTransactions].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    // Calculate totals
    const totalIncome = sorted
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = sorted
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const data: unknown[][] = [
      // Header info
      [`กระเป๋าเงิน: ${wallet.icon || ''} ${wallet.name}`],
      [`ประเภท: ${wallet.type}`],
      [`ยอดเริ่มต้น: ฿${formatCurrency(wallet.initialBalance)}`],
      [],
      // Summary
      ['สรุปยอด'],
      ['รายรับรวม', `฿${formatCurrency(totalIncome)}`],
      ['รายจ่ายรวม', `฿${formatCurrency(totalExpense)}`],
      ['ยอดคงเหลือ', `฿${formatCurrency(totalIncome - totalExpense)}`],
      [],
      // Transaction header
      ['วันที่', 'ประเภท', 'ไอคอน', 'หมวดหมู่', 'จำนวนเงิน', 'หมายเหตุ'],
    ];

    // Add transactions
    sorted.forEach((t) => {
      data.push([
        formatDate(t.date),
        t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        t.category.icon || '',
        t.category.name,
        t.type === 'income' ? t.amount : -t.amount,
        t.note || '',
      ]);
    });

    sheets.push({
      name: sanitizeSheetName(`💰 ${wallet.name}`),
      data,
    });
  });

  return sheets;
}

// Create sheets grouped by month/year
function createMonthlySheets(
  transactions: TransactionWithCategory[]
): { name: string; data: unknown[][] }[] {
  const sheets: { name: string; data: unknown[][] }[] = [];

  // Group transactions by month
  const monthlyGroups = new Map<string, TransactionWithCategory[]>();

  transactions.forEach((t) => {
    const key = formatMonthYear(t.date);
    if (!monthlyGroups.has(key)) {
      monthlyGroups.set(key, []);
    }
    monthlyGroups.get(key)!.push(t);
  });

  // Sort months descending
  const sortedMonths = Array.from(monthlyGroups.keys()).sort().reverse();

  sortedMonths.forEach((monthKey) => {
    const monthTransactions = monthlyGroups.get(monthKey)!;

    // Sort by date descending
    const sorted = [...monthTransactions].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    // Calculate totals
    const totalIncome = sorted
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = sorted
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Format month name
    const [year, month] = monthKey.split('-');
    const monthDate = new Date(parseInt(year), parseInt(month) - 1);
    const monthName = monthDate.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
    });

    const data: unknown[][] = [
      // Header info
      [`เดือน: ${monthName}`],
      [`จำนวนรายการ: ${sorted.length} รายการ`],
      [],
      // Summary
      ['สรุปยอด'],
      ['รายรับรวม', `฿${formatCurrency(totalIncome)}`],
      ['รายจ่ายรวม', `฿${formatCurrency(totalExpense)}`],
      ['ยอดคงเหลือ', `฿${formatCurrency(totalIncome - totalExpense)}`],
      [],
      // Transaction header
      ['วันที่', 'ประเภท', 'ไอคอน', 'หมวดหมู่', 'กระเป๋าเงิน', 'จำนวนเงิน', 'หมายเหตุ'],
    ];

    // Add transactions
    sorted.forEach((t) => {
      data.push([
        formatDate(t.date),
        t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        t.category.icon || '',
        t.category.name,
        t.wallet?.name || '-',
        t.type === 'income' ? t.amount : -t.amount,
        t.note || '',
      ]);
    });

    sheets.push({
      name: sanitizeSheetName(`📅 ${monthKey}`),
      data,
    });
  });

  return sheets;
}

// Create sheets grouped by category
function createCategorySheets(
  transactions: TransactionWithCategory[],
  categories: Category[]
): { name: string; data: unknown[][] }[] {
  const sheets: { name: string; data: unknown[][] }[] = [];

  // Create summary sheet first
  const summaryData: unknown[][] = [
    ['สรุปตามหมวดหมู่'],
    [],
    ['=== รายจ่าย ==='],
    ['ไอคอน', 'หมวดหมู่', 'จำนวนรายการ', 'ยอดรวม'],
  ];

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  // Add expense categories summary
  expenseCategories.forEach((cat) => {
    const catTransactions = transactions.filter((t) => t.categoryId === cat.id);
    const total = catTransactions.reduce((sum, t) => sum + t.amount, 0);
    if (catTransactions.length > 0) {
      summaryData.push([cat.icon || '', cat.name, catTransactions.length, -total]);
    }
  });

  summaryData.push([]);
  summaryData.push(['=== รายรับ ===']);
  summaryData.push(['ไอคอน', 'หมวดหมู่', 'จำนวนรายการ', 'ยอดรวม']);

  // Add income categories summary
  incomeCategories.forEach((cat) => {
    const catTransactions = transactions.filter((t) => t.categoryId === cat.id);
    const total = catTransactions.reduce((sum, t) => sum + t.amount, 0);
    if (catTransactions.length > 0) {
      summaryData.push([cat.icon || '', cat.name, catTransactions.length, total]);
    }
  });

  sheets.push({
    name: sanitizeSheetName('📊 สรุปหมวดหมู่'),
    data: summaryData,
  });

  // Create individual category sheets
  [...expenseCategories, ...incomeCategories].forEach((cat) => {
    const catTransactions = transactions.filter((t) => t.categoryId === cat.id);

    if (catTransactions.length === 0) return;

    // Sort by date descending
    const sorted = [...catTransactions].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    const total = sorted.reduce((sum, t) => sum + t.amount, 0);
    const typeLabel = cat.type === 'income' ? 'รายรับ' : 'รายจ่าย';

    const data: unknown[][] = [
      // Header info
      [`หมวดหมู่: ${cat.icon || ''} ${cat.name}`],
      [`ประเภท: ${typeLabel}`],
      [`จำนวนรายการ: ${sorted.length} รายการ`],
      [],
      // Summary
      ['ยอดรวม', cat.type === 'income' ? `฿${formatCurrency(total)}` : `฿${formatCurrency(-total)}`],
      [],
      // Transaction header
      ['วันที่', 'กระเป๋าเงิน', 'จำนวนเงิน', 'หมายเหตุ'],
    ];

    // Add transactions
    sorted.forEach((t) => {
      data.push([
        formatDate(t.date),
        t.wallet?.name || '-',
        cat.type === 'income' ? t.amount : -t.amount,
        t.note || '',
      ]);
    });

    const prefix = cat.type === 'income' ? '💚' : '🔴';
    sheets.push({
      name: sanitizeSheetName(`${prefix} ${cat.name}`),
      data,
    });
  });

  return sheets;
}

// Create overview sheet
function createOverviewSheet(
  transactions: TransactionWithCategory[],
  wallets: Wallet[]
): { name: string; data: unknown[][] } {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Find date range
  const dates = transactions.map((t) => t.date.getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  const data: unknown[][] = [
    ['รายงานการเงิน - CeasFlow'],
    [],
    ['ข้อมูลทั่วไป'],
    ['วันที่ส่งออก', formatDate(new Date())],
    ['ช่วงเวลาข้อมูล', `${formatDate(minDate)} - ${formatDate(maxDate)}`],
    ['จำนวนรายการทั้งหมด', transactions.length],
    ['จำนวนกระเป๋าเงิน', wallets.length],
    [],
    ['สรุปยอดรวม'],
    ['รายรับทั้งหมด', `฿${formatCurrency(totalIncome)}`],
    ['รายจ่ายทั้งหมด', `฿${formatCurrency(totalExpense)}`],
    ['ยอดคงเหลือสุทธิ', `฿${formatCurrency(totalIncome - totalExpense)}`],
    [],
    ['สรุปตามกระเป๋าเงิน'],
    ['ไอคอน', 'กระเป๋าเงิน', 'รายรับ', 'รายจ่าย', 'ยอดคงเหลือ'],
  ];

  // Add wallet summaries
  wallets.forEach((wallet) => {
    const walletTransactions = transactions.filter((t) => t.walletId === wallet.id);
    const income = walletTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = walletTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    data.push([
      wallet.icon || '',
      wallet.name,
      `฿${formatCurrency(income)}`,
      `฿${formatCurrency(expense)}`,
      `฿${formatCurrency(income - expense)}`,
    ]);
  });

  return {
    name: '📋 ภาพรวม',
    data,
  };
}

// ============================================
// Main Export Function
// ============================================
export async function exportToExcel(
  data: ExportData,
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const { transactions, wallets, categories } = data;

  try {
    // Step 1: Preparing
    onProgress?.({
      status: 'preparing',
      progress: 10,
      message: 'กำลังเตรียมข้อมูล...',
    });

    // Attach wallet info to transactions
    const enrichedTransactions = transactions.map((t) => ({
      ...t,
      wallet: wallets.find((w) => w.id === t.walletId),
    }));

    // Small delay for UI feedback
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Step 2: Generating sheets
    onProgress?.({
      status: 'generating',
      progress: 30,
      message: 'กำลังสร้างแผ่นงาน...',
    });

    const workbook = XLSX.utils.book_new();

    // Create overview sheet
    const overviewSheet = createOverviewSheet(enrichedTransactions, wallets);
    const overviewWS = XLSX.utils.aoa_to_sheet(overviewSheet.data);
    XLSX.utils.book_append_sheet(workbook, overviewWS, overviewSheet.name);

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Step 3: Wallet sheets
    onProgress?.({
      status: 'generating',
      progress: 50,
      message: 'กำลังสร้างข้อมูลตามกระเป๋าเงิน...',
    });

    const walletSheets = createWalletSheets(enrichedTransactions, wallets);
    walletSheets.forEach((sheet) => {
      const ws = XLSX.utils.aoa_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Step 4: Monthly sheets
    onProgress?.({
      status: 'generating',
      progress: 70,
      message: 'กำลังสร้างข้อมูลตามเดือน...',
    });

    const monthlySheets = createMonthlySheets(enrichedTransactions);
    monthlySheets.forEach((sheet) => {
      const ws = XLSX.utils.aoa_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Step 5: Category sheets
    onProgress?.({
      status: 'generating',
      progress: 85,
      message: 'กำลังสร้างข้อมูลตามหมวดหมู่...',
    });

    const categorySheets = createCategorySheets(enrichedTransactions, categories);
    categorySheets.forEach((sheet) => {
      const ws = XLSX.utils.aoa_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Step 6: Downloading
    onProgress?.({
      status: 'downloading',
      progress: 95,
      message: 'กำลังดาวน์โหลดไฟล์...',
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `CeasFlow_Export_${timestamp}.xlsx`;

    // Write and download
    XLSX.writeFile(workbook, filename);

    // Step 7: Complete
    onProgress?.({
      status: 'complete',
      progress: 100,
      message: 'ส่งออกสำเร็จ!',
    });
  } catch (error) {
    console.error('Export failed:', error);
    onProgress?.({
      status: 'error',
      progress: 0,
      message: 'เกิดข้อผิดพลาดในการส่งออก',
    });
    throw error;
  }
}
