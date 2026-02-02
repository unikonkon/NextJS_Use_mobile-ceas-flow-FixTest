# ความสัมพันธ์ระหว่าง Store Files กับการบันทึกข้อมูลลง Database

## ภาพรวม

ระบบใช้ **Zustand** สำหรับ state management และ **Dexie (IndexedDB)** สำหรับการเก็บข้อมูลถาวร โดยมี 4 store files หลักที่ทำงานร่วมกัน:

1. `wallet-store.ts` - จัดการข้อมูล Wallet (กระเป๋าเงิน)
2. `category-store.ts` - จัดการข้อมูล Category (หมวดหมู่รายรับ/รายจ่าย)
3. `transaction-store.ts` - จัดการข้อมูล Transaction (รายการรายรับ/รายจ่าย)
4. `analysis-store.ts` - จัดการข้อมูล Analysis (วิเคราะห์รายการที่ซ้ำกัน)

---

## Database Schema (db.ts)

### Tables ที่ใช้

```typescript
// IndexedDB Tables (Version 5)
- transactions: 'id, walletId, categoryId, type, date, createdAt'
- categories: 'id, type, order'
- wallets: 'id, type'
- analysis: 'id, walletId, type, categoryId, amount, note, matchType, count, lastTransactionId, updatedAt'
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

// 🆕 V5: เพิ่ม notes array สำหรับเก็บ notes ที่เคยใช้กับ category นี้
export interface StoredCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  order: number;
  notes: string[];  // 🆕 V5: Array ของ notes ที่เคยใช้กับ category นี้
}

export interface StoredWallet {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'savings';
  balance?: number;
}

// Analysis Types
export type MatchType = 'basic' | 'full';

export interface StoredAnalysis {
  id: string;
  walletId: string;
  type: 'income' | 'expense';
  categoryId: string;
  amount: number;
  note?: string;
  matchType: MatchType;
  count: number;
  lastTransactionId: string;
  createdAt: string;
  updatedAt: string;
}

class ExpenseTrackerDB extends Dexie {
  transactions!: Table<StoredTransaction>;
  categories!: Table<StoredCategory>;
  wallets!: Table<StoredWallet>;
  analysis!: Table<StoredAnalysis>;

  constructor() {
    super('ExpenseTrackerDB');

    // Version 1-4: Previous schemas
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

    this.version(4).stores({
      transactions: 'id, walletId, categoryId, type, date, createdAt',
      categories: 'id, type, order',
      wallets: 'id, type',
      analysis: 'id, walletId, type, categoryId, amount, note, matchType, count, lastTransactionId, updatedAt',
    });

    // 🆕 Version 5: เพิ่ม notes array ใน categories
    this.version(5)
      .stores({
        transactions: 'id, walletId, categoryId, type, date, createdAt',
        categories: 'id, type, order',
        wallets: 'id, type',
        analysis: 'id, walletId, type, categoryId, amount, note, matchType, count, lastTransactionId, updatedAt',
      })
      .upgrade(async (tx) => {
        // Migration: เพิ่ม notes array ให้ categories ที่มีอยู่
        await tx.table('categories').toCollection().modify((category) => {
          if (!category.notes) {
            category.notes = [];
          }
        });
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
- **Analysis**: `toStoredAnalysis()` / `fromStoredAnalysis()`

```typescript
// 🆕 V5: Category Type with notes array
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  order: number;
  notes: string[];  // 🆕 Array ของ notes ที่เคยใช้
}

export const toStoredCategory = (category: Category): StoredCategory => ({
  id: category.id,
  name: category.name,
  type: category.type,
  icon: category.icon,
  order: category.order,
  notes: category.notes || [],
});

export const fromStoredCategory = (stored: StoredCategory): Category => ({
  id: stored.id,
  name: stored.name,
  type: stored.type,
  icon: stored.icon,
  order: stored.order,
  notes: stored.notes || [],
});

// Analysis Converters
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
จัดการข้อมูล Category (หมวดหมู่) สำหรับรายรับและรายจ่าย **รวมถึงเก็บ notes ที่เคยใช้กับแต่ละ category**

### Database Operations

