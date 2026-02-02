'use client';

import * as XLSX from 'xlsx';
import type { WalletType } from '@/types';

// ============================================
// Types
// ============================================
export interface ImportProgress {
  status: 'idle' | 'reading' | 'parsing' | 'importing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface ImportResult {
  walletsCreated: number;
  transactionsImported: number;
}

export interface ParsedWallet {
  name: string;
  icon: string;
  type: WalletType;
  initialBalance: number;
  transactions: ParsedTransaction[];
}

export interface ParsedTransaction {
  date: Date;
  type: 'income' | 'expense';
  categoryIcon: string;
  categoryName: string;
  amount: number;
  note: string;
}

// ============================================
// Thai Date Parsing
// ============================================
const THAI_MONTH_MAP: Record<string, number> = {
  'ม.ค.': 0,
  'ก.พ.': 1,
  'มี.ค.': 2,
  'เม.ย.': 3,
  'พ.ค.': 4,
  'มิ.ย.': 5,
  'ก.ค.': 6,
  'ส.ค.': 7,
  'ก.ย.': 8,
  'ต.ค.': 9,
  'พ.ย.': 10,
  'ธ.ค.': 11,
};

function parseThaiDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();

  // Format: "1 ม.ค. 2569" or "1 ม.ค. 2569 14:30"
  const parts = trimmed.split(/\s+/);
  if (parts.length < 3) return null;

  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  const thaiYear = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(thaiYear)) return null;

  const month = THAI_MONTH_MAP[monthStr];
  if (month === undefined) return null;

  // Convert Thai Buddhist Era to CE
  const ceYear = thaiYear - 543;

  // Parse optional time part (HH:MM)
  let hours = 0;
  let minutes = 0;
  if (parts.length >= 4 && parts[3].includes(':')) {
    const timeParts = parts[3].split(':');
    hours = parseInt(timeParts[0], 10) || 0;
    minutes = parseInt(timeParts[1], 10) || 0;
  }

  return new Date(ceYear, month, day, hours, minutes);
}

// ============================================
// Parse Helpers
// ============================================
function parseCurrencyString(str: string): number {
  if (!str || typeof str !== 'string') return 0;
  // Remove ฿, commas, spaces
  const cleaned = str.replace(/[฿,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseWalletType(typeStr: string): WalletType {
  const validTypes: WalletType[] = ['cash', 'bank', 'credit_card', 'e_wallet', 'savings', 'daily_expense'];
  const cleaned = typeStr.trim().toLowerCase();
  if (validTypes.includes(cleaned as WalletType)) {
    return cleaned as WalletType;
  }
  return 'cash'; // default
}

function parseWalletHeader(headerStr: string): { icon: string; name: string } {
  // Format: "กระเป๋าเงิน: 🏦 ชื่อกระเป๋า" or "กระเป๋าเงิน:  ชื่อกระเป๋า"
  const prefix = 'กระเป๋าเงิน:';
  if (!headerStr.startsWith(prefix)) return { icon: '', name: headerStr };

  const rest = headerStr.substring(prefix.length).trim();

  // Try to extract emoji icon (first character might be emoji)
  // Emoji regex for common emoji characters
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*/u;
  const match = rest.match(emojiRegex);

  if (match) {
    return {
      icon: match[1],
      name: rest.substring(match[0].length).trim(),
    };
  }

  return { icon: '', name: rest };
}

// ============================================
// Sheet Parsers
// ============================================

function isWalletSheet(sheetName: string): boolean {
  // Wallet sheets are named like "💰 wallet_name"
  return sheetName.startsWith('💰') || sheetName.includes('💰');
}

function parseWalletSheet(sheet: XLSX.WorkSheet): ParsedWallet | null {
  const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (!data || data.length < 10) return null;

  // Row 0: กระเป๋าเงิน: icon name
  const walletHeaderStr = String(data[0]?.[0] || '');
  const { icon, name } = parseWalletHeader(walletHeaderStr);

  if (!name) return null;

  // Row 1: ประเภท: type
  const typeStr = String(data[1]?.[0] || '').replace('ประเภท:', '').trim();
  const walletType = parseWalletType(typeStr);

  // Row 2: ยอดเริ่มต้น: ฿amount
  const balanceStr = String(data[2]?.[0] || '').replace('ยอดเริ่มต้น:', '').trim();
  const initialBalance = parseCurrencyString(balanceStr);

  // Find transaction header row
  let headerRowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (
      Array.isArray(row) &&
      row.length >= 4 &&
      String(row[0]).includes('วันที่') &&
      String(row[1]).includes('ประเภท')
    ) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) return null;

  // Parse transactions starting from headerRowIndex + 1
  const transactions: ParsedTransaction[] = [];
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row) || row.length < 5) continue;

    // ['วันที่', 'ประเภท', 'ไอคอน', 'หมวดหมู่', 'จำนวนเงิน', 'หมายเหตุ']
    const dateStr = String(row[0] || '');
    const typeLabel = String(row[1] || '');
    const categoryIcon = String(row[2] || '');
    const categoryName = String(row[3] || '');
    const rawAmount = row[4];
    const note = String(row[5] || '');

    const date = parseThaiDate(dateStr);
    if (!date) continue;

    const type: 'income' | 'expense' = typeLabel === 'รายรับ' ? 'income' : 'expense';
    const amount = typeof rawAmount === 'number' ? Math.abs(rawAmount) : Math.abs(parseCurrencyString(String(rawAmount)));

    if (amount <= 0) continue;

    transactions.push({
      date,
      type,
      categoryIcon,
      categoryName,
      amount,
      note,
    });
  }

  return {
    name,
    icon,
    type: walletType,
    initialBalance,
    transactions,
  };
}

