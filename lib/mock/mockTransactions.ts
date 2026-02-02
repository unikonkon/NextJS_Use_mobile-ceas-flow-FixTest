// Types
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

interface TransactionWithCategory {
  id: string;
  walletId: string;
  categoryId: string;
  type: 'expense' | 'income';
  amount: number;
  currency: string;
  date: Date;
  note: string;
  category: Category | undefined;
  wallet: Wallet;
  createdAt: Date;
  updatedAt: Date;
}

// Mock Wallets
const mockWallets: Wallet[] = [
  { id: 'w1', name: 'เงินสด', balance: 5000, currency: 'THB' },
  { id: 'w2', name: 'บัญชีออมทรัพย์', balance: 50000, currency: 'THB' },
  { id: 'w3', name: 'บัตรเครดิต', balance: -2000, currency: 'THB' },
  { id: 'w4', name: 'PromptPay', balance: 3000, currency: 'THB' },
];

// Expense Categories
const expenseCategories: Category[] = [
  { id: '1', name: 'อาหาร', icon: '🍔', color: '#FF6B6B', type: 'expense' },
  { id: '2', name: 'เครื่องดื่ม', icon: '☕', color: '#845EC2', type: 'expense' },
  { id: '3', name: 'เดินทาง', icon: '🚗', color: '#4ECDC4', type: 'expense' },
  { id: '4', name: 'ช็อปปิ้ง', icon: '🛍️', color: '#FF9F43', type: 'expense' },
  { id: '5', name: 'ความบันเทิง', icon: '🎬', color: '#A55EEA', type: 'expense' },
  { id: '6', name: 'ค่าเช่า/ผ่อนบ้าน', icon: '🏠', color: '#26DE81', type: 'expense' },
  { id: '7', name: 'ค่าน้ำ', icon: '💧', color: '#54A0FF', type: 'expense' },
  { id: '8', name: 'ค่าไฟ', icon: '⚡', color: '#FFC312', type: 'expense' },
  { id: '9', name: 'ค่าโทรศัพท์/อินเทอร์เน็ต', icon: '📱', color: '#1289A7', type: 'expense' },
  { id: '10', name: 'การศึกษา', icon: '📚', color: '#A3CB38', type: 'expense' },
  { id: '11', name: 'ของใช้ส่วนตัว', icon: '🧴', color: '#FDA7DF', type: 'expense' },
  { id: '12', name: 'เสื้อผ้า', icon: '👕', color: '#ED4C67', type: 'expense' },
  { id: '13', name: 'ออกกำลังกาย', icon: '🏋️', color: '#12CBC4', type: 'expense' },
  { id: '14', name: 'สุขภาพ/ยา', icon: '💊', color: '#EB3B5A', type: 'expense' },
  { id: '15', name: 'ประกัน', icon: '🛡️', color: '#3867D6', type: 'expense' },
  { id: '16', name: 'ของขวัญ', icon: '🎁', color: '#FC427B', type: 'expense' },
  { id: '17', name: 'สัตว์เลี้ยง', icon: '🐕', color: '#EE5A24', type: 'expense' },
  { id: '18', name: 'Subscription', icon: '📺', color: '#0652DD', type: 'expense' },
  { id: '19', name: 'อื่นๆ', icon: '📦', color: '#9B9B9B', type: 'expense' },
];

// Income Categories
const incomeCategories: Category[] = [
  { id: '101', name: 'เงินเดือน', icon: '💰', color: '#26DE81', type: 'income' },
  { id: '102', name: 'โบนัส', icon: '🎉', color: '#FFC312', type: 'income' },
  { id: '103', name: 'รายได้เสริม', icon: '💵', color: '#A3CB38', type: 'income' },
  { id: '104', name: 'ดอกเบี้ย', icon: '🏦', color: '#00D2D3', type: 'income' },
  { id: '105', name: 'เงินปันผล', icon: '📈', color: '#54A0FF', type: 'income' },
  { id: '106', name: 'ขายของ', icon: '🏷️', color: '#FF6B6B', type: 'income' },
  { id: '107', name: 'รางวัล', icon: '🏆', color: '#FECA57', type: 'income' },
  { id: '108', name: 'อื่นๆ', icon: '💸', color: '#9B9B9B', type: 'income' },
];

