'use client';

import type { WalletType } from '@/types';

// ============================================
// Types
// ============================================
export interface TxtImportProgress {
  status: 'idle' | 'reading' | 'parsing' | 'importing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface TxtImportResult {
  walletsCreated: number;
  categoriesCreated: number;
  transactionsImported: number;
}

interface ParsedTxtWallet {
  name: string;
  type: WalletType;
  initialBalance: number;
  currentBalance: number;
}

interface ParsedTxtTransaction {
  walletName: string;
  date: Date;
  type: 'income' | 'expense';
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
  const parts = trimmed.split(/\s+/);
  if (parts.length < 3) return null;

  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  const thaiYear = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(thaiYear)) return null;

  const month = THAI_MONTH_MAP[monthStr];
  if (month === undefined) return null;

  const ceYear = thaiYear - 543;

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
// Parse Currency
// ============================================
function parseCurrency(str: string): number {
  if (!str || typeof str !== 'string') return 0;
  const cleaned = str.replace(/[+\-,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// ============================================
// Wallet Type Mapping (Thai -> English)
// ============================================
const WALLET_TYPE_MAP: Record<string, WalletType> = {
  'เงินสด': 'cash',
  'ธนาคาร': 'bank',
  'บัตรเครดิต': 'credit_card',
  'e-wallet': 'e_wallet',
  'ออมทรัพย์': 'savings',
  'รายจ่ายประจำวัน': 'daily_expense',
};

function parseWalletType(typeStr: string): WalletType {
  const cleaned = typeStr.trim().toLowerCase();
  for (const [thai, walletType] of Object.entries(WALLET_TYPE_MAP)) {
    if (cleaned === thai.toLowerCase()) return walletType;
  }
  const validTypes: WalletType[] = ['cash', 'bank', 'credit_card', 'e_wallet', 'savings', 'daily_expense'];
  if (validTypes.includes(cleaned as WalletType)) return cleaned as WalletType;
  return 'cash';
}

// ============================================
// TXT Parser
// ============================================
function parseTxtContent(content: string): {
  wallets: ParsedTxtWallet[];
  transactions: ParsedTxtTransaction[];
} {
  // Remove BOM if present
  const text = content.replace(/^\uFEFF/, '');
  const lines = text.split('\n').map((l) => l.replace(/\r$/, ''));

  const wallets: ParsedTxtWallet[] = [];
  const transactions: ParsedTxtTransaction[] = [];

  let section: 'none' | 'wallets' | 'categories' | 'transactions' = 'none';
  let currentWalletName = '';
  let walletHeaderPassed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect sections
    if (trimmed === '[ กระเป๋าเงิน ]') {
      section = 'wallets';
      walletHeaderPassed = false;
      continue;
    }
    if (trimmed === '[ หมวดหมู่ ]') {
      section = 'categories';
      continue;
    }
    if (trimmed === '[ รายการธุรกรรม แยกตามกระเป๋าเงิน ]') {
      section = 'transactions';
      continue;
    }
    if (trimmed === '[ ภาพรวมทั้งหมด ]') {
      section = 'none';
      continue;
    }
    if (trimmed.startsWith('สิ้นสุดรายงาน')) {
      break;
    }

    // Skip separator lines
    if (trimmed.startsWith('───') || trimmed.startsWith('═══')) continue;
    if (trimmed === '') continue;

    // Parse wallets section
    if (section === 'wallets') {
      // Skip header row (ชื่อกระเป๋า ประเภท ...)
      if (trimmed.startsWith('ชื่อกระเป๋า') || trimmed.startsWith('──────')) {
        walletHeaderPassed = true;
        continue;
      }
      if (!walletHeaderPassed) continue;

      const cols = line.split('\t');
      if (cols.length >= 4) {
        const name = cols[0].trim();
        const type = parseWalletType(cols[1].trim());
        const initialBalance = parseCurrency(cols[2].trim());
        const currentBalance = parseCurrency(cols[3].trim());

        if (name) {
          wallets.push({ name, type, initialBalance, currentBalance });
        }
      }
      continue;
    }

    // Parse transactions section
    if (section === 'transactions') {
      // Detect wallet group header: "── walletName (N รายการ) ──"
      const walletGroupMatch = trimmed.match(/^──\s+(.+?)\s+\(\d+\s+รายการ\)\s+──$/);
      if (walletGroupMatch) {
        currentWalletName = walletGroupMatch[1];
        continue;
      }

      // Skip summary lines
      if (trimmed.startsWith('รายรับ:') || trimmed.startsWith('วันที่') || trimmed.startsWith('──────')) {
        continue;
      }

      // Parse transaction rows (tab-separated)
      const cols = line.split('\t');
      if (cols.length >= 4 && currentWalletName) {
        const dateStr = cols[0].trim();
        const typeLabel = cols[1].trim();
        const categoryName = cols[2].trim();
        const amountStr = cols[3].trim();
        const note = cols[4]?.trim() || '';

        const date = parseThaiDate(dateStr);
        if (!date) continue;

        const type: 'income' | 'expense' = typeLabel === 'รายรับ' ? 'income' : 'expense';
        const amount = parseCurrency(amountStr);

        if (amount <= 0 || !categoryName || categoryName === '-') continue;

        transactions.push({
          walletName: currentWalletName,
          date,
          type,
          categoryName,
          amount,
          note: note === '-' ? '' : note,
        });
      }
      continue;
    }
  }

  return { wallets, transactions };
}

// ============================================
// Import Dependencies (same pattern as excel-import)
// ============================================
export interface TxtImportDependencies {
  existingWallets: { id: string; name: string }[];
  findCategoryByName: (name: string, type: 'income' | 'expense') => { id: string } | undefined;
  addCategory: (input: { name: string; type: 'income' | 'expense'; icon?: string }) => Promise<{ id: string }>;
  addWallet: (wallet: Omit<import('@/types').Wallet, 'id' | 'createdAt'>) => Promise<void>;
  getWallets: () => { id: string; name: string }[];
  addTransaction: (input: import('@/types').TransactionInput) => Promise<void>;
}

// ============================================
// Main Import Function
// ============================================
export async function importFromTxt(
  file: File,
  deps: TxtImportDependencies,
  onProgress?: (progress: TxtImportProgress) => void,
): Promise<TxtImportResult> {
  let walletsCreated = 0;
  let categoriesCreated = 0;
  let transactionsImported = 0;

  try {
    // Step 1: Reading file
    onProgress?.({
      status: 'reading',
      progress: 10,
      message: 'กำลังอ่านไฟล์ TXT...',
    });

    const text = await file.text();

    if (!text.includes('Pay Flow') && !text.includes('รายการธุรกรรม')) {
      throw new Error('ไฟล์นี้ไม่ใช่ไฟล์ที่ส่งออกจาก Pay Flow');
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Step 2: Parsing content
    onProgress?.({
      status: 'parsing',
      progress: 30,
      message: 'กำลังวิเคราะห์ข้อมูล...',
    });

    const { wallets: parsedWallets, transactions: parsedTransactions } = parseTxtContent(text);

    if (parsedWallets.length === 0 && parsedTransactions.length === 0) {
      throw new Error('ไม่พบข้อมูลกระเป๋าเงินหรือรายการในไฟล์');
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Step 3: Import wallets
    onProgress?.({
      status: 'importing',
      progress: 40,
      message: 'กำลังนำเข้ากระเป๋าเงิน...',
    });

    // Map: original wallet name -> new wallet ID
    const walletNameToId = new Map<string, string>();

    for (const pw of parsedWallets) {
      const currentWallets = deps.getWallets();
      let walletName = pw.name;
      const existing = currentWallets.find((w) => w.name === walletName);

      if (existing) {
        let suffix = 1;
        let candidate = `${pw.name} (ซ้ำ)`;
        while (currentWallets.find((w) => w.name === candidate)) {
          suffix++;
          candidate = `${pw.name} (ซ้ำ ${suffix})`;
        }
        walletName = candidate;
      }

      await deps.addWallet({
        name: walletName,
        type: pw.type,
        icon: '💰',
        color: '#6366f1',
        currency: 'THB',
        initialBalance: pw.initialBalance,
        currentBalance: 0,
        isAsset: pw.type !== 'credit_card',
      });
      walletsCreated++;

      const updatedWallets = deps.getWallets();
      const newWallet = updatedWallets.find((w) => w.name === walletName);
      if (newWallet) {
        walletNameToId.set(pw.name, newWallet.id);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Step 4: Import transactions
    if (parsedTransactions.length === 0) {
      onProgress?.({
        status: 'complete',
        progress: 100,
        message: `นำเข้าสำเร็จ! ${walletsCreated} กระเป๋า, 0 รายการ`,
      });
      return { walletsCreated, categoriesCreated, transactionsImported };
    }

    const totalTx = parsedTransactions.length;

    for (let i = 0; i < parsedTransactions.length; i++) {
      const tx = parsedTransactions[i];

      // Find wallet ID
      let walletId = walletNameToId.get(tx.walletName);

      // If not found in newly created, try existing wallets
      if (!walletId) {
        const currentWallets = deps.getWallets();
        const existingWallet = currentWallets.find((w) => w.name === tx.walletName);
        if (existingWallet) {
          walletId = existingWallet.id;
        }
      }

      if (!walletId) continue;

      // Find or create category
      let category = deps.findCategoryByName(tx.categoryName, tx.type);
      if (!category) {
        category = await deps.addCategory({
          name: tx.categoryName,
          type: tx.type,
        });
        categoriesCreated++;
      }

      // Add transaction
      await deps.addTransaction({
        type: tx.type,
        amount: tx.amount,
        categoryId: category.id,
        walletId,
        date: tx.date,
        note: tx.note || undefined,
      });
      transactionsImported++;

      // Update progress periodically
      if (i % 5 === 0 || i === totalTx - 1) {
        const txProgress = 50 + Math.round(((i + 1) / totalTx) * 45);
        onProgress?.({
          status: 'importing',
          progress: txProgress,
          message: `กำลังนำเข้ารายการ ${i + 1}/${totalTx}...`,
        });
      }
    }

    // Step 5: Complete
    onProgress?.({
      status: 'complete',
      progress: 100,
      message: `นำเข้าสำเร็จ! ${walletsCreated} กระเป๋า, ${transactionsImported} รายการ`,
    });

    return { walletsCreated, categoriesCreated, transactionsImported };
  } catch (error) {
    console.error('TXT Import error:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการนำเข้า';
    onProgress?.({
      status: 'error',
      progress: 0,
      message,
    });
    throw error;
  }
}