| Operation | Method | DB Action | Description |
|-----------|--------|-----------|-------------|
| **Load** | `loadCategories()` | `db.categories.toArray()` | โหลดข้อมูลทั้งหมดจาก DB |
| **Add** | `addCategory()` | `db.categories.put()` | เพิ่ม category ใหม่ |
| **Delete** | `deleteCategory()` | `db.categories.delete()` | ลบ category |
| **Reorder** | `reorderCategories()` | `db.categories.bulkPut()` | อัปเดตลำดับ category |
| **🆕 Add Note** | `addNoteToCategory()` | `db.categories.put()` | เพิ่ม note ใหม่ให้ category |

### 🆕 Types และ Interfaces (V5)

```typescript
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color?: string;
  order: number;
  notes: string[];  // 🆕 Array ของ notes ที่เคยใช้กับ category นี้
}

interface CategoryState {
  // State
  expenseCategories: Category[];
  incomeCategories: Category[];
  isInitialized: boolean;
  isLoading: boolean;

  // Actions
  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'order' | 'notes'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (type: 'income' | 'expense', newOrder: string[]) => Promise<void>;
  
  // 🆕 V5: Note Management
  addNoteToCategory: (categoryId: string, note: string) => Promise<void>;
  getNotesForCategory: (categoryId: string) => string[];
  removeNoteFromCategory: (categoryId: string, note: string) => Promise<void>;
}
```

### 🆕 Store Implementation (V5)

```typescript
export const useCategoryStore = create<CategoryState>((set, get) => ({
  // Initial State
  expenseCategories: [],
  incomeCategories: [],
  isInitialized: false,
  isLoading: false,

  // ... existing methods ...

  /**
   * 🆕 V5: เพิ่ม note ใหม่ให้ category
   * - ตรวจสอบว่า note ยังไม่มีใน array
   * - จำกัดจำนวน notes สูงสุด (optional)
   */
  addNoteToCategory: async (categoryId: string, note: string) => {
    if (!note || note.trim() === '') return;

    const trimmedNote = note.trim();
    const { expenseCategories, incomeCategories } = get();
    
    // หา category จาก state
    let category = expenseCategories.find((c) => c.id === categoryId);
    let isExpense = true;
    
    if (!category) {
      category = incomeCategories.find((c) => c.id === categoryId);
      isExpense = false;
    }

    if (!category) {
      console.error('Category not found:', categoryId);
      return;
    }

    // ตรวจสอบว่า note มีอยู่แล้วหรือไม่
    if (category.notes.includes(trimmedNote)) {
      return; // note มีอยู่แล้ว ไม่ต้องเพิ่ม
    }

    // สร้าง category ใหม่พร้อม note ที่เพิ่ม
    const updatedCategory: Category = {
      ...category,
      notes: [...category.notes, trimmedNote],
    };

    // จำกัดจำนวน notes สูงสุด 50 รายการ (FIFO)
    const MAX_NOTES = 50;
    if (updatedCategory.notes.length > MAX_NOTES) {
      updatedCategory.notes = updatedCategory.notes.slice(-MAX_NOTES);
    }

    // อัปเดต Zustand state
    if (isExpense) {
      set({
        expenseCategories: expenseCategories.map((c) =>
          c.id === categoryId ? updatedCategory : c
        ),
      });
    } else {
      set({
        incomeCategories: incomeCategories.map((c) =>
          c.id === categoryId ? updatedCategory : c
        ),
      });
    }

    // บันทึกลง IndexedDB
    try {
      await db.categories.put(toStoredCategory(updatedCategory));
    } catch (error) {
      console.error('Failed to add note to category:', error);
    }
  },

  /**
   * 🆕 V5: ดึง notes ทั้งหมดของ category
   */
  getNotesForCategory: (categoryId: string) => {
    const { expenseCategories, incomeCategories } = get();
    
    const category =
      expenseCategories.find((c) => c.id === categoryId) ||
      incomeCategories.find((c) => c.id === categoryId);

    return category?.notes || [];
  },

  /**
   * 🆕 V5: ลบ note ออกจาก category
   */
  removeNoteFromCategory: async (categoryId: string, note: string) => {
    const { expenseCategories, incomeCategories } = get();
    
    let category = expenseCategories.find((c) => c.id === categoryId);
    let isExpense = true;
    
    if (!category) {
      category = incomeCategories.find((c) => c.id === categoryId);
      isExpense = false;
    }

    if (!category) return;

    const updatedCategory: Category = {
      ...category,
      notes: category.notes.filter((n) => n !== note),
    };

    if (isExpense) {
      set({
        expenseCategories: expenseCategories.map((c) =>
          c.id === categoryId ? updatedCategory : c
        ),
      });
    } else {
      set({
        incomeCategories: incomeCategories.map((c) =>
          c.id === categoryId ? updatedCategory : c
        ),
      });
    }

    try {
      await db.categories.put(toStoredCategory(updatedCategory));
    } catch (error) {
      console.error('Failed to remove note from category:', error);
    }
  },
}));
```