// Helper functions
const findExpense = (id: string): Category | undefined =>
  expenseCategories.find((c) => c.id === id);

const findIncome = (id: string): Category | undefined =>
  incomeCategories.find((c) => c.id === id);

// Random data pools
const expenseNotes: Record<string, string[]> = {
  '1': ['มื้อเที่ยง', 'มื้อเย็น', 'มื้อเช้า', 'อาหารตามสั่ง', 'ข้าวมันไก่', 'ก๋วยเตี๋ยว', 'ส้มตำ', 'ข้าวผัด', 'พิซซ่า', 'ซูชิ', 'บุฟเฟ่ต์', 'Grab Food', 'LINE MAN', 'อาหารญี่ปุ่น', 'อาหารเกาหลี', 'ข้าวราดแกง', 'ผัดไทย', 'หมูกระทะ', 'ชาบู', 'KFC', 'McDonald'],
  '2': ['กาแฟ', 'ชานมไข่มุก', 'น้ำผลไม้', 'สตาร์บัคส์', 'Amazon', 'Café Amazon', 'ชาเขียว', 'โกโก้', 'สมูทตี้', 'น้ำอัดลม', 'น้ำดื่ม', 'ชาไทย', 'มอคค่า', 'ลาเต้', 'Espresso'],
  '3': ['BTS', 'MRT', 'แท็กซี่', 'Grab', 'Bolt', 'น้ำมันรถ', 'ค่าทางด่วน', 'ค่าจอดรถ', 'ล้างรถ', 'ซ่อมรถ', 'รถเมล์', 'เรือด่วน', 'รถไฟฟ้า', 'วินมอเตอร์ไซค์', 'ค่าผ่านทาง'],
  '4': ['Shopee', 'Lazada', 'เซ็นทรัล', 'พารากอน', 'Big C', 'Tesco Lotus', 'Makro', 'ตลาดนัด', 'ห้างสรรพสินค้า', 'ร้านสะดวกซื้อ', 'JD Central', 'อิเกีย', 'HomePro'],
  '5': ['ดูหนัง', 'Netflix', 'คอนเสิร์ต', 'เกม', 'คาราโอเกะ', 'โบว์ลิ่ง', 'Steam', 'PS Plus', 'YouTube Premium', 'Spotify', 'Disney+', 'WeTV', 'JOOX'],
  '6': ['ค่าเช่าห้อง', 'ค่าผ่อนบ้าน', 'ค่าผ่อนคอนโด', 'ค่าส่วนกลาง', 'ค่าประกันห้อง'],
  '7': ['ค่าน้ำประปา', 'ค่าน้ำเดือนนี้', 'น้ำดื่มถัง'],
  '8': ['ค่าไฟฟ้า', 'ค่าไฟเดือนนี้', 'ค่าไฟแอร์'],
  '9': ['ค่ามือถือ', 'ค่าเน็ตบ้าน', 'AIS', 'TRUE', 'DTAC', '3BB', 'TOT', 'ค่าโทรศัพท์'],
  '10': ['ค่าเรียน', 'คอร์สออนไลน์', 'หนังสือ', 'Udemy', 'Coursera', 'ค่าสอบ', 'ค่าเรียนพิเศษ', 'อุปกรณ์เรียน'],
  '11': ['7-Eleven', 'ของใช้ส่วนตัว', 'สบู่', 'แชมพู', 'ยาสีฟัน', 'แปรงสีฟัน', 'ครีมบำรุง', 'โลชั่น', 'สกินแคร์', 'เครื่องสำอาง', 'Boots', 'Watsons'],
  '12': ['เสื้อยืด', 'กางเกง', 'รองเท้า', 'กระเป๋า', 'Uniqlo', 'H&M', 'Zara', 'เสื้อผ้าออกกำลังกาย', 'ชุดนอน', 'ถุงเท้า'],
  '13': ['ค่าฟิตเนส', 'อุปกรณ์ออกกำลังกาย', 'โยคะ', 'ว่ายน้ำ', 'Fitness First', 'Virgin Active', 'ค่าสมาชิกยิม'],
  '14': ['ค่ายา', 'ค่าหมอ', 'โรงพยาบาล', 'วิตามิน', 'อาหารเสริม', 'ตรวจสุขภาพ', 'ทำฟัน', 'แว่นตา', 'คอนแทคเลนส์'],
  '15': ['ประกันชีวิต', 'ประกันรถ', 'ประกันสุขภาพ', 'ประกันอุบัติเหตุ', 'ประกันเดินทาง'],
  '16': ['ของขวัญวันเกิด', 'ของขวัญปีใหม่', 'ดอกไม้', 'ของฝาก', 'ของขวัญแต่งงาน', 'ซองงานแต่ง', 'ซองบวช'],
  '17': ['อาหารสัตว์', 'อาหารแมว', 'อาหารสุนัข', 'ของเล่นสัตว์', 'อาบน้ำหมา', 'ฉีดวัคซีน', 'ทรายแมว'],
  '18': ['Netflix', 'Spotify', 'YouTube Premium', 'iCloud', 'Disney+', 'HBO Go', 'Apple Music', 'Microsoft 365', 'Canva Pro', 'Adobe', 'ChatGPT Plus'],
  '19': ['เบ็ดเตล็ด', 'อื่นๆ', 'ค่าใช้จ่ายอื่น', 'ค่าธรรมเนียม', 'ค่าบริการ'],
};

