# ความสัมพันธ์ระหว่าง Store Files กับการบันทึกข้อมูลลง Database

## ภาพรวม

ระบบใช้ **Zustand** สำหรับ state management และ **Dexie (IndexedDB)** สำหรับการเก็บข้อมูลถาวร โดยมี 4 store files หลักที่ทำงานร่วมกัน:

1. `wallet-store.ts` - จัดการข้อมูล Wallet (กระเป๋าเงิน)
2. `category-store.ts` - จัดการข้อมูล Category (หมวดหมู่รายรับ/รายจ่าย)
3. `transaction-store.ts` - จัดการข้อมูล Transaction (รายการรายรับ/รายจ่าย)
4. `analysis-store.ts` - จัดการข้อมูล Analysis (วิเคราะห์รายการที่ซ้ำกัน) **[NEW in V4]**

---

## Database Schema (db.ts)

### Tables ที่ใช้

```typescript
// IndexedDB Tables (Version 4)
- transactions: 'id, walletId, categoryId, type, date, createdAt'
- categories: 'id, type, order'
- wallets: 'id, type'
- analysis: 'id, walletId, type, categoryId, amount, note, matchType, count, lastTransactionId, updatedAt'  // NEW
```

### Database Version Migration

```typescript
import Dexie, { Table } from 'dexie';

// Types
export interface StoredTransaction {
  id: string;
  walletId: string;
  categoryId: string;
  type: 'income' | 'expense';
  amount: number;
  note?: string;
  date: string; // ISO string
  createdAt: string; // ISO string
}

export interface StoredCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  order: number;
}

export interface StoredWallet {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'savings';
  balance?: number;
}

// NEW: Analysis Types
export type MatchType = 'basic' | 'full';

export interface StoredAnalysis {
  id: string;                    // Unique ID สำหรับ analysis record
  walletId: string;              // FK → Wallet (แยกตาม wallet)
  type: 'income' | 'expense';    // แยกตามประเภท
  categoryId: string;            // FK → Category
  amount: number;                // จำนวนเงิน
  note?: string;                 // หมายเหตุ (สำหรับ matchType = 'full')
  matchType: MatchType;          // ประเภทการ match
  count: number;                 // จำนวนครั้งที่ซ้ำ
  lastTransactionId: string;     // ID ของ transaction ล่าสุดที่ match
  createdAt: string;             // ISO string
  updatedAt: string;             // ISO string
}

class ExpenseTrackerDB extends Dexie {
  transactions!: Table<StoredTransaction>;
  categories!: Table<StoredCategory>;
  wallets!: Table<StoredWallet>;
  analysis!: Table<StoredAnalysis>;

  constructor() {
    super('ExpenseTrackerDB');

    // Version 1-3: Original schema
    this.version(1).stores({
      transactions: 'id, walletId, categoryId, type, date, createdAt',
      categories: 'id, type, order',
      wallets: 'id, type',
    });

    this.version(2).stores({
      transactions: 'id, walletId, categoryId, type, date, createdAt',
      categories: 'id, type, order',
      wallets: 'id, type',
    });

    this.version(3).stores({
      transactions: 'id, walletId, categoryId, type, date, createdAt',
      categories: 'id, type, order',
      wallets: 'id, type',
    });

    // Version 4: เพิ่ม analysis table สำหรับวิเคราะห์ข้อมูลซ้ำ
    this.version(4).stores({
      transactions: 'id, walletId, categoryId, type, date, createdAt',
      categories: 'id, type, order',
      wallets: 'id, type',
      analysis: 'id, walletId, type, categoryId, amount, note, matchType, count, lastTransactionId, updatedAt',
    });
  }
}

export const db = new ExpenseTrackerDB();
```

### Data Converters

แต่ละ store ใช้ converter functions เพื่อแปลงข้อมูลระหว่าง Runtime (Date objects) และ Stored format (ISO strings):

