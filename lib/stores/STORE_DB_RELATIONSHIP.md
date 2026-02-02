# ความสัมพันธ์ระหว่าง Store Files กับการบันทึกข้อมูลลง Database

## ภาพรวม

ระบบใช้ **Zustand** สำหรับ state management และ **Dexie (IndexedDB)** สำหรับการเก็บข้อมูลถาวร โดยมี 3 store files หลักที่ทำงานร่วมกัน:

1. `wallet-store.ts` - จัดการข้อมูล Wallet (กระเป๋าเงิน)
2. `category-store.ts` - จัดการข้อมูล Category (หมวดหมู่รายรับ/รายจ่าย)
3. `transaction-store.ts` - จัดการข้อมูล Transaction (รายการรายรับ/รายจ่าย)

---

## Database Schema (db.ts)

### Tables ที่ใช้

```typescript
// IndexedDB Tables
- transactions: 'id, walletId, categoryId, type, date, createdAt'
- categories: 'id, type, order'
- wallets: 'id, type'
```

### Data Converters

แต่ละ store ใช้ converter functions เพื่อแปลงข้อมูลระหว่าง Runtime (Date objects) และ Stored format (ISO strings):

- **Transaction**: `toStoredTransaction()` / `fromStoredTransaction()`
- **Category**: `toStoredCategory()` / `fromStoredCategory()`
- **Wallet**: `toStoredWallet()` / `fromStoredWallet()`

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
| **Add** | `addTransaction()` | `db.transactions.put()` | เพิ่ม transaction ใหม่ |
| **Update** | `updateTransaction()` | `db.transactions.put()` | อัปเดต transaction |
| **Delete** | `deleteTransaction()` | `db.transactions.delete()` | ลบ transaction |

### การทำงาน
- **Dependency**: ต้องโหลด categories ก่อน เพราะ transaction ต้องมี category
- **Join Data**: เมื่อโหลด transaction จะ join กับ category เพื่อสร้าง `TransactionWithCategory`
- **Computed Values**: คำนวณ `dailySummaries`, `monthlySummary`, `walletBalances` อัตโนมัติ
- **Filtering**: รองรับการกรองตาม month, day, wallet

### ตัวอย่างโค้ด
```typescript
loadTransactions: async () => {
  // 1. ต้องโหลด categories ก่อน
  const categoryStore = useCategoryStore.getState();
  if (!categoryStore.isInitialized) {
    await categoryStore.loadCategories();
  }

  // 2. โหลด transactions จาก DB
  const storedTransactions = await db.transactions
    .orderBy('date')
    .reverse()
    .toArray();

  // 3. Join กับ category
  const transactions = storedTransactions.map((s) => {
    const base = fromStoredTransaction(s);
    const category = categoryStore.getCategoryById(s.categoryId);
    return {
      ...base,
      category: category!,
    } as TransactionWithCategory;
  });

  // 4. คำนวณ computed values
  set({
    transactions,
    dailySummaries: computeDailySummaries(transactions, ...),
    monthlySummary: computeMonthlySummary(transactions, ...),
    walletBalances: computeWalletBalances(transactions),
  });
}
```

---

## ความสัมพันธ์ระหว่าง Stores

### 1. Transaction → Category (Foreign Key)

```typescript
// Transaction มี categoryId ที่อ้างอิงไปยัง Category
interface Transaction {
  categoryId: string; // Foreign key to Category
  // ...
}

// เมื่อโหลด transaction ต้อง join กับ category
const category = categoryStore.getCategoryById(transaction.categoryId);
```

**ผลกระทบ:**
- ❌ **ไม่สามารถลบ category ที่มี transaction ใช้งานอยู่ได้** (ต้องตรวจสอบก่อนลบ)
- ✅ **Transaction ต้องมี category ที่ถูกต้อง** (validate ก่อนบันทึก)

### 2. Transaction → Wallet (Foreign Key)

```typescript
// Transaction มี walletId ที่อ้างอิงไปยัง Wallet
interface Transaction {
  walletId: string; // Foreign key to Wallet
  // ...
}
```

**ผลกระทบ:**
- ❌ **ไม่สามารถลบ wallet ที่มี transaction ใช้งานอยู่ได้** (ต้องตรวจสอบก่อนลบ)
- ✅ **Transaction ต้องมี wallet ที่ถูกต้อง** (validate ก่อนบันทึก)
- 📊 **Wallet Balance**: คำนวณจาก transactions ทั้งหมดของ wallet นั้น

