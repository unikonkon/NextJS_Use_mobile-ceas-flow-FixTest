# Mobile WEB App CEAS Flow

แอปจัดการรายรับ-รายจ่ายส่วนบุคคล (Personal Finance Tracker) แบบ PWA สำหรับมือถือ พร้อม AI วิเคราะห์การเงิน

## Tech Stack

| หมวด | เทคโนโลยี |
|------|-----------|
| Framework | Next.js 16.1.3 (App Router) |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI |
| State Management | Zustand 5 |
| Database | Dexie (IndexedDB) |
| AI | Google Gemini API |
| Charts | Chart.js + react-chartjs-2 |
| PWA | @ducanh2912/next-pwa (Workbox) |
| Import/Export | xlsx |
| Icons | Lucide React |

## โครงสร้างโปรเจกต์

```
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout + PWA setup
│   ├── globals.css               # Global styles (Tailwind)
│   ├── (main)/                   # Main route group
│   │   ├── layout.tsx            # Main layout
│   │   ├── page.tsx              # หน้าหลัก (Tabbed UI)
│   │   └── offline/              # หน้า Offline สำหรับ PWA
│   └── api/
│       ├── ai/route.ts           # AI analysis endpoint (Gemini)
│       └── prompts/              # Prompt templates สำหรับ AI
│
├── components/
│   ├── ui/                       # shadcn/ui base components (16 files)
│   ├── layout/                   # Header, PageContainer
│   ├── navigation/               # BottomNav (แถบนำทางด้านล่าง)
│   ├── tabs/                     # Tab หลัก 4 แท็บ
│   │   ├── HomeTab.tsx           # หน้าแรก - รายการธุรกรรม
│   │   ├── AnalyticsTab.tsx      # สถิติ + กราฟ
│   │   ├── UseAiAnalysisTab.tsx  # AI วิเคราะห์การเงิน
│   │   └── MoreTab.tsx           # ตั้งค่า/เพิ่มเติม
│   ├── transactions/             # UI จัดการธุรกรรม
│   │   ├── add-transaction-sheet.tsx
│   │   ├── edit-transaction-sheet.tsx
│   │   ├── transaction-list.tsx
│   │   ├── transaction-card.tsx
│   │   └── ui-transactions/      # Calculator, Category scroll ฯลฯ
│   ├── categories/               # จัดการหมวดหมู่
│   ├── common/                   # Shared components
│   └── providers/                # StoreProvider, ThemeProvider
│
├── lib/
│   ├── constants/categories.ts   # หมวดหมู่เริ่มต้น (30 รายจ่าย + 14 รายรับ)
│   ├── stores/                   # Zustand stores (8 stores)
│   │   ├── transaction-store.ts  # CRUD ธุรกรรม + สรุปรายวัน/เดือน
│   │   ├── wallet-store.ts       # จัดการกระเป๋าเงิน
│   │   ├── category-store.ts     # จัดการหมวดหมู่ + notes
│   │   ├── analysis-store.ts     # ตรวจจับรายการซ้ำ
│   │   ├── ai-history-store.ts   # เก็บประวัติผลวิเคราะห์ AI
│   │   ├── alert-settings-store.ts # แจ้งเตือนงบประมาณ
│   │   ├── theme-store.ts        # Dark/Light mode
│   │   ├── settings-store.ts     # ตั้งค่าแอป
│   │   └── db.ts                 # Dexie IndexedDB setup (6 versions)
│   └── utils/                    # format, excel-export/import, device-storage
│
├── types/index.ts                # TypeScript interfaces ทั้งหมด
├── hooks/useTabNavigation.ts     # Hook จัดการ tab state
└── public/                       # PWA icons + manifest.json
```

## ฟีเจอร์หลัก

### 1. จัดการรายรับ-รายจ่าย (Home Tab)
- บันทึกธุรกรรมพร้อมเครื่องคิดเลขในตัว
- แบ่งกลุ่มรายการตามวัน พร้อมสรุปรายเดือน
- กรองตามเดือนและกระเป๋าเงิน
- แนะนำรายการที่ทำบ่อย (Frequent Transactions)
- แจ้งเตือนเมื่อใช้จ่ายเกินงบ (Alert Banner)

### 2. สถิติและกราฟ (Analytics Tab)
- กราฟวงกลม/แท่ง แยกตามหมวดหมู่
- เปรียบเทียบยอดกระเป๋าเงิน
- กรองข้อมูลตามช่วงเวลา

### 3. AI วิเคราะห์การเงิน (AI Analysis Tab)
- วิเคราะห์สุขภาพทางการเงินด้วย Google Gemini
- กฎ 50/30/20 Budget Rule
- คำแนะนำลดรายจ่าย
- แผนปฏิบัติ 3/6/12 เดือน
- จำกัด 4 ครั้ง/วัน พร้อม cache ผลลัพธ์

### 4. ตั้งค่าและอื่นๆ (More Tab)
- Export/Import ข้อมูลเป็น Excel (XLSX)
- ข้อมูลพื้นที่จัดเก็บอุปกรณ์
- ตั้งค่าแจ้งเตือนราคา
- สลับ Dark/Light mode

### 5. PWA & Offline
- ติดตั้งเป็นแอปบนมือถือได้
- ใช้งานแบบ Offline ผ่าน Service Worker
- รองรับ iOS (cache first for app shell)

## Data Models

### Transaction
```typescript
interface Transaction {
  id: string;
  walletId: string;
  categoryId: string;
  type: 'expense' | 'income';
  amount: number;
  currency: string;
  date: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Wallet
```typescript
type WalletType = 'cash' | 'bank' | 'credit_card' | 'e_wallet' | 'savings' | 'daily_expense';

interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  icon: string;
  color: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  isAsset: boolean;
  createdAt: Date;
}
```

### Category
```typescript
interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  order?: number;
  icon?: string;
  color?: string;
  notes?: string[];  // V5
}
```

## Database (IndexedDB via Dexie)

**ชื่อ:** `CeasFlowDB` (6 versions)

| Collection | รายละเอียด |
|------------|-----------|
| transactions | ธุรกรรมทั้งหมด (indexed: walletId, categoryId, type, date) |
| categories | หมวดหมู่ (indexed: type, order) |
| wallets | กระเป๋าเงิน (indexed: type) |
| analysis | ข้อมูลตรวจจับรายการซ้ำ (V4+) |
| aiHistory | ประวัติผลวิเคราะห์ AI (V5+) |

## API

### POST `/api/ai`
- วิเคราะห์การเงินด้วย Google Gemini
- Rate limit ต่อ IP (default: 4 ครั้ง/วัน)
- รองรับ `promptType`: `structured` | `full`

## การติดตั้งและรัน

```bash
# ติดตั้ง dependencies
npm install

# รันโหมด development
npm run dev

# Build สำหรับ production
npm run build

# รัน production
npm start
```

## Version History

| Version | รายละเอียด |
|---------|-----------|
| V1-V3 | โครงสร้างพื้นฐาน + ระบบหมวดหมู่ |
| V4 | ตรวจจับรายการซ้ำ (Analysis Store) |
| V5 | AI วิเคราะห์ + Notes ในหมวดหมู่ + AI History |
| V6 | Migration เพิ่ม notes array ใน categories |