const incomeNotes: Record<string, string[]> = {
  '101': ['เงินเดือน', 'เงินเดือนเดือนนี้', 'Salary', 'เงินเดือน ม.ค.', 'เงินเดือน ก.พ.', 'เงินเดือน มี.ค.', 'เงินเดือน เม.ย.', 'เงินเดือน พ.ค.', 'เงินเดือน มิ.ย.', 'เงินเดือน ก.ค.', 'เงินเดือน ส.ค.', 'เงินเดือน ก.ย.', 'เงินเดือน ต.ค.', 'เงินเดือน พ.ย.', 'เงินเดือน ธ.ค.'],
  '102': ['โบนัสประจำปี', 'โบนัสพิเศษ', 'โบนัส Q1', 'โบนัส Q2', 'โบนัส Q3', 'โบนัส Q4', 'Performance Bonus'],
  '103': ['Freelance', 'งานพิเศษ', 'รายได้เสริม', 'ขายของออนไลน์', 'OT', 'ค่าคอมมิชชั่น', 'รับจ้างทั่วไป', 'งานนอก'],
  '104': ['ดอกเบี้ยเงินฝาก', 'ดอกเบี้ยออมทรัพย์', 'ดอกเบี้ย FD', 'ดอกเบี้ยพันธบัตร'],
  '105': ['เงินปันผลหุ้น', 'ปันผลกองทุน', 'Dividend', 'เงินปันผล LTF', 'เงินปันผล RMF'],
  '106': ['ขายของมือสอง', 'ขายของเก่า', 'ขายหนังสือ', 'ขายเสื้อผ้า', 'ขายโทรศัพท์', 'ขายคอม'],
  '107': ['ถูกหวย', 'รางวัล', 'ชิงโชค', 'เงินรางวัล', 'แข่งขัน'],
  '108': ['รายได้อื่น', 'เงินคืนภาษี', 'เงินคืน', 'Cashback', 'รีฟันด์', 'ได้รับโอน'],
};

// Random utility functions
const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const randomDate = (startDate: Date, endDate: Date): Date => {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
};

const generateId = (index: number): string =>
  `t${String(index).padStart(5, '0')}`;

// Amount ranges by category
const amountRanges: Record<string, { min: number; max: number }> = {
  // Expenses
  '1': { min: 30, max: 500 },      // อาหาร
  '2': { min: 20, max: 200 },      // เครื่องดื่ม
  '3': { min: 15, max: 2000 },     // เดินทาง
  '4': { min: 100, max: 5000 },    // ช็อปปิ้ง
  '5': { min: 100, max: 2000 },    // ความบันเทิง
  '6': { min: 5000, max: 25000 },  // ค่าเช่า
  '7': { min: 50, max: 500 },      // ค่าน้ำ
  '8': { min: 200, max: 3000 },    // ค่าไฟ
  '9': { min: 200, max: 1500 },    // ค่าโทรศัพท์
  '10': { min: 100, max: 10000 },  // การศึกษา
  '11': { min: 50, max: 1000 },    // ของใช้ส่วนตัว
  '12': { min: 200, max: 5000 },   // เสื้อผ้า
  '13': { min: 500, max: 3000 },   // ออกกำลังกาย
  '14': { min: 100, max: 5000 },   // สุขภาพ
  '15': { min: 500, max: 10000 },  // ประกัน
  '16': { min: 200, max: 5000 },   // ของขวัญ
  '17': { min: 100, max: 2000 },   // สัตว์เลี้ยง
  '18': { min: 100, max: 1000 },   // Subscription
  '19': { min: 50, max: 2000 },    // อื่นๆ
  // Income
  '101': { min: 15000, max: 150000 }, // เงินเดือน
  '102': { min: 5000, max: 100000 },  // โบนัส
  '103': { min: 500, max: 30000 },    // รายได้เสริม
  '104': { min: 10, max: 5000 },      // ดอกเบี้ย
  '105': { min: 100, max: 50000 },    // เงินปันผล
  '106': { min: 100, max: 10000 },    // ขายของ
  '107': { min: 100, max: 100000 },   // รางวัล
  '108': { min: 100, max: 10000 },    // อื่นๆ
};