### 3. Load Order Dependency

```
┌─────────────────┐
│ Category Store  │  ← โหลดก่อน (ไม่มี dependency)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Wallet Store   │  ← โหลดก่อน (ไม่มี dependency)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Transaction Store│  ← โหลดทีหลัง (ต้องใช้ category)
└─────────────────┘
```

**ใน Transaction Store:**
```typescript
loadTransactions: async () => {
  // ต้อง ensure categories โหลดก่อน
  const categoryStore = useCategoryStore.getState();
  if (!categoryStore.isInitialized) {
    await categoryStore.loadCategories();
  }
  // ... โหลด transactions
}
```

---

## Pattern การบันทึกข้อมูล

### Optimistic Update Pattern

ทุก store ใช้ **Optimistic Update** เพื่อให้ UI ตอบสนองเร็ว:

```typescript
// 1. อัปเดต Zustand state ทันที (UI เปลี่ยนทันที)
set({ wallets: newWallets });

// 2. บันทึกลง DB แบบ async (ไม่ block UI)
try {
  await db.wallets.put(toStoredWallet(newWallet));
} catch (error) {
  console.error('Failed to add wallet:', error);
  // TODO: Rollback state ถ้าจำเป็น
}
```

**ข้อดี:**
- ✅ UI ตอบสนองเร็ว (ไม่ต้องรอ DB)
- ✅ User experience ดีขึ้น

**ข้อควรระวัง:**
- ⚠️ ถ้า DB fail อาจต้อง rollback state
- ⚠️ ควรมี error handling ที่ดี

### Data Transformation

ทุก store ใช้ converter functions เพื่อแปลงข้อมูล:

```typescript
// Runtime → DB (Date → ISO String)
const stored = toStoredTransaction(transaction);
await db.transactions.put(stored);

// DB → Runtime (ISO String → Date)
const stored = await db.transactions.get(id);
const transaction = fromStoredTransaction(stored);
```

**เหตุผล:**
- IndexedDB ไม่รองรับ Date objects โดยตรง
- ต้องแปลงเป็น ISO string ก่อนบันทึก
- แปลงกลับเป็น Date เมื่อโหลด

---

## สรุปความสัมพันธ์

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│   Wallet    │         │   Category   │
│             │         │              │
│ - id        │         │ - id         │
│ - name      │         │ - name       │
│ - type      │         │ - type       │
│ - ...       │         │ - order      │
└──────┬──────┘         └──────┬───────┘
       │                        │
       │                        │
       │  walletId              │  categoryId
       │                        │
       ▼                        ▼
┌─────────────────────────────────────┐
│          Transaction                │
│                                     │
│ - id                                │
│ - walletId  (FK → Wallet)          │
│ - categoryId (FK → Category)        │
│ - type                              │
│ - amount                            │
│ - date                              │
│ - ...                               │
└─────────────────────────────────────┘
```

### Key Points

1. **Transaction เป็น Entity หลัก** ที่อ้างอิงไปยัง Wallet และ Category
2. **Category และ Wallet เป็น Independent** (ไม่ต้องอ้างอิงกัน)
3. **Load Order**: Category → Wallet → Transaction
4. **Data Integrity**: ต้อง validate foreign keys ก่อนบันทึก
5. **Computed Values**: Transaction store คำนวณ summaries และ balances อัตโนมัติ

---

## Best Practices ที่ใช้ในโค้ด

### ✅ Do's

1. **Always use converters** (`toStored*` / `fromStored*`)
2. **Check dependencies** ก่อนโหลด (เช่น transaction ต้อง check category)
3. **Optimistic updates** สำหรับ UX ที่ดี
4. **Error handling** ทุก DB operation
5. **Prevent duplicate loads** ด้วย `isInitialized` flag

### ❌ Don'ts

1. **Don't store Date objects** โดยตรงใน IndexedDB
2. **Don't load transactions** ก่อน categories
3. **Don't delete** category/wallet ที่มี transaction ใช้งาน
4. **Don't forget** to update computed values หลัง CRUD operations

---

## หมายเหตุ

- ระบบใช้ **IndexedDB** ผ่าน **Dexie** สำหรับ offline-first app
- **Zustand** ใช้สำหรับ client-side state management
- **Data sync**: ข้อมูล sync ระหว่าง Zustand state และ IndexedDB ทุกครั้งที่มีการเปลี่ยนแปลง
- **Migration**: DB schema มี versioning (v1, v2, v3) สำหรับรองรับการเปลี่ยนแปลงในอนาคต