- **Transaction**: `toStoredTransaction()` / `fromStoredTransaction()`
- **Category**: `toStoredCategory()` / `fromStoredCategory()`
- **Wallet**: `toStoredWallet()` / `fromStoredWallet()`
- **Analysis**: `toStoredAnalysis()` / `fromStoredAnalysis()` **[NEW]**

```typescript
// NEW: Analysis Converters
export interface Analysis {
  id: string;
  walletId: string;
  type: 'income' | 'expense';
  categoryId: string;
  amount: number;
  note?: string;
  matchType: MatchType;
  count: number;
  lastTransactionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const toStoredAnalysis = (analysis: Analysis): StoredAnalysis => ({
  ...analysis,
  createdAt: analysis.createdAt.toISOString(),
  updatedAt: analysis.updatedAt.toISOString(),
});

export const fromStoredAnalysis = (stored: StoredAnalysis): Analysis => ({
  ...stored,
  createdAt: new Date(stored.createdAt),
  updatedAt: new Date(stored.updatedAt),
});
```

---

## 1. Wallet Store (`wallet-store.ts`)

### หน้าที่
จัดการข้อมูล Wallet (กระเป๋าเงิน) เช่น เงินสด, บัญชีธนาคาร, บัตรเครดิต

### Database Operations

| Operation | Method | DB Action | Description |
|-----------|--------|-----------|-------------|
| **Load** | `loadWallets()` | `db.wallets.toArray()` | โหลดข้อมูลทั้งหมดจาก DB |
| **Add** | `addWallet()` | `db.wallets.put()` | เพิ่ม wallet ใหม่ |
| **Update** | `updateWallet()` | `db.wallets.put()` | อัปเดตข้อมูล wallet |
| **Delete** | `deleteWallet()` | `db.wallets.delete()` | ลบ wallet |

### การทำงาน
- **Optimistic Update**: อัปเดต Zustand state ก่อน แล้วค่อยบันทึกลง DB
- **First Load**: ถ้ายังไม่มีข้อมูล จะ seed ด้วย mock data
- **Error Handling**: จัดการ error แบบ graceful (ไม่ crash app)

### ตัวอย่างโค้ด
```typescript
addWallet: async (walletData) => {
  // 1. สร้าง wallet object พร้อม id และ createdAt
  const newWallet: Wallet = {
    ...walletData,
    id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: now,
  };

  // 2. อัปเดต Zustand state ทันที (Optimistic Update)
  const newWallets = [...get().wallets, newWallet];
  set({ wallets: newWallets });

  // 3. บันทึกลง IndexedDB (async, non-blocking)
  try {
    await db.wallets.put(toStoredWallet(newWallet));
  } catch (error) {
    console.error('Failed to add wallet:', error);
  }
}
```

---

## 2. Category Store (`category-store.ts`)

### หน้าที่
จัดการข้อมูล Category (หมวดหมู่) สำหรับรายรับและรายจ่าย

### Database Operations

| Operation | Method | DB Action | Description |
|-----------|--------|-----------|-------------|
| **Load** | `loadCategories()` | `db.categories.toArray()` | โหลดข้อมูลทั้งหมดจาก DB |
| **Add** | `addCategory()` | `db.categories.put()` | เพิ่ม category ใหม่ |
| **Delete** | `deleteCategory()` | `db.categories.delete()` | ลบ category |
| **Reorder** | `reorderCategories()` | `db.categories.bulkPut()` | อัปเดตลำดับ category |

### การทำงาน
- **Enrichment**: ข้อมูลที่เก็บใน DB มีแค่ `name`, `type`, `order`, `icon` แต่เมื่อโหลดจะ enrich ด้วย `icon` และ `color` จาก constants
- **Separation**: แยกเป็น `expenseCategories` และ `incomeCategories` ใน state
- **Order Management**: รองรับการเรียงลำดับ category ด้วย field `order`

