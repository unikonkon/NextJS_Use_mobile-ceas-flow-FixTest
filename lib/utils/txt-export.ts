'use client';

import type { TransactionWithCategory, Wallet, Category } from '@/types';

export interface TxtExportData {
  transactions: TransactionWithCategory[];
  wallets: Wallet[];
  categories: Category[];
}

export interface TxtExportProgress {
  status: 'idle' | 'preparing' | 'generating' | 'downloading' | 'complete' | 'error';
  progress: number;
  message: string;
}

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

function formatCurrency(amount: number): string {
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildLine(separator: string, ...cols: string[]): string {
  return cols.join(separator);
}

export async function exportToTxt(
  data: TxtExportData,
  onProgress: (p: TxtExportProgress) => void,
): Promise<void> {
  try {
    onProgress({ status: 'preparing', progress: 10, message: 'กำลังเตรียมข้อมูล...' });

    const { transactions, wallets, categories } = data;
    const lines: string[] = [];
    const sep = '\t';

    // ============ Header ============
    const now = new Date();
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('  Pay Flow - รายงานข้อมูลทั้งหมด');
    lines.push(`  วันที่ส่งออก: ${formatDate(now)}`);
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('');

    onProgress({ status: 'generating', progress: 20, message: 'กำลังสร้างภาพรวม...' });

    // ============ Summary ============
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    lines.push('[ ภาพรวมทั้งหมด ]');
    lines.push('───────────────────────────────────────────────────────');
    lines.push(`  จำนวนรายการทั้งหมด : ${transactions.length} รายการ`);
    lines.push(`  จำนวนกระเป๋าเงิน  : ${wallets.length} กระเป๋า`);
    lines.push(`  จำนวนหมวดหมู่      : ${categories.length} หมวด`);
    lines.push(`  รายรับรวม          : ${formatCurrency(totalIncome)} บาท`);
    lines.push(`  รายจ่ายรวม         : ${formatCurrency(totalExpense)} บาท`);
    lines.push(`  คงเหลือ            : ${formatCurrency(totalIncome - totalExpense)} บาท`);
    lines.push('');

    onProgress({ status: 'generating', progress: 35, message: 'กำลังสร้างข้อมูลกระเป๋า...' });

    // ============ Wallets ============
    lines.push('[ กระเป๋าเงิน ]');
    lines.push('───────────────────────────────────────────────────────');
    lines.push(buildLine(sep, 'ชื่อกระเป๋า', 'ประเภท', 'ยอดเริ่มต้น', 'ยอดปัจจุบัน'));
    lines.push(buildLine(sep, '──────────', '──────', '──────────', '──────────'));

    const walletTypeMap: Record<string, string> = {
      cash: 'เงินสด',
      bank: 'ธนาคาร',
      credit_card: 'บัตรเครดิต',
      e_wallet: 'E-Wallet',
      savings: 'ออมทรัพย์',
      daily_expense: 'รายจ่ายประจำวัน',
    };

    for (const w of wallets) {
      lines.push(
        buildLine(
          sep,
          w.name,
          walletTypeMap[w.type] || w.type,
          formatCurrency(w.initialBalance),
          formatCurrency(w.currentBalance),
        ),
      );
    }
    lines.push('');

    onProgress({ status: 'generating', progress: 50, message: 'กำลังสร้างข้อมูลหมวดหมู่...' });

    // ============ Categories ============
    lines.push('[ หมวดหมู่ ]');
    lines.push('───────────────────────────────────────────────────────');
    const expenseCats = categories.filter((c) => c.type === 'expense');
    const incomeCats = categories.filter((c) => c.type === 'income');

    if (incomeCats.length > 0) {
      lines.push('  รายรับ:');
      for (const c of incomeCats) {
        lines.push(`    ${c.icon || '•'} ${c.name}`);
      }
    }
    if (expenseCats.length > 0) {
      lines.push('  รายจ่าย:');
      for (const c of expenseCats) {
        lines.push(`    ${c.icon || '•'} ${c.name}`);
      }
    }
    lines.push('');

    onProgress({ status: 'generating', progress: 65, message: 'กำลังสร้างรายการธุรกรรม...' });

    // ============ Transactions by wallet ============
    lines.push('[ รายการธุรกรรม แยกตามกระเป๋าเงิน ]');
    lines.push('═══════════════════════════════════════════════════════');

    const walletMap = new Map(wallets.map((w) => [w.id, w]));

    // Group transactions by wallet
    const txByWallet = new Map<string, TransactionWithCategory[]>();
    for (const tx of transactions) {
      const wId = tx.walletId;
      if (!txByWallet.has(wId)) txByWallet.set(wId, []);
      txByWallet.get(wId)!.push(tx);
    }

    let walletIdx = 0;
    for (const [walletId, txs] of txByWallet) {
      const wallet = walletMap.get(walletId);
      const walletName = wallet?.name || 'ไม่ทราบกระเป๋า';

      const wIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const wExpense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      lines.push('');
      lines.push(`── ${walletName} (${txs.length} รายการ) ──`);
      lines.push(`   รายรับ: ${formatCurrency(wIncome)}  |  รายจ่าย: ${formatCurrency(wExpense)}`);
      lines.push('');
      lines.push(buildLine(sep, 'วันที่', 'ประเภท', 'หมวดหมู่', 'จำนวนเงิน', 'หมายเหตุ'));
      lines.push(buildLine(sep, '──────', '──────', '────────', '─────────', '────────'));

      // Sort by date descending
      const sorted = [...txs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      for (const tx of sorted) {
        const typeLabel = tx.type === 'income' ? 'รายรับ' : 'รายจ่าย';
        const catName = tx.category?.name || '-';
        const sign = tx.type === 'income' ? '+' : '-';
        const amountStr = `${sign}${formatCurrency(tx.amount)}`;
        const note = tx.note || '-';

        lines.push(
          buildLine(sep, formatDate(new Date(tx.date)), typeLabel, catName, amountStr, note),
        );
      }

      walletIdx++;
      const walletProgress = 65 + Math.round((walletIdx / txByWallet.size) * 20);
      onProgress({
        status: 'generating',
        progress: walletProgress,
        message: `กำลังสร้างข้อมูล ${walletName}...`,
      });
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('  สิ้นสุดรายงาน');
    lines.push('═══════════════════════════════════════════════════════');

    onProgress({ status: 'downloading', progress: 90, message: 'กำลังดาวน์โหลดไฟล์...' });

    // ============ Download ============
    const content = lines.join('\n');
    const bom = '\uFEFF'; // UTF-8 BOM for proper encoding in Notepad etc.
    const blob = new Blob([bom + content], { type: 'text/plain;charset=utf-8' });

    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `PayFlow_Export_${dateStr}.txt`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onProgress({ status: 'complete', progress: 100, message: 'ส่งออกสำเร็จ!' });
  } catch (error) {
    console.error('TXT Export error:', error);
    onProgress({
      status: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออก',
    });
  }
}