### การทำงาน
- **Enrichment**: ข้อมูลที่เก็บใน DB มี `name`, `type`, `order`, `icon`, **`notes`** แต่เมื่อโหลดจะ enrich ด้วย `color` จาก constants
- **Separation**: แยกเป็น `expenseCategories` และ `incomeCategories` ใน state
- **Order Management**: รองรับการเรียงลำดับ category ด้วย field `order`
- **🆕 Notes Collection**: เก็บ notes ที่เคยใช้กับ category นี้เป็น array

---

## 3. Transaction Store (`transaction-store.ts`) 🆕 Updated V5

### หน้าที่
จัดการข้อมูล Transaction (รายการรายรับ/รายจ่าย) ซึ่งเป็นข้อมูลหลักของแอป **และอัปเดต notes ให้ category อัตโนมัติ**

### Database Operations

| Operation | Method | DB Action | Description |
|-----------|--------|-----------|-------------|
| **Load** | `loadTransactions()` | `db.transactions.orderBy('date').reverse().toArray()` | โหลดข้อมูลทั้งหมดจาก DB |
| **Add** | `addTransaction()` | `db.transactions.put()` + **`updateAnalysis()`** + **🆕 `addNoteToCategory()`** | เพิ่ม transaction ใหม่ + อัปเดต analysis + **เพิ่ม note ให้ category** |
| **Update** | `updateTransaction()` | `db.transactions.put()` + **🆕 `addNoteToCategory()`** | อัปเดต transaction + **เพิ่ม note ใหม่ให้ category** |
| **Delete** | `deleteTransaction()` | `db.transactions.delete()` | ลบ transaction |

### การทำงาน (Version 5)
- **Dependency**: ต้องโหลด categories ก่อน เพราะ transaction ต้องมี category
- **Join Data**: เมื่อโหลด transaction จะ join กับ category เพื่อสร้าง `TransactionWithCategory`
- **Computed Values**: คำนวณ `dailySummaries`, `monthlySummary`, `walletBalances` อัตโนมัติ
- **Filtering**: รองรับการกรองตาม month, day, wallet
- **Analysis Integration**: เมื่อบันทึก transaction ใหม่ จะตรวจสอบและอัปเดต analysis อัตโนมัติ
- **🆕 Notes Collection**: เมื่อบันทึก transaction ที่มี note จะเพิ่ม note เข้า category อัตโนมัติ

### 🆕 Data Flow: เมื่อบันทึก Transaction ใหม่ที่มี Note (V5)

```
┌──────────────────────────────────────────────────────────────┐
│                    User บันทึก Transaction                    │
│                    (พร้อม note: "ข้าวมันไก่")                  │
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
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│ 2. Analysis Store           │   │ 🆕 3. Category Store        │
│    updateAnalysisOnNew...() │   │    addNoteToCategory()      │
│    - Basic Match Check      │   │    - เช็คว่า note ซ้ำไหม    │
│    - Full Match Check       │   │    - เพิ่ม note ใน array    │
│    - อัปเดต count           │   │    - บันทึกลง DB           │
└─────────────────────────────┘   └─────────────────────────────┘
```