### ตัวอย่างโค้ด
```typescript
loadCategories: async () => {
  const storedCategories = await db.categories.toArray();

  if (storedCategories.length === 0) {
    // Seed with default categories
    await db.categories.bulkPut(
      allDefaultCategories.map(toStoredCategory)
    );
  } else {
    // Convert และ enrich ด้วย icon/color
    const categories = storedCategories
      .map(fromStoredCategory)
      .map(enrichCategory); // เพิ่ม icon/color จาก constants
  }
}
```

---

## 3. Transaction Store (`transaction-store.ts`)

### หน้าที่
จัดการข้อมูล Transaction (รายการรายรับ/รายจ่าย) ซึ่งเป็นข้อมูลหลักของแอป

### Database Operations

| Operation | Method | DB Action | Description |
|-----------|--------|-----------|-------------|
| **Load** | `loadTransactions()` | `db.transactions.orderBy('date').reverse().toArray()` | โหลดข้อมูลทั้งหมดจาก DB |
| **Add** | `addTransaction()` | `db.transactions.put()` + **`updateAnalysis()`** | เพิ่ม transaction ใหม่ + อัปเดต analysis |
| **Update** | `updateTransaction()` | `db.transactions.put()` | อัปเดต transaction |
| **Delete** | `deleteTransaction()` | `db.transactions.delete()` | ลบ transaction |

### การทำงานใหม่ (Version 4)
- **Dependency**: ต้องโหลด categories ก่อน เพราะ transaction ต้องมี category
- **Join Data**: เมื่อโหลด transaction จะ join กับ category เพื่อสร้าง `TransactionWithCategory`
- **Computed Values**: คำนวณ `dailySummaries`, `monthlySummary`, `walletBalances` อัตโนมัติ
- **Filtering**: รองรับการกรองตาม month, day, wallet
- **🆕 Analysis Integration**: เมื่อบันทึก transaction ใหม่ จะตรวจสอบและอัปเดต analysis อัตโนมัติ

### ตัวอย่างโค้ด (Updated for V4)
```typescript
addTransaction: async (transactionData) => {
  const now = new Date();
  const newTransaction: Transaction = {
    ...transactionData,
    id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: now,
  };

  // 1. อัปเดต Zustand state ทันที (Optimistic Update)
  const { transactions } = get();
  const newTransactions = [newTransaction, ...transactions];
  set({ transactions: newTransactions });

  // 2. บันทึกลง IndexedDB
  try {
    await db.transactions.put(toStoredTransaction(newTransaction));
    
    // 🆕 3. อัปเดต Analysis สำหรับ duplicate detection
    const analysisStore = useAnalysisStore.getState();
    await analysisStore.updateAnalysisOnNewTransaction(newTransaction);
    
  } catch (error) {
    console.error('Failed to add transaction:', error);
  }

  // 4. อัปเดต computed values
  recomputeValues();
}
```

---

## 4. Analysis Store (`analysis-store.ts`) **[NEW in V4]**

### หน้าที่
วิเคราะห์และติดตาม transactions ที่มีรูปแบบซ้ำกัน เพื่อช่วยให้ผู้ใช้เห็น patterns การใช้จ่าย

### Match Types (ประเภทการตรวจสอบซ้ำ)

| Match Type | Keys ที่ใช้ตรวจสอบ | Description |
|------------|-------------------|-------------|
| **basic** | `walletId` + `type` + `categoryId` + `amount` | ตรวจสอบซ้ำจาก 4 fields หลัก |
| **full** | `walletId` + `type` + `categoryId` + `amount` + `note` | ตรวจสอบซ้ำรวม note ด้วย |

### การแยกข้อมูล

ข้อมูล Analysis จะถูกแยกตาม:
1. **walletId** - แยกตามกระเป๋าเงิน
2. **type** - แยกตามประเภท (income/expense)

### Database Operations