// ============================================
// Main Import Function
// ============================================
export interface ImportDependencies {
  existingWallets: { id: string; name: string }[];
  findCategoryByName: (name: string, type: 'income' | 'expense') => { id: string } | undefined;
  addCategory: (input: { name: string; type: 'income' | 'expense'; icon?: string }) => Promise<{ id: string }>;
  addWallet: (wallet: Omit<import('@/types').Wallet, 'id' | 'createdAt'>) => Promise<void>;
  getWallets: () => { id: string; name: string }[];
  addTransaction: (input: import('@/types').TransactionInput) => Promise<void>;
}

export async function importFromExcel(
  file: File,
  deps: ImportDependencies,
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportResult> {
  let walletsCreated = 0;
  let transactionsImported = 0;

  try {
    // Step 1: Reading file
    onProgress?.({
      status: 'reading',
      progress: 10,
      message: 'กำลังอ่านไฟล์...',
    });

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Step 2: Parsing sheets
    onProgress?.({
      status: 'parsing',
      progress: 30,
      message: 'กำลังวิเคราะห์ข้อมูล...',
    });

    // Find wallet sheets
    const walletSheetNames = workbook.SheetNames.filter(isWalletSheet);

    if (walletSheetNames.length === 0) {
      throw new Error('ไม่พบแผ่นงานกระเป๋าเงินในไฟล์');
    }

    // Parse all wallet sheets
    const parsedWallets: ParsedWallet[] = [];
    for (const sheetName of walletSheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const parsed = parseWalletSheet(sheet);
      if (parsed && parsed.transactions.length > 0) {
        parsedWallets.push(parsed);
      }
    }

    if (parsedWallets.length === 0) {
      throw new Error('ไม่พบข้อมูลรายการในไฟล์');
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Step 3: Importing wallets and transactions
    onProgress?.({
      status: 'importing',
      progress: 50,
      message: 'กำลังนำเข้าข้อมูล...',
    });

    const totalWallets = parsedWallets.length;

    for (let wi = 0; wi < parsedWallets.length; wi++) {
      const parsedWallet = parsedWallets[wi];

      // Check if wallet name already exists
      const currentWallets = deps.getWallets();
      let walletName = parsedWallet.name;
      const existingWallet = currentWallets.find((w) => w.name === walletName);

      if (existingWallet) {
        // Find a unique name with "ซ้ำ" suffix
        let suffix = 1;
        let candidateName = `${parsedWallet.name} (ซ้ำ)`;
        while (currentWallets.find((w) => w.name === candidateName)) {
          suffix++;
          candidateName = `${parsedWallet.name} (ซ้ำ ${suffix})`;
        }
        walletName = candidateName;
      }

      // Create new wallet
      await deps.addWallet({
        name: walletName,
        type: parsedWallet.type,
        icon: parsedWallet.icon || '💰',
        color: '#6366f1', // default color
        currency: 'THB',
        initialBalance: parsedWallet.initialBalance,
        currentBalance: 0,
        isAsset: parsedWallet.type !== 'credit_card',
      });
      walletsCreated++;

      // Get the newly created wallet ID
      const updatedWallets = deps.getWallets();
      const newWallet = updatedWallets.find((w) => w.name === walletName);
      if (!newWallet) continue;

      // Progress update
      const walletProgress = 50 + ((wi + 0.5) / totalWallets) * 40;
      onProgress?.({
        status: 'importing',
        progress: Math.round(walletProgress),
        message: `กำลังนำเข้า "${walletName}"...`,
      });

      // Import transactions for this wallet
      for (const tx of parsedWallet.transactions) {
        // Find or create category
        let category = deps.findCategoryByName(tx.categoryName, tx.type);

        if (!category) {
          // Create new category
          category = await deps.addCategory({
            name: tx.categoryName,
            type: tx.type,
            icon: tx.categoryIcon || undefined,
          });
        }

        // Add transaction
        await deps.addTransaction({
          type: tx.type,
          amount: tx.amount,
          categoryId: category.id,
          walletId: newWallet.id,
          date: tx.date,
          note: tx.note || undefined,
        });

        transactionsImported++;
      }

      // Progress update after wallet complete
      const completedProgress = 50 + (((wi + 1) / totalWallets) * 40);
      onProgress?.({
        status: 'importing',
        progress: Math.round(completedProgress),
        message: `นำเข้า "${walletName}" สำเร็จ (${parsedWallet.transactions.length} รายการ)`,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Step 4: Complete
    onProgress?.({
      status: 'complete',
      progress: 100,
      message: `นำเข้าสำเร็จ! ${walletsCreated} กระเป๋า, ${transactionsImported} รายการ`,
    });

    return { walletsCreated, transactionsImported };
  } catch (error) {
    console.error('Import failed:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการนำเข้า';
    onProgress?.({
      status: 'error',
      progress: 0,
      message,
    });
    throw error;
  }
}