### ตัวอย่างโค้ด (V5)
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
    
    // 3. อัปเดต Analysis สำหรับ duplicate detection
    const analysisStore = useAnalysisStore.getState();
    await analysisStore.updateAnalysisOnNewTransaction(newTransaction);
    
    // 🆕 4. เพิ่ม note ให้ category (ถ้ามี note)
    if (newTransaction.note && newTransaction.note.trim() !== '') {
      const categoryStore = useCategoryStore.getState();
      await categoryStore.addNoteToCategory(
        newTransaction.categoryId,
        newTransaction.note
      );
    }
    
  } catch (error) {
    console.error('Failed to add transaction:', error);
  }

  // 5. อัปเดต computed values
  recomputeValues();
},

updateTransaction: async (id, updates) => {
  const { transactions } = get();
  const existingTransaction = transactions.find((t) => t.id === id);
  
  if (!existingTransaction) return;

  const updatedTransaction = {
    ...existingTransaction,
    ...updates,
  };

  // 1. อัปเดต Zustand state
  set({
    transactions: transactions.map((t) =>
      t.id === id ? updatedTransaction : t
    ),
  });

  // 2. บันทึกลง IndexedDB
  try {
    await db.transactions.put(toStoredTransaction(updatedTransaction));
    
    // 🆕 3. เพิ่ม note ใหม่ให้ category (ถ้ามีการเปลี่ยน note)
    if (
      updates.note &&
      updates.note.trim() !== '' &&
      updates.note !== existingTransaction.note
    ) {
      const categoryStore = useCategoryStore.getState();
      await categoryStore.addNoteToCategory(
        updatedTransaction.categoryId,
        updates.note
      );
    }
    
  } catch (error) {
    console.error('Failed to update transaction:', error);
  }

  recomputeValues();
}
```

---

## 4. Analysis Store (`analysis-store.ts`)

### หน้าที่
วิเคราะห์และติดตาม transactions ที่มีรูปแบบซ้ำกัน เพื่อช่วยให้ผู้ใช้เห็น patterns การใช้จ่าย

### Match Types (ประเภทการตรวจสอบซ้ำ)

| Match Type | Keys ที่ใช้ตรวจสอบ | Description |
|------------|-------------------|-------------|
| **basic** | `walletId` + `type` + `categoryId` + `amount` | ตรวจสอบซ้ำจาก 4 fields หลัก |
| **full** | `walletId` + `type` + `categoryId` + `amount` + `note` | ตรวจสอบซ้ำรวม note ด้วย |

### Database Operations

| Operation | Method | DB Action | Description |
|-----------|--------|-----------|-------------|
| **Load** | `loadAnalysis()` | `db.analysis.toArray()` | โหลดข้อมูลทั้งหมดจาก DB |
| **Update** | `updateAnalysisOnNewTransaction()` | `db.analysis.put()` | อัปเดตเมื่อมี transaction ใหม่ |
| **Get By Wallet** | `getAnalysisByWallet()` | `db.analysis.where('walletId').equals()` | ดึงข้อมูลตาม wallet |
| **Get By Type** | `getAnalysisByType()` | `db.analysis.where('type').equals()` | ดึงข้อมูลตาม type |
| **Clear** | `clearAnalysis()` | `db.analysis.clear()` | ล้างข้อมูลทั้งหมด |
| **Rebuild** | `rebuildAnalysis()` | `db.analysis.clear()` + rebuild | สร้างใหม่จาก transactions ทั้งหมด |

*(รายละเอียด implementation เหมือนเดิมใน V4)*

---

## ความสัมพันธ์ระหว่าง Stores (Updated for V5)

### 1. Transaction → Category (Foreign Key + Notes Update)

```typescript
// Transaction มี categoryId ที่อ้างอิงไปยัง Category
interface Transaction {
  categoryId: string; // Foreign key to Category
  note?: string;      // 🆕 note ที่จะถูกเพิ่มเข้า Category.notes
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

### 3. Analysis → Category, Wallet, Transaction (Foreign Keys)

```typescript
// Analysis มี foreign keys ไปยัง Category, Wallet และ Transaction
interface Analysis {
  walletId: string;           // FK → Wallet
  categoryId: string;         // FK → Category
  lastTransactionId: string;  // FK → Transaction (ล่าสุดที่ match)
  // ...
}
```

### 4. Load Order Dependency (Updated V5)

```
┌─────────────────┐         ┌─────────────────┐
│ Category Store  │         │  Wallet Store   │
│ (ไม่มี dependency)│         │ (ไม่มี dependency)│
│ 🆕 + notes array│         │                 │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │◄──────────────────────────┤
         │                           │
         ▼                           ▼
┌─────────────────────────────────────────────┐
│            Transaction Store                │
│   (ต้องใช้ category + wallet)               │
│   🆕 อัปเดต notes กลับไป category            │
└─────────────────────┬───────────────────────┘
                      │
                      │ triggers
                      ▼
┌─────────────────────────────────────────────┐
│            Analysis Store                   │
│   (อัปเดตเมื่อมี transaction ใหม่)            │
└─────────────────────────────────────────────┘
```

---

## Entity Relationship Diagram (Updated for V5)

```
┌─────────────┐                     ┌──────────────────┐
│   Wallet    │                     │    Category      │
│             │                     │                  │
│ - id (PK)   │                     │ - id (PK)        │
│ - name      │                     │ - name           │
│ - type      │                     │ - type           │
│ - ...       │                     │ - order          │
│             │                     │ - 🆕 notes[]     │◄─────────┐
└──────┬──────┘                     └──────┬───────────┘          │
       │                                    │                     │
       │ walletId                           │ categoryId          │ updates
       │     ┌──────────────────────────────┘                     │
       │     │                                                    │
       ▼     ▼                                                    │
┌──────────────────────────────────────────────────────────────┐  │
│                     Transaction                               │  │
│                                                               │  │
│ - id (PK)                                                     │  │
│ - walletId  (FK → Wallet)                                    │  │
│ - categoryId (FK → Category)                                  │  │
│ - type                                                        │  │
│ - amount                                                      │  │
│ - note  ─────────────────────────────────────────────────────┼──┘
│ - date                                                        │
│ - createdAt                                                   │
└──────────────┬────────────────────────────────────────────────┘
               │
               │ triggers update
               ▼
┌─────────────────────────────────────┐
│            Analysis                 │
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

## 🆕 การใช้งาน Notes Collection ใน UI

### 1. Note Autocomplete สำหรับ Transaction Form

```tsx
function TransactionForm() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { getNotesForCategory } = useCategoryStore();
  