| Operation | Method | DB Action | Description |
|-----------|--------|-----------|-------------|
| **Load** | `loadAnalysis()` | `db.analysis.toArray()` | โหลดข้อมูลทั้งหมดจาก DB |
| **Update** | `updateAnalysisOnNewTransaction()` | `db.analysis.put()` | อัปเดตเมื่อมี transaction ใหม่ |
| **Get By Wallet** | `getAnalysisByWallet()` | `db.analysis.where('walletId').equals()` | ดึงข้อมูลตาม wallet |
| **Get By Type** | `getAnalysisByType()` | `db.analysis.where('type').equals()` | ดึงข้อมูลตาม type |
| **Clear** | `clearAnalysis()` | `db.analysis.clear()` | ล้างข้อมูลทั้งหมด |
| **Rebuild** | `rebuildAnalysis()` | `db.analysis.clear()` + rebuild | สร้างใหม่จาก transactions ทั้งหมด |

### Types และ Interfaces

```typescript
import { create } from 'zustand';
import { db, StoredAnalysis, toStoredAnalysis, fromStoredAnalysis, MatchType } from '@/lib/db';

export interface Analysis {
  id: string;
  walletId: string;
  type: 'income' | 'expense';
  categoryId: string;
  amount: number;
  note?: string;
  matchType: MatchType;
  count: number;
  lastTransactionId: string;
  createdAt: Date;
  updatedAt: Date;
}

// สำหรับ UI display
export interface AnalysisWithCategory extends Analysis {
  category: Category;
  wallet: Wallet;
}

// State type
interface AnalysisState {
  // State
  analysisRecords: Analysis[];
  isInitialized: boolean;
  isLoading: boolean;
  
  // Computed getters
  getAnalysisByWallet: (walletId: string) => Analysis[];
  getAnalysisByType: (type: 'income' | 'expense') => Analysis[];
  getAnalysisByWalletAndType: (walletId: string, type: 'income' | 'expense') => Analysis[];
  getTopDuplicates: (limit?: number) => Analysis[];
  
  // Actions
  loadAnalysis: () => Promise<void>;
  updateAnalysisOnNewTransaction: (transaction: Transaction) => Promise<void>;
  clearAnalysis: () => Promise<void>;
  rebuildAnalysis: () => Promise<void>;
}
```

### Store Implementation

