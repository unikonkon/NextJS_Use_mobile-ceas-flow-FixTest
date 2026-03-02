# CeasFlow - โครงสร้าง App บันทึกรายรับรายจ่าย (Actual Implementation)

> เอกสารนี้สะท้อนโครงสร้างจริงของ codebase ปัจจุบัน (Version 6)
> PWA แอปบันทึกรายรับรายจ่ายแบบ Offline-First พร้อม AI วิเคราะห์การเงิน

---

## สารบัญ

1. [Tech Stack](#tech-stack)
2. [โครงสร้างโฟลเดอร์](#โครงสร้างโฟลเดอร์)
3. [App Directory](#app-directory)
4. [Components](#components)
5. [Hooks](#hooks)
6. [Lib / Stores / Utils](#lib)
7. [Types](#types)
8. [Database Schema (IndexedDB)](#database-schema-indexeddb)
9. [State Management Flow](#state-management-flow)
10. [Key Patterns & Architecture](#key-patterns--architecture)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CVA (Class Variance Authority) |
| UI Components | Radix UI Primitives (shadcn/ui style) |
| State Management | Zustand (in-memory) + IndexedDB (persistent) |
| Database | Dexie.js (IndexedDB wrapper) - Version 6 |
| AI | Google Generative AI (Gemini 2.5 Flash Lite) |
| Charts | Doughnut Charts (custom implementation) |
| Icons | Lucide React + Emoji |
| Excel Export/Import | XLSX library |
| PWA | Web Manifest + Offline page |
| Locale | Thai (th-TH) |

---

## โครงสร้างโฟลเดอร์

```
NextJS_Use_mobile-ceas-flow-FixTest/
├── app/
│   ├── layout.tsx                              # Root Layout (PWA, fonts, theme)
│   ├── globals.css                             # Global styles + 9 themes
│   ├── (main)/
│   │   ├── layout.tsx                          # Main wrapper layout
│   │   └── page.tsx                            # Main page (tab navigation)
│   ├── api/
│   │   ├── ai/
│   │   │   └── route.ts                        # AI Analysis API (Gemini)
│   │   └── prompts/
│   │       ├── financialAnalysisPrompt.ts       # Full analysis prompt (Thai)
│   │       ├── financialAnalysisPromptCompact.ts # Compact prompt
│   │       └── financialAnalysisPromptStructured.ts # Structured JSON prompt
│   └── offline/
│       └── page.tsx                            # Offline fallback page
│
├── components/
│   ├── categories/
│   │   ├── index.ts
│   │   ├── category-grid.tsx                   # Grid of category buttons
│   │   ├── category-icon.tsx                   # Styled category icon
│   │   └── category-selector.tsx               # Tabbed category selector (expense/income)
│   ├── common/
│   │   ├── index.ts
│   │   ├── calculator-pad.tsx                  # Full calculator widget
│   │   ├── currency-display.tsx                # Formatted currency display
│   │   ├── empty-state.tsx                     # Empty data placeholder
│   │   ├── month-picker.tsx                    # Month/day/calendar selector
│   │   └── wallet-selector.tsx                 # Dropdown wallet picker
│   ├── layout/
│   │   ├── index.ts
│   │   ├── header.tsx                          # Sticky top header
│   │   └── page-container.tsx                  # Main content wrapper
│   ├── navigation/
│   │   ├── index.ts
│   │   └── BottomNav.tsx                       # Bottom tab bar + FAB
│   ├── providers/
│   │   ├── index.ts
│   │   ├── StoreProvider.tsx                   # Zustand store hydration
│   │   └── ThemeProvider.tsx                   # Theme class application
│   ├── tabs/
│   │   ├── index.ts
│   │   ├── HomeTab.tsx                         # Main transaction tab
│   │   ├── AnalyticsTab.tsx                    # Analytics container
│   │   ├── MoreTab.tsx                         # Settings tab
│   │   ├── UseAiAnalysisTab.tsx                # AI analysis tab
│   │   └── AnalyticsTabComponent/
│   │       ├── AnalyticsContent.tsx             # Charts & statistics
│   │       ├── WalletsContent.tsx               # Wallet management
│   │       └── ReusedTransactionFilters.tsx     # Recurring transaction analysis
│   ├── tabs/MoreTabComponent/
│   │   ├── index.ts
│   │   ├── StorageInfoCard.tsx                 # Device storage info
│   │   ├── ExportDataCard.tsx                  # Excel export/import
│   │   ├── AutoOpenSettingCard.tsx             # Auto-open setting
│   │   └── SettingAlertPriceCard.tsx           # Budget alert settings
│   ├── transactions/
│   │   ├── index.ts
│   │   ├── summary-bar.tsx                     # Income/expense summary
│   │   ├── transaction-list.tsx                # Day-grouped transaction list
│   │   ├── transaction-card.tsx                # Single transaction card
│   │   ├── day-group.tsx                       # Daily group with header
│   │   ├── grouped-transaction-card.tsx        # Collapsed category group
│   │   ├── add-transaction-sheet.tsx           # Add transaction modal
│   │   ├── edit-transaction-sheet.tsx          # Edit transaction modal
│   │   ├── wallet-picker-modal.tsx             # Wallet selection modal
│   │   └── ui-transactions/
│   │       ├── index.ts
│   │       ├── use-calculator.ts               # Calculator logic hook
│   │       ├── type-selector.tsx               # Expense/Income toggle
│   │       ├── category-scroll.tsx             # Scrollable category + management
│   │       ├── calc-button.tsx                 # Calculator button
│   │       ├── calculator-keypad.tsx           # Calculator 4x5 grid
│   │       ├── frequent-transactions.tsx       # Quick-select frequent items
│   │       └── category-selete.tsx             # Full-screen category picker
│   └── ui/                                     # Base UI (Radix/shadcn-style)
│       ├── alert-banner.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx                          # CVA variants
│       ├── card.tsx
│       ├── date-time-picker.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── progress.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       ├── sheet.tsx                           # Bottom sheet modal
│       ├── switch.tsx
│       └── tabs.tsx
│
├── hooks/
│   ├── index.ts
│   └── useTabNavigation.ts                     # Tab state management
│
├── lib/
│   ├── constants/
│   │   └── categories.ts                       # 44 default categories + icon groups
│   ├── mock/
│   │   ├── data.ts                             # Mock data (disabled)
│   │   └── mockTransactions.ts                 # 10K transaction generator
│   ├── stores/
│   │   ├── index.ts                            # Central store exports
│   │   ├── db.ts                               # Dexie IndexedDB schema (V6)
│   │   ├── transaction-store.ts                # Transaction CRUD + computed
│   │   ├── category-store.ts                   # Category CRUD + notes
│   │   ├── wallet-store.ts                     # Wallet CRUD
│   │   ├── analysis-store.ts                   # Duplicate/recurring detection
│   │   ├── theme-store.ts                      # Theme persistence
│   │   ├── settings-store.ts                   # App settings
│   │   ├── alert-settings-store.ts             # Budget alert settings
│   │   └── ai-history-store.ts                 # AI response history
│   ├── utils/
│   │   ├── format.ts                           # Thai locale formatting
│   │   ├── device-storage-info.ts              # Platform/browser detection
│   │   ├── excel-export.ts                     # Multi-sheet Excel export
│   │   └── excel-import.ts                     # Excel import with dedup
│   └── utils.ts                                # cn() utility (clsx + twMerge)
│
└── types/
    └── index.ts                                # All TypeScript interfaces
```

---

## App Directory

### Root Layout (`app/layout.tsx`)
- HTML lang="th" (Thai)
- Google Fonts: Geist Sans + Geist Mono
- PWA metadata: manifest, icons (32x32 - 192x192)
- Mobile viewport: device-width, no scaling, viewport-fit=cover
- iOS-specific: apple-web-app-capable, status bar style, touch icons
- Wraps with `ThemeProvider`

### Main Page (`app/(main)/page.tsx`)
- **'use client'** - Client-side rendered
- Tab navigation via `useTabNavigation` hook
- 4 tabs: `home` | `analytics` | `ai-analysis` | `more`
- Analytics sub-tabs: `stats` | `wallets`
- Wrapped with `StoreProvider` for Zustand hydration
- Renders: `HomeTab`, `AnalyticsTab`, `UseAiAnalysisTab`, `MoreTab`
- `BottomNav` with FAB (+ button) for adding transactions

### AI API (`app/api/ai/route.ts`)
- Model: **Gemini 2.5 Flash Lite** (`gemini-2.5-flash-lite`)
- Rate limiting: IP-based, daily limit via `AI_DAILY_LIMIT` env var
- Prompt types: `"structured"` | `"full"`
- Request: `{ financialData: string, promptType: string }`
- Response: `{ type, data (JSON or text), remaining }`
- Error handling: missing API key, rate limit exceeded, invalid fields

### AI Prompts (`app/api/prompts/`)

| File | Export | Output |
|------|--------|--------|
| `financialAnalysisPrompt.ts` | `createFinancialAnalysisPrompt()` | Full JSON analysis (summary, 50/30/20 rule, savings, investment, action plan) |
| `financialAnalysisPromptCompact.ts` | `createCompactFinancialPrompt()` | Thai text summary (6 analysis points) |
| `financialAnalysisPromptStructured.ts` | `createStructuredFinancialPrompt()` | Structured JSON (summary, recommendations, expenses, warnings) |

### Offline Page (`app/offline/page.tsx`)
- Fallback for offline state
- WifiOff icon + refresh button
- Thai language messaging

---

## Components

### Bottom Navigation (`BottomNav.tsx`)

| Tab | Icon | Label | Route/Action |
|-----|------|-------|-------------|
| Home | Home/HomeFilled | จด | `home` tab |
| Analytics | BarChart3/BarChart3Filled | วิเคราะห์ | `analytics` tab |
| **FAB (+)** | Plus | - | Opens `AddTransactionSheet` |
| AI Analysis | Sparkles/SparklesFilled | AI | `ai-analysis` tab |
| More | MoreHorizontal/MoreHorizontalFilled | เพิ่มเติม | `more` tab |

- Auto-open feature: opens add-transaction sheet on app load (configurable)
- Animated active tab indicator with bounce effect

### Tab Components

#### HomeTab
- **MonthPicker**: Month/day filtering with Thai date display
- **WalletSelector**: Filter by wallet (left header action)
- **SummaryBar**: Income, expense, balance for current period
- **AlertBanner**: Monthly budget + category limit warnings
- **TransactionList**: Day-grouped transactions
- **EditTransactionSheet**: Edit/delete modal
- Toast notification for successful operations

#### AnalyticsTab
- Sub-tabs: Stats (`AnalyticsContent`) | Wallets (`WalletsContent`)
- **AnalyticsContent**: Doughnut charts, category summaries, recurring analysis
- **WalletsContent**: Wallet CRUD, balance tracking, transaction history per wallet
- **ReusedTransactionFilters**: Analyze repeated transactions (basic/full match)

#### UseAiAnalysisTab
- Multiple prompt types (compact, structured, full)
- Structured financial analysis display
- 50/30/20 rule evaluation
- Savings rate, emergency fund, investment recommendations
- Action plans and warnings
- Conversation history

#### MoreTab
- **Theme selector**: 9 themes with preview gradients
- **AutoOpenSettingCard**: Toggle auto-open transaction
- **ExportDataCard**: Excel export/import with progress
- **StorageInfoCard**: Device storage, IndexedDB info, browser detection
- **SettingAlertPriceCard**: Monthly budget + category spending limits

### Transaction Components

| Component | Purpose |
|-----------|---------|
| `add-transaction-sheet.tsx` | Full add modal: type selector, category scroll, calculator, note input, date picker, wallet selector, frequent transactions, category management |
| `edit-transaction-sheet.tsx` | Edit modal with pre-populated data + delete confirmation |
| `transaction-card.tsx` | Single transaction: icon, time, category, note, amount, wallet |
| `day-group.tsx` | Day header (sticky) + grouped transactions by category |
| `grouped-transaction-card.tsx` | Expandable card for multiple same-category transactions |
| `summary-bar.tsx` | Income/expense/balance summary bar |
| `transaction-list.tsx` | Container for day groups with stagger animation |
| `wallet-picker-modal.tsx` | Bottom sheet wallet selection |

### Transaction UI Sub-components

| Component | Purpose |
|-----------|---------|
| `use-calculator.ts` | Calculator logic: +, -, x, ÷, max 9 digits, integer-only |
| `type-selector.tsx` | Expense/Income pill toggle |
| `category-scroll.tsx` | Horizontal scroll + drag reorder + long-press edit + add/delete/hide categories + icon picker + notes |
| `calculator-keypad.tsx` | 4x5 grid: 0-9, 00, operations, C, backspace, =, submit |
| `calc-button.tsx` | Single calculator button with variants |
| `frequent-transactions.tsx` | Quick-select from recurring transactions |
| `category-selete.tsx` | Full-screen category search + grouped selection |

### Category Components

| Component | Purpose |
|-----------|---------|
| `category-grid.tsx` | 4/5/6-column grid with selection indicator + add button |
| `category-icon.tsx` | Styled icon with OKLch colors (sm/md/lg/xl) |
| `category-selector.tsx` | Tabbed expense/income + scrollable category grids |

### Common Components

| Component | Purpose |
|-----------|---------|
| `calculator-pad.tsx` | Full calculator: 4x4 keypad, operation display, formatted output |
| `currency-display.tsx` | Formatted THB display (monospace, color-coded) |
| `empty-state.tsx` | Empty data: icon, title, description, action button |
| `month-picker.tsx` | Month/year buttons + day calendar (Thai B.E.) + today/weekend indicators |
| `wallet-selector.tsx` | Dropdown with balances + "All Wallets" option |

### Layout Components

| Component | Purpose |
|-----------|---------|
| `header.tsx` | Sticky header (40px), left/right action slots, book selector |
| `page-container.tsx` | Full-screen wrapper, padding, safe area support |

### UI Components (Base/Radix)

| Component | Based On |
|-----------|----------|
| `button.tsx` | CVA variants (default, destructive, outline, secondary, ghost, link) |
| `card.tsx` | Header, Title, Description, Action, Content, Footer |
| `sheet.tsx` | Radix Dialog (top, bottom, left, right) |
| `dialog.tsx` | Radix Dialog |
| `tabs.tsx` | Radix Tabs |
| `input.tsx` | HTML input wrapper |
| `switch.tsx` | Custom toggle (keyboard accessible) |
| `date-time-picker.tsx` | Date/time selection widget |
| `alert-banner.tsx` | Warning/danger alert |
| `progress.tsx` | Progress bar |
| `scroll-area.tsx` | Custom scrollbar area |
| `separator.tsx` | Visual divider |
| `avatar.tsx` | User avatar |
| `badge.tsx` | Label/tag |

### Providers

| Provider | Purpose |
|----------|---------|
| `StoreProvider.tsx` | Loads categories + transactions from IndexedDB, shows loading spinner until hydrated |
| `ThemeProvider.tsx` | Applies theme class to `<html>`, syncs with theme store (9 themes) |

---

## Hooks

### `useTabNavigation(initialTab?: TabType)`

```typescript
type TabType = 'home' | 'wallets' | 'analytics' | 'ai-analysis' | 'more';
type AnalyticsSubTab = 'stats' | 'wallets';
```

**Returns:**
- `activeTab` - current tab
- `setActiveTab()` - direct setter
- `isActive(tab)` - check if tab is active
- `analyticsSubTab` - stats | wallets
- `setAnalyticsSubTab()` - sub-tab setter
- `handleTabChange(tab)` - smart handler:
  - `'wallets'` → sets analytics tab + wallets sub-tab
  - `'analytics'` → sets analytics tab + stats sub-tab
  - others → direct set

---

## Lib

### Constants (`lib/constants/categories.ts`)

- **30 expense categories**: อาหาร, ของใช้, เดินทาง, บันเทิง, สุขภาพ, ค่าบิล, ครอบครัว, สังสรรค์, ที่อยู่, สื่อสาร, เสื้อผ้า, การศึกษา, กีฬา, สัตว์เลี้ยง, ท่องเที่ยว, ประกัน, ภาษี, ของขวัญ, ลงทุน, ธุรกิจ, ออมเงิน, etc.
- **14 income categories**: เงินเดือน, โบนัส, ฟรีแลนซ์, ลงทุน, ค่าเช่า, ขายของ, etc.
- **10+ icon groups**: อาหาร, เดินทาง, สุขภาพ, ช้อปปิ้ง, บ้าน, กีฬา, ธรรมชาติ, etc. (280+ emojis)
- Helper functions: `getCategoryStyle()`, `getCategoryFromConstants()`, `enrichCategory()`

### Database (`lib/stores/db.ts`)

**Dexie IndexedDB - Version 6**

| Table | Indexed Fields |
|-------|---------------|
| `transactions` | id, walletId, categoryId, type, date, createdAt |
| `categories` | id, type, order |
| `wallets` | id, type |
| `analysis` | id, walletId, type, categoryId, amount, note, matchType, count, lastTransactionId, updatedAt |
| `aiHistory` | id, walletId, promptType, year, createdAt |

**Converter functions:**
- `toStoredTransaction()` / `fromStoredTransaction()` - Date ↔ ISO string
- `toStoredCategory()` / `fromStoredCategory()` - with enrichment
- `toStoredWallet()` / `fromStoredWallet()`

**Version History:**
- V1-V3: Basic tables
- V4: Added `analysis` table
- V5: Added `aiHistory` table + category `notes` array
- V6: Migration to ensure `notes` array on all categories

### Stores (Zustand)

#### `transaction-store.ts`

**State:**
- `transactions: TransactionWithCategory[]`
- `dailySummaries: DailySummary[]` (computed)
- `monthlySummary` (computed: income, expense, balance)
- `walletBalances: Record<string, WalletBalance>` (computed)
- `selectedMonth`, `selectedDay`, `selectedWalletId` (filters)
- `newTransactionIds` (UI animation tracking)
- `toastVisible`, `toastType` (notification)

**Actions:**
- `loadTransactions()` - Load from DB (requires categories loaded first)
- `addTransaction(input)` - Optimistic add + trigger analysis + add note to category
- `updateTransaction(id, input)` - Optimistic update
- `deleteTransaction(id)` - Delete
- `deleteTransactionsByWalletId(walletId)` - Bulk delete
- `setSelectedMonth/Day/WalletId()` - Filter setters

#### `category-store.ts`

**State:**
- `expenseCategories: Category[]` (separated for UI)
- `incomeCategories: Category[]`

**Actions:**
- `loadCategories()` - Load from DB, seed defaults on first run (30 expense + 14 income)
- `addCategory(input)` / `deleteCategory(id)`
- `reorderCategories(type, categories)`
- `addNoteToCategory(id, note)` - V5: max 50, no duplicates
- `getNotesForCategory(id)` - For autocomplete
- `removeNoteFromCategory(id, note)`

#### `wallet-store.ts`

**State:** `wallets: Wallet[]`

**Actions:** `loadWallets()`, `addWallet()`, `updateWallet()`, `deleteWallet()`, `getWalletById()`

#### `analysis-store.ts`

**State:** `analysisRecords: Analysis[]`

**Match Types:**
- `basic`: walletId + type + categoryId + amount
- `full`: walletId + type + categoryId + amount + note

**Actions:**
- `updateAnalysisOnNewTransaction(transaction)` - Called on each new transaction
- `getAnalysisByWallet/Type/WalletAndType()`
- `getTopDuplicates(limit)`
- `rebuildAnalysis()` - Full rebuild from all transactions

#### `theme-store.ts`

**Themes:** `'light' | 'dark' | 'zinc' | 'stone' | 'cyan' | 'sky' | 'teal' | 'gray' | 'neutral'`

**Persistence:** localStorage key `ceas-flow-theme`

#### `settings-store.ts`

**State:** `autoOpenTransaction: boolean`, `hasAutoOpened: boolean`

**Persistence:** localStorage key `ceas-flow-settings`

#### `alert-settings-store.ts`

**State:**
- `monthlyExpenseTarget: number | null`
- `isMonthlyTargetEnabled: boolean`
- `categoryLimits: CategoryLimit[]`
- `isCategoryLimitsEnabled: boolean`

**Persistence:** localStorage key `ceas-flow-alert-settings`

#### `ai-history-store.ts`

**State:** `records: AiHistory[]` (sorted newest first)

**Actions:** `loadHistory()`, `addHistory()`, `deleteHistory()`, `clearHistory()`

### Utils

#### `format.ts` (Thai Locale)
- `formatCurrency(amount)` - Thai currency (no ฿ symbol)
- `formatNumber(num)` - Thousands separator
- `formatDate(date)` - "D MMM YYYY" (Thai locale)
- `formatTime(date)` - "HH:mm"
- `formatRelativeDate(date)` - "วันนี้" | "เมื่อวาน" | date
- `formatMonthYear(date)` - "Month YYYY" (Thai)
- `isSameDay(d1, d2)` - Same day check
- `getDayOfWeek(date)` - Thai day name
- `formatPercentage(value)` - Percentage string

#### `device-storage-info.ts`
- Platform detection: iOS, Android, Desktop
- Browser detection: Chrome, Safari, Firefox, Edge, Opera, Samsung Internet
- Storage info via `navigator.storage.estimate()`
- PWA detection via `display-mode: standalone`
- Platform-specific storage limits

#### `excel-export.ts`
- Multi-sheet Excel export using XLSX library
- Sheets: Overview, Per-wallet, Monthly, Category summary, Per-category detail
- Progress callback with Thai status messages
- Filename: `CeasFlow_Export_YYYY-MM-DD.xlsx`

#### `excel-import.ts`
- Import from Excel (wallet sheets prefixed with icon)
- Thai date parsing (Buddhist Era → CE conversion)
- Duplicate wallet name handling (appends "ซ้ำ")
- Category auto-creation if not found

#### `utils.ts`
- `cn(...inputs)` - clsx + tailwind-merge for conditional classnames

---

## Types

```typescript
// Transaction types
type TransactionType = 'expense' | 'income';
type CategoryType = 'expense' | 'income';
type WalletType = 'cash' | 'bank' | 'credit_card' | 'e_wallet' | 'savings' | 'daily_expense';

// Core interfaces
interface Transaction {
  id: string;
  walletId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  date: Date;
  note?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionWithCategory extends Transaction {
  category: Category;
  wallet?: Wallet;
}

interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  walletId?: string;
  date?: Date;
  note?: string;
}

interface Category {
  id: string;
  name: string;
  type: CategoryType;
  order?: number;
  icon?: string;
  color?: string;
  notes?: string[];      // V5: notes array for autocomplete
}

interface CategorySummary {
  category: Category;
  amount: number;
  percentage: number;
  transactionCount: number;
}

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

interface DailySummary {
  date: Date;
  income: number;
  expense: number;
  transactions: TransactionWithCategory[];
}
```

---

## Database Schema (IndexedDB)

### ER Diagram

```
categories ──< transactions >── wallets
     │
     └── notes[] (V5)

transactions ──> analysis (pattern detection)

aiHistory (standalone, filtered by walletId/year)
```

### Tables

#### transactions
| Field | Type | Indexed |
|-------|------|---------|
| id | string | PK |
| walletId | string | Yes |
| categoryId | string | Yes |
| type | 'expense' \| 'income' | Yes |
| amount | number | No |
| currency | string | No |
| date | string (ISO) | Yes |
| note | string? | No |
| imageUrl | string? | No |
| createdAt | string (ISO) | Yes |
| updatedAt | string (ISO) | No |

#### categories
| Field | Type | Indexed |
|-------|------|---------|
| id | string | PK |
| name | string | No |
| type | 'expense' \| 'income' | Yes |
| order | number | Yes |
| icon | string? | No |
| color | string? | No |
| notes | string[] | No (V5+) |

#### wallets
| Field | Type | Indexed |
|-------|------|---------|
| id | string | PK |
| name | string | No |
| type | WalletType | Yes |
| icon | string | No |
| color | string | No |
| currency | string | No |
| initialBalance | number | No |
| currentBalance | number | No |
| isAsset | boolean | No |
| createdAt | string (ISO) | No |

#### analysis (V4+)
| Field | Type | Indexed |
|-------|------|---------|
| id | string | PK |
| walletId | string | Yes |
| type | string | Yes |
| categoryId | string | Yes |
| amount | number | Yes |
| note | string | Yes |
| matchType | 'basic' \| 'full' | Yes |
| count | number | Yes |
| lastTransactionId | string | Yes |
| updatedAt | string (ISO) | Yes |

#### aiHistory (V5+)
| Field | Type | Indexed |
|-------|------|---------|
| id | string | PK |
| walletId | string? | Yes |
| promptType | string | Yes |
| year | number | Yes |
| responseData | string (JSON) | No |
| createdAt | string (ISO) | Yes |

---

## State Management Flow

### Data Loading Sequence

```
App Mount (StoreProvider)
    │
    ├─ 1. categoryStore.loadCategories()     ← No deps
    ├─ 1. walletStore.loadWallets()           ← No deps
    │
    └─ 2. transactionStore.loadTransactions() ← Requires categories
         │
         └─ Computes: dailySummaries, monthlySummary, walletBalances
```

### Transaction Creation Flow

```
User adds transaction (AddTransactionSheet)
    │
    ├─ 1. Optimistic: update Zustand state immediately
    ├─ 2. Async: save to IndexedDB via Dexie
    ├─ 3. analysisStore.updateAnalysisOnNewTransaction()
    ├─ 4. categoryStore.addNoteToCategory() (if note exists)
    └─ 5. Recompute: dailySummaries, monthlySummary, walletBalances
```

### Persistence Strategy

| Data | Storage | Key |
|------|---------|-----|
| Transactions | IndexedDB (Dexie) | `CeasFlowDB.transactions` |
| Categories | IndexedDB (Dexie) | `CeasFlowDB.categories` |
| Wallets | IndexedDB (Dexie) | `CeasFlowDB.wallets` |
| Analysis | IndexedDB (Dexie) | `CeasFlowDB.analysis` |
| AI History | IndexedDB (Dexie) | `CeasFlowDB.aiHistory` |
| Theme | localStorage | `ceas-flow-theme` |
| Settings | localStorage | `ceas-flow-settings` |
| Alert Settings | localStorage | `ceas-flow-alert-settings` |
| Selected Wallet | localStorage | (via transaction store) |

---

## Key Patterns & Architecture

### 1. Offline-First PWA
- All data stored in IndexedDB (client-side)
- No server-side database required
- Offline fallback page
- Web manifest for installability
- iOS/Android PWA meta tags

### 2. Optimistic Updates
- Zustand state updated immediately for responsive UI
- IndexedDB writes happen asynchronously
- No loading states for CRUD operations

### 3. Computed Values
- Daily summaries, monthly summary, wallet balances auto-computed
- Recomputed after every transaction mutation
- Filtered by selectedMonth, selectedDay, selectedWalletId

### 4. Data Enrichment
- Categories stored without icon/color in DB (saves space)
- Enriched with icon/color from constants on load
- `enrichCategory()` maps stored → runtime data

### 5. Theme System (9 Themes)
- Uses OKLch color space for CSS custom properties
- Light/dark variants for each theme
- Finance-specific colors: income (green), expense (red), transfer (purple)
- 12 category colors for consistent categorization
- Applied via CSS class on `<html>` element

### 6. Mobile-First Design
- Safe area padding (notch support)
- Touch-friendly targets (48px minimum)
- Bottom sheet modals
- Keyboard detection for note input
- Drag-to-reorder categories
- Long-press interactions (170ms threshold)

### 7. Thai Localization
- All UI labels in Thai
- Thai date formatting (B.E. year support)
- Thai month/day names
- Thai currency formatting (THB/฿)
- AI prompts in Thai

### 8. Barrel Exports
- Each component folder has `index.ts` for clean imports
- `@/components/tabs`, `@/components/navigation`, etc.
- Stores exported from `lib/stores/index.ts`

### 9. AI Integration
- Google Generative AI (Gemini 2.5 Flash Lite)
- In-memory rate limiting by IP (daily limit)
- 3 prompt types: compact, structured, full
- Thai language prompts with structured JSON output
- Financial health analysis: 50/30/20 rule, savings rate, investment recommendations

---

## Global CSS Features

### Animations
| Name | Effect |
|------|--------|
| `slide-up` / `slide-down` | Vertical slide transitions |
| `scale-in` | Scale from 95% to 100% |
| `pop-in-glow` | Scale in with glow effect |
| `shimmer` | Loading shimmer animation |
| `glow-pulse` | Pulsing glow for new transactions |
| `success-ring` | Success indicator ring |
| `bounce-subtle` | Subtle bounce for active nav items |
| `cursor-blink` | Blinking cursor for calculator |

### Custom Classes
| Class | Purpose |
|-------|---------|
| `.glass` | Glassmorphism effect |
| `.text-gradient-income/expense` | Gradient text for amounts |
| `.shadow-soft` | Custom soft shadow |
| `.font-numbers` | Tabular numbers (monospace digits) |
| `.pb-safe` / `.pt-safe` | Safe area padding |
| `.scrollbar-hide` | Hide scrollbar |
| `.stagger-children` | Staggered animation for lists |
| `.transaction-new` | Highlight animation for new items |

---

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini AI API key | For AI features |
| `AI_DAILY_LIMIT` | Daily AI request limit (server) | For AI features |
| `NEXT_PUBLIC_AI_DAILY_LIMIT` | Daily AI limit (client, must match) | For AI features |

---

*Document Version: 2.0 (Actual Implementation)*
*Last Updated: March 2026*
*Database Version: 6*