  // ดึง notes ที่เคยใช้กับ category นี้
  const suggestedNotes = useMemo(() => {
    if (!selectedCategoryId) return [];
    return getNotesForCategory(selectedCategoryId);
  }, [selectedCategoryId, getNotesForCategory]);

  // กรอง suggestions ตาม input
  const filteredSuggestions = useMemo(() => {
    if (!noteInput) return suggestedNotes;
    return suggestedNotes.filter((note) =>
      note.toLowerCase().includes(noteInput.toLowerCase())
    );
  }, [noteInput, suggestedNotes]);

  return (
    <form>
      {/* Category Selector */}
      <CategorySelector
        value={selectedCategoryId}
        onChange={setSelectedCategoryId}
      />

      {/* Note Input with Autocomplete */}
      <div className="relative">
        <input
          type="text"
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="หมายเหตุ (เช่น ข้าวมันไก่)"
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border rounded-md shadow-lg">
            {filteredSuggestions.map((note) => (
              <li
                key={note}
                onClick={() => {
                  setNoteInput(note);
                  setShowSuggestions(false);
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {note}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ... rest of form ... */}
    </form>
  );
}
```

### 2. แสดง Recent Notes ของ Category

```tsx
function CategoryNotesPreview({ categoryId }: { categoryId: string }) {
  const { getNotesForCategory } = useCategoryStore();
  const notes = getNotesForCategory(categoryId);

  if (notes.length === 0) return null;

  return (
    <div className="text-sm text-gray-500">
      <span>บันทึกล่าสุด: </span>
      {notes.slice(-5).map((note, index) => (
        <span key={note} className="mr-2">
          {note}
          {index < 4 && ', '}
        </span>
      ))}
    </div>
  );
}
```

### 3. Quick Select จาก Notes ที่เคยใช้

```tsx
function QuickNoteSelector({
  categoryId,
  onSelect,
}: {
  categoryId: string;
  onSelect: (note: string) => void;
}) {
  const { getNotesForCategory } = useCategoryStore();
  const notes = getNotesForCategory(categoryId);

  // แสดง 5 notes ล่าสุด
  const recentNotes = notes.slice(-5).reverse();

  return (
    <div className="flex flex-wrap gap-2">
      {recentNotes.map((note) => (
        <button
          key={note}
          type="button"
          onClick={() => onSelect(note)}
          className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200"
        >
          {note}
        </button>
      ))}
    </div>
  );
}
```

---

## ตัวอย่างข้อมูล Notes ใน Category

### Scenario: บันทึก Transaction หลายครั้ง

สมมติมี transactions ดังนี้:

| ID | Category | Amount | Note |
|----|----------|--------|------|
| t1 | c1 (อาหาร) | 100 | ข้าวมันไก่ |
| t2 | c1 (อาหาร) | 50 | กาแฟ |
| t3 | c1 (อาหาร) | 100 | ก๋วยเตี๋ยว |
| t4 | c1 (อาหาร) | 100 | ข้าวมันไก่ | (ซ้ำ - ไม่เพิ่ม)
| t5 | c2 (ขนส่ง) | 35 | BTS |

### ผลลัพธ์ใน Categories:

```json
// Category c1 (อาหาร)
{
  "id": "c1",
  "name": "อาหาร",
  "type": "expense",
  "notes": ["ข้าวมันไก่", "กาแฟ", "ก๋วยเตี๋ยว"]  // ไม่มี "ข้าวมันไก่" ซ้ำ
}

// Category c2 (ขนส่ง)
{
  "id": "c2",
  "name": "ขนส่ง",
  "type": "expense",
  "notes": ["BTS"]
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
6. **Update analysis** ทุกครั้งที่มี transaction ใหม่
7. **แยก analysis ตาม walletId และ type** เพื่อความแม่นยำ
8. **🆕 Check duplicate notes** ก่อนเพิ่มเข้า category.notes
9. **🆕 Limit notes array size** ป้องกันข้อมูลเยอะเกินไป

### ❌ Don'ts

1. **Don't store Date objects** โดยตรงใน IndexedDB
2. **Don't load transactions** ก่อน categories
3. **Don't delete** category/wallet ที่มี transaction ใช้งาน
4. **Don't forget** to update computed values หลัง CRUD operations
5. **Don't skip analysis update** เมื่อบันทึก transaction
6. **🆕 Don't add empty notes** ให้ validate ก่อนเพิ่ม
7. **🆕 Don't add duplicate notes** ให้ check ก่อนเพิ่ม

---

## Migration Guide: V4 → V5

เมื่อ upgrade จาก V4 เป็น V5:

1. **Database migration**: Dexie จะเพิ่ม `notes` array ให้ categories อัตโนมัติ
2. **Rebuild notes** (Optional): สามารถ rebuild notes จาก transactions ที่มีอยู่

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
      await analysisStore.rebuildAnalysis();
    }
    
    // 🆕 V5: Rebuild notes for categories (optional - one time migration)
    const categoryStore = useCategoryStore.getState();
    const needsNotesRebuild = await checkIfNotesNeedRebuild();
    
    if (needsNotesRebuild) {
      await rebuildCategoryNotes();
    }
  };
  
  initApp();
}, []);

// 🆕 Helper function to rebuild notes from existing transactions
async function rebuildCategoryNotes() {
  const transactions = await db.transactions.toArray();
  const categoryStore = useCategoryStore.getState();
  
  for (const tx of transactions) {
    if (tx.note && tx.note.trim() !== '') {
      await categoryStore.addNoteToCategory(tx.categoryId, tx.note);
    }
  }
}
```

---

## หมายเหตุ

- ระบบใช้ **IndexedDB** ผ่าน **Dexie** สำหรับ offline-first app
- **Zustand** ใช้สำหรับ client-side state management
- **Data sync**: ข้อมูล sync ระหว่าง Zustand state และ IndexedDB ทุกครั้งที่มีการเปลี่ยนแปลง
- **Migration**: DB schema มี versioning (v1, v2, v3, v4, **v5**) สำหรับรองรับการเปลี่ยนแปลงในอนาคต
- **Analysis**: เป็น derived data ที่สามารถ rebuild ได้จาก transactions เสมอ
- **🆕 Notes Collection**: เป็นข้อมูลที่สะสมจาก transactions และสามารถ rebuild ได้