```typescript
export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  // Initial State
  analysisRecords: [],
  isInitialized: false,
  isLoading: false,

  // ============================================
  // COMPUTED GETTERS
  // ============================================

  /**
   * ดึง analysis records ตาม walletId
   */
  getAnalysisByWallet: (walletId: string) => {
    return get().analysisRecords.filter((a) => a.walletId === walletId);
  },

  /**
   * ดึง analysis records ตาม type (income/expense)
   */
  getAnalysisByType: (type: 'income' | 'expense') => {
    return get().analysisRecords.filter((a) => a.type === type);
  },

  /**
   * ดึง analysis records ตาม walletId และ type
   */
  getAnalysisByWalletAndType: (walletId: string, type: 'income' | 'expense') => {
    return get().analysisRecords.filter(
      (a) => a.walletId === walletId && a.type === type
    );
  },

  /**
   * ดึง top duplicates เรียงตาม count มากสุด
   */
  getTopDuplicates: (limit = 10) => {
    return [...get().analysisRecords]
      .filter((a) => a.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * โหลด analysis records จาก IndexedDB
   */
  loadAnalysis: async () => {
    if (get().isInitialized || get().isLoading) return;

    set({ isLoading: true });

    try {
      const storedAnalysis = await db.analysis.toArray();
      const analysisRecords = storedAnalysis.map(fromStoredAnalysis);

      set({
        analysisRecords,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load analysis:', error);
      set({ isLoading: false });
    }
  },

  /**
   * อัปเดต analysis เมื่อมี transaction ใหม่
   * - ตรวจสอบ basic match (walletId + type + categoryId + amount)
   * - ตรวจสอบ full match (basic + note)
   */
  updateAnalysisOnNewTransaction: async (transaction: Transaction) => {
    const now = new Date();
    const { analysisRecords } = get();

    try {
      // ============================================
      // 1. Basic Match: walletId + type + categoryId + amount
      // ============================================
      const basicMatchKey = generateBasicMatchKey(transaction);
      let basicAnalysis = analysisRecords.find(
        (a) =>
          a.matchType === 'basic' &&
          a.walletId === transaction.walletId &&
          a.type === transaction.type &&
          a.categoryId === transaction.categoryId &&
          a.amount === transaction.amount
      );

      if (basicAnalysis) {
        // มีอยู่แล้ว → เพิ่ม count
        const updatedBasic: Analysis = {
          ...basicAnalysis,
          count: basicAnalysis.count + 1,
          lastTransactionId: transaction.id,
          updatedAt: now,
        };
        await db.analysis.put(toStoredAnalysis(updatedBasic));
        
        // อัปเดต state
        set({
          analysisRecords: analysisRecords.map((a) =>
            a.id === basicAnalysis!.id ? updatedBasic : a
          ),
        });
      } else {
        // ยังไม่มี → สร้างใหม่ (count = 1)
        const newBasicAnalysis: Analysis = {
          id: `a-basic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          walletId: transaction.walletId,
          type: transaction.type,
          categoryId: transaction.categoryId,
          amount: transaction.amount,
          matchType: 'basic',
          count: 1,
          lastTransactionId: transaction.id,
          createdAt: now,
          updatedAt: now,
        };
        await db.analysis.put(toStoredAnalysis(newBasicAnalysis));
        
        set({
          analysisRecords: [...analysisRecords, newBasicAnalysis],
        });
      }

      // ============================================
      // 2. Full Match: walletId + type + categoryId + amount + note
      // ============================================
      if (transaction.note && transaction.note.trim() !== '') {
        const currentRecords = get().analysisRecords;
        let fullAnalysis = currentRecords.find(
          (a) =>
            a.matchType === 'full' &&
            a.walletId === transaction.walletId &&
            a.type === transaction.type &&
            a.categoryId === transaction.categoryId &&
            a.amount === transaction.amount &&
            a.note === transaction.note
        );

        if (fullAnalysis) {
          // มีอยู่แล้ว → เพิ่ม count
          const updatedFull: Analysis = {
            ...fullAnalysis,
            count: fullAnalysis.count + 1,
            lastTransactionId: transaction.id,
            updatedAt: now,
          };
          await db.analysis.put(toStoredAnalysis(updatedFull));
          
          set({
            analysisRecords: currentRecords.map((a) =>
              a.id === fullAnalysis!.id ? updatedFull : a
            ),
          });
        } else {
          // ยังไม่มี → สร้างใหม่ (count = 1)
          const newFullAnalysis: Analysis = {
            id: `a-full-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            walletId: transaction.walletId,
            type: transaction.type,
            categoryId: transaction.categoryId,
            amount: transaction.amount,
            note: transaction.note,
            matchType: 'full',
            count: 1,
            lastTransactionId: transaction.id,
            createdAt: now,
            updatedAt: now,
          };
          await db.analysis.put(toStoredAnalysis(newFullAnalysis));
          
          set({
            analysisRecords: [...currentRecords, newFullAnalysis],
          });
        }
      }
    } catch (error) {
      console.error('Failed to update analysis:', error);
    }
  },

  /**
   * ล้าง analysis ทั้งหมด
   */
  clearAnalysis: async () => {
    try {
      await db.analysis.clear();
      set({ analysisRecords: [], isInitialized: false });
    } catch (error) {
      console.error('Failed to clear analysis:', error);
    }
  },

  /**
   * สร้าง analysis ใหม่จาก transactions ทั้งหมด
   */
  rebuildAnalysis: async () => {
    set({ isLoading: true });

    try {
      // 1. ล้าง analysis เดิม
      await db.analysis.clear();

      // 2. โหลด transactions ทั้งหมด
      const transactions = await db.transactions.toArray();

      // 3. สร้าง maps สำหรับนับ
      const basicMap = new Map<string, Analysis>();
      const fullMap = new Map<string, Analysis>();
      const now = new Date();

      for (const storedTx of transactions) {
        // Basic Match Key
        const basicKey = `${storedTx.walletId}|${storedTx.type}|${storedTx.categoryId}|${storedTx.amount}`;
        
        if (basicMap.has(basicKey)) {
          const existing = basicMap.get(basicKey)!;
          existing.count += 1;
          existing.lastTransactionId = storedTx.id;
          existing.updatedAt = now;
        } else {
          basicMap.set(basicKey, {
            id: `a-basic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            walletId: storedTx.walletId,
            type: storedTx.type,
            categoryId: storedTx.categoryId,
            amount: storedTx.amount,
            matchType: 'basic',
            count: 1,
            lastTransactionId: storedTx.id,
            createdAt: now,
            updatedAt: now,
          });
        }

        // Full Match Key (only if note exists)
        if (storedTx.note && storedTx.note.trim() !== '') {
          const fullKey = `${basicKey}|${storedTx.note}`;
          
          if (fullMap.has(fullKey)) {
            const existing = fullMap.get(fullKey)!;
            existing.count += 1;
            existing.lastTransactionId = storedTx.id;
            existing.updatedAt = now;
          } else {
            fullMap.set(fullKey, {
              id: `a-full-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              walletId: storedTx.walletId,
              type: storedTx.type,
              categoryId: storedTx.categoryId,
              amount: storedTx.amount,
              note: storedTx.note,
              matchType: 'full',
              count: 1,
              lastTransactionId: storedTx.id,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      }

      // 4. บันทึกลง DB
      const allAnalysis = [...basicMap.values(), ...fullMap.values()];
      await db.analysis.bulkPut(allAnalysis.map(toStoredAnalysis));

      // 5. อัปเดต state
      set({
        analysisRecords: allAnalysis,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to rebuild analysis:', error);
      set({ isLoading: false });
    }
  },
}));

// Helper function
function generateBasicMatchKey(tx: Transaction): string {
  return `${tx.walletId}|${tx.type}|${tx.categoryId}|${tx.amount}`;
}
```

---

## ความสัมพันธ์ระหว่าง Stores (Updated for V4)

### 1. Transaction → Category (Foreign Key)

```typescript
// Transaction มี categoryId ที่อ้างอิงไปยัง Category
interface Transaction {
  categoryId: string; // Foreign key to Category
  // ...
}
```

### 2. Transaction → Wallet (Foreign Key)

```typescript
// Transaction มี walletId ที่อ้างอิงไปยัง Wallet
interface Transaction {
  walletId: string; // Foreign key to Wallet
  // ...
}
```

### 3. Analysis → Category, Wallet, Transaction (Foreign Keys) **[NEW]**

```typescript
// Analysis มี foreign keys ไปยัง Category, Wallet และ Transaction
interface Analysis {
  walletId: string;           // FK → Wallet
  categoryId: string;         // FK → Category
  lastTransactionId: string;  // FK → Transaction (ล่าสุดที่ match)
  // ...
}
```

### 4. Load Order Dependency (Updated)

```
┌─────────────────┐         ┌─────────────────┐
│ Category Store  │         │  Wallet Store   │
│ (ไม่มี dependency)│         │ (ไม่มี dependency)│
└────────┬────────┘         └────────┬────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────────────────────────────────┐
│            Transaction Store                │
│   (ต้องใช้ category + wallet)               │
└─────────────────────┬───────────────────────┘
                      │
                      │ triggers
                      ▼
┌─────────────────────────────────────────────┐
│            Analysis Store [NEW]             │
│   (อัปเดตเมื่อมี transaction ใหม่)            │
└─────────────────────────────────────────────┘
```

---

## Data Flow: เมื่อบันทึก Transaction ใหม่

```
┌──────────────────────────────────────────────────────────────┐
│                    User บันทึก Transaction                    │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ 1. Transaction Store: addTransaction()                       │
│    - สร้าง transaction object                                 │
│    - Optimistic update to Zustand state                      │
│    - บันทึกลง db.transactions                                 │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Analysis Store: updateAnalysisOnNewTransaction()          │
│    ┌────────────────────────────────────────────────────────┐│
│    │ 2.1 Basic Match Check                                  ││
│    │     Key: walletId + type + categoryId + amount         ││
│    │     - ถ้ามีอยู่แล้ว → count++                            ││
│    │     - ถ้ายังไม่มี → สร้างใหม่ count=1                    ││
│    └────────────────────────────────────────────────────────┘│
│    ┌────────────────────────────────────────────────────────┐│
│    │ 2.2 Full Match Check (if note exists)                  ││
│    │     Key: walletId + type + categoryId + amount + note  ││
│    │     - ถ้ามีอยู่แล้ว → count++                            ││
│    │     - ถ้ายังไม่มี → สร้างใหม่ count=1                    ││
│    └────────────────────────────────────────────────────────┘│
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. บันทึกลง db.analysis                                       │
│    - อัปเดต/เพิ่ม basic analysis record                       │
│    - อัปเดต/เพิ่ม full analysis record (if applicable)        │
└──────────────────────────────────────────────────────────────┘
```

---

## Entity Relationship Diagram (Updated for V4)

```
┌─────────────┐                     ┌──────────────┐
│   Wallet    │                     │   Category   │
│             │                     │              │
│ - id (PK)   │                     │ - id (PK)    │
│ - name      │                     │ - name       │
│ - type      │                     │ - type       │
│ - ...       │                     │ - order      │
└──────┬──────┘                     └──────┬───────┘
       │                                    │
       │ walletId                           │ categoryId
       │     ┌──────────────────────────────┘
       │     │
       ▼     ▼
┌─────────────────────────────────────┐
│          Transaction                │
│                                     │
│ - id (PK)                           │
│ - walletId  (FK → Wallet)          │
│ - categoryId (FK → Category)        │
│ - type                              │
│ - amount                            │
│ - note                              │
│ - date                              │
│ - createdAt                         │
└──────────────┬──────────────────────┘
               │
               │ triggers update
               ▼
┌─────────────────────────────────────┐
│          Analysis [NEW]             │
│                                     │
│ - id (PK)                           │
│ - walletId  (FK → Wallet)          │
│ - categoryId (FK → Category)        │
│ - type                              │
│ - amount                            │
│ - note (nullable)                   │
│ - matchType ('basic' | 'full')      │
│ - count                             │
│ - lastTransactionId (FK → Tx)       │
│ - createdAt                         │
│ - updatedAt                         │
└─────────────────────────────────────┘
```

---

## ตัวอย่างข้อมูล Analysis

### Scenario: บันทึก Transaction ซ้ำ

สมมติมี transactions ดังนี้:

| ID | Wallet | Type | Category | Amount | Note |
|----|--------|------|----------|--------|------|
| t1 | w1 (เงินสด) | expense | c1 (อาหาร) | 100 | ข้าวมันไก่ |
| t2 | w1 (เงินสด) | expense | c1 (อาหาร) | 100 | ข้าวมันไก่ |
| t3 | w1 (เงินสด) | expense | c1 (อาหาร) | 100 | ก๋วยเตี๋ยว |
| t4 | w2 (บัญชี) | expense | c1 (อาหาร) | 100 | ข้าวมันไก่ |

### ผลลัพธ์ใน Analysis Table:

**Basic Match Records:**

| ID | Wallet | Type | Category | Amount | MatchType | Count |
|----|--------|------|----------|--------|-----------|-------|
| a1 | w1 | expense | c1 | 100 | basic | 3 | (t1, t2, t3 match) |
| a2 | w2 | expense | c1 | 100 | basic | 1 | (t4) |

**Full Match Records:**

| ID | Wallet | Type | Category | Amount | Note | MatchType | Count |
|----|--------|------|----------|--------|------|-----------|-------|
| a3 | w1 | expense | c1 | 100 | ข้าวมันไก่ | full | 2 | (t1, t2 match) |
| a4 | w1 | expense | c1 | 100 | ก๋วยเตี๋ยว | full | 1 | (t3) |
| a5 | w2 | expense | c1 | 100 | ข้าวมันไก่ | full | 1 | (t4) |

---

## การใช้งาน Analysis ใน UI

### 1. แสดง Quick Actions (รายการที่ใช้บ่อย)

```tsx
function QuickActions() {
  const { getTopDuplicates } = useAnalysisStore();
  const topDuplicates = getTopDuplicates(5);

  return (
    <div className="quick-actions">
      <h3>รายการที่ใช้บ่อย</h3>
      {topDuplicates.map((analysis) => (
        <QuickActionButton
          key={analysis.id}
          categoryId={analysis.categoryId}
          amount={analysis.amount}
          note={analysis.note}
          usageCount={analysis.count}
          onClick={() => prefillTransaction(analysis)}
        />
      ))}
    </div>
  );
}
```

### 2. แสดงสถิติตาม Wallet

```tsx
function WalletAnalytics({ walletId }: { walletId: string }) {
  const { getAnalysisByWallet } = useAnalysisStore();
  const walletAnalysis = getAnalysisByWallet(walletId);

  const expensePatterns = walletAnalysis.filter((a) => a.type === 'expense');
  const incomePatterns = walletAnalysis.filter((a) => a.type === 'income');

  return (
    <div>
      <h3>รูปแบบการใช้จ่าย</h3>
      <p>พบ {expensePatterns.length} รูปแบบรายจ่าย</p>
      <p>พบ {incomePatterns.length} รูปแบบรายรับ</p>
    </div>
  );
}
```

---

## Best Practices ที่ใช้ในโค้ด

### ✅ Do's

1. **Always use converters** (`toStored*` / `fromStored*`)
2. **Check dependencies** ก่อนโหลด (เช่น transaction ต้อง check category)
3. **Optimistic updates** สำหรับ UX ที่ดี
4. **Error handling** ทุก DB operation
5. **Prevent duplicate loads** ด้วย `isInitialized` flag
6. **🆕 Update analysis** ทุกครั้งที่มี transaction ใหม่
7. **🆕 แยก analysis ตาม walletId และ type** เพื่อความแม่นยำ

### ❌ Don'ts

1. **Don't store Date objects** โดยตรงใน IndexedDB
2. **Don't load transactions** ก่อน categories
3. **Don't delete** category/wallet ที่มี transaction ใช้งาน
4. **Don't forget** to update computed values หลัง CRUD operations
5. **🆕 Don't skip analysis update** เมื่อบันทึก transaction

---

## Migration Guide: V3 → V4

เมื่อ upgrade จาก V3 เป็น V4:

1. **Database migration**: Dexie จะสร้าง `analysis` table อัตโนมัติ
2. **Rebuild analysis**: ควรเรียก `rebuildAnalysis()` หลัง upgrade เพื่อสร้าง analysis จาก transactions ที่มีอยู่

```typescript
// ใน app initialization
useEffect(() => {
  const initApp = async () => {
    await useCategoryStore.getState().loadCategories();
    await useWalletStore.getState().loadWallets();
    await useTransactionStore.getState().loadTransactions();
    
    // Check if analysis needs rebuild (first time V4)
    const analysisStore = useAnalysisStore.getState();
    await analysisStore.loadAnalysis();
    
    if (analysisStore.analysisRecords.length === 0) {
      // First time V4 - rebuild from existing transactions
      await analysisStore.rebuildAnalysis();
    }
  };
  
  initApp();
}, []);
```

---

## หมายเหตุ

- ระบบใช้ **IndexedDB** ผ่าน **Dexie** สำหรับ offline-first app
- **Zustand** ใช้สำหรับ client-side state management
- **Data sync**: ข้อมูล sync ระหว่าง Zustand state และ IndexedDB ทุกครั้งที่มีการเปลี่ยนแปลง
- **Migration**: DB schema มี versioning (v1, v2, v3, **v4**) สำหรับรองรับการเปลี่ยนแปลงในอนาคต
- **🆕 Analysis**: เป็น derived data ที่สามารถ rebuild ได้จาก transactions เสมอ