// Generate single transaction
const generateTransaction = (
  index: number,
  startDate: Date,
  endDate: Date
): TransactionWithCategory => {
  // 85% expense, 15% income
  const isExpense = Math.random() < 0.85;
  
  const category = isExpense
    ? randomElement(expenseCategories)
    : randomElement(incomeCategories);
  
  const wallet = randomElement(mockWallets);
  const date = randomDate(startDate, endDate);
  
  const notes = isExpense
    ? expenseNotes[category.id] || expenseNotes['19']
    : incomeNotes[category.id] || incomeNotes['108'];
  
  const range = amountRanges[category.id] || { min: 50, max: 1000 };
  const amount = randomInt(range.min, range.max);

  return {
    id: generateId(index),
    walletId: wallet.id,
    categoryId: category.id,
    type: isExpense ? 'expense' : 'income',
    amount,
    currency: 'THB',
    date,
    note: randomElement(notes),
    category: isExpense ? findExpense(category.id) : findIncome(category.id),
    wallet,
    createdAt: date,
    updatedAt: date,
  };
};

// Generate all transactions
const generateMockTransactions = (
  count: number
): TransactionWithCategory[] => {
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const transactions: TransactionWithCategory[] = [];

  for (let i = 1; i <= count; i++) {
    transactions.push(generateTransaction(i, oneYearAgo, today));
  }

  // Sort by date descending (newest first)
  transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

  return transactions;
};

// Export generated transactions
export const mockTransactions: TransactionWithCategory[] =
  generateMockTransactions(10000);

// Export helper functions and data for use elsewhere
export {
  mockWallets,
  expenseCategories,
  incomeCategories,
  findExpense,
  findIncome,
  generateMockTransactions,
};

// Statistics for verification
const stats = {
  total: mockTransactions.length,
  expenses: mockTransactions.filter((t) => t.type === 'expense').length,
  incomes: mockTransactions.filter((t) => t.type === 'income').length,
  totalExpenseAmount: mockTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0),
  totalIncomeAmount: mockTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0),
  dateRange: {
    oldest: mockTransactions[mockTransactions.length - 1]?.date,
    newest: mockTransactions[0]?.date,
  },
};

console.log('Mock Transactions Generated:');
console.log('============================');
console.log(`Total: ${stats.total.toLocaleString()} transactions`);
console.log(`Expenses: ${stats.expenses.toLocaleString()} (${((stats.expenses / stats.total) * 100).toFixed(1)}%)`);
console.log(`Incomes: ${stats.incomes.toLocaleString()} (${((stats.incomes / stats.total) * 100).toFixed(1)}%)`);
console.log(`Total Expense: ฿${stats.totalExpenseAmount.toLocaleString()}`);
console.log(`Total Income: ฿${stats.totalIncomeAmount.toLocaleString()}`);
console.log(`Date Range: ${stats.dateRange.oldest?.toLocaleDateString('th-TH')} - ${stats.dateRange.newest?.toLocaleDateString('th-TH')}`);

// Sample output
console.log('\nSample Transactions (first 5):');
mockTransactions.slice(0, 5).forEach((t, i) => {
  console.log(`${i + 1}. ${t.id} | ${t.type} | ฿${t.amount.toLocaleString()} | ${t.note} | ${t.date.toLocaleDateString('th-TH')}`);
});
