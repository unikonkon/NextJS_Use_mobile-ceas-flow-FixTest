# 📱 วิเคราะห์โครงสร้าง App บันทึกรายรับรายจ่าย

> วิเคราะห์จากภาพหน้าจอ 5 หน้า เพื่อออกแบบโครงสร้างระบบสำหรับ Next.js App Router

---

## 📋 สารบัญ

1. [Bottom Navigation](#bottom-navigation)
2. [โครงสร้างโฟลเดอร์](#โครงสร้างโฟลเดอร์-nextjs-app-router)
3. [Core Features](#core-features-ที่ต้องพัฒนา)
4. [Database Schema](#database-schema)
5. [UI Components](#ui-components-ที่ต้องสร้าง)
6. [API Endpoints](#api-endpoints)

---

## Bottom Navigation

แอปมี 4 แท็บหลักที่ด้านล่าง:

| แท็บ | ไอคอน | หน้าที่ | Route |
|------|-------|--------|-------|
| หนังสือ | 📒 | Dashboard รายการธุรกรรม | `/` หรือ `/transactions` |
| กระเป๋าเงิน | 👛 | จัดการบัญชี/Wallet | `/wallets` |
| การวิเคราะห์ | 📊 | กราฟและรายงาน | `/analytics` |
| เพิ่มเติม | ⋯ | เมนูตั้งค่าและฟีเจอร์เสริม | `/more` |

---

## โครงสร้างโฟลเดอร์ (Next.js App Router)

```
src/
├── app/
│   ├── (main)/                          # Layout หลักที่มี Bottom Nav
│   │   ├── layout.tsx                   # Bottom Navigation Layout
│   │   │
│   │   ├── page.tsx                     # หน้าหนังสือ/Dashboard
│   │   │
│   │   ├── transactions/
│   │   │   ├── page.tsx                 # รายการธุรกรรมทั้งหมด
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx             # รายละเอียดธุรกรรม
│   │   │   └── calendar/
│   │   │       └── page.tsx             # มุมมองปฏิทิน
│   │   │
│   │   ├── wallets/                     # กระเป๋าเงิน
│   │   │   ├── page.tsx                 # รายการบัญชีทั้งหมด
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx             # รายละเอียดบัญชี
│   │   │   └── new/
│   │   │       └── page.tsx             # เพิ่มบัญชีใหม่
│   │   │
│   │   ├── analytics/                   # การวิเคราะห์
│   │   │   ├── page.tsx                 # Dashboard กราฟหลัก
│   │   │   ├── expense/
│   │   │   │   └── page.tsx             # วิเคราะห์ค่าใช้จ่าย
│   │   │   ├── income/
│   │   │   │   └── page.tsx             # วิเคราะห์รายได้
│   │   │   ├── balance/
│   │   │   │   └── page.tsx             # งบดุล
│   │   │   └── assets/
│   │   │       └── page.tsx             # สินทรัพย์/หนี้สิน
│   │   │
│   │   └── more/                        # เพิ่มเติม
│   │       ├── page.tsx                 # เมนูหลัก
│   │       ├── categories/
│   │       │   ├── page.tsx             # รายการหมวดหมู่
│   │       │   ├── [id]/
│   │       │   │   └── page.tsx         # แก้ไขหมวดหมู่
│   │       │   └── new/
│   │       │       └── page.tsx         # เพิ่มหมวดหมู่
│   │       ├── budgets/
│   │       │   ├── page.tsx             # รายการงบประมาณ
│   │       │   └── [id]/
│   │       │       └── page.tsx         # รายละเอียดงบ
│   │       ├── goals/
│   │       │   ├── page.tsx             # เป้าหมายการออม
│   │       │   └── [id]/
│   │       │       └── page.tsx         # รายละเอียดเป้าหมาย
│   │       ├── recurring/
│   │       │   ├── page.tsx             # บิลประจำงวด
│   │       │   └── [id]/
│   │       │       └── page.tsx         # รายละเอียดบิลประจำ
│   │       ├── reminders/
│   │       │   └── page.tsx             # เตือนความจำ
│   │       ├── members/
│   │       │   └── page.tsx             # สมาชิก/ครอบครัว
│   │       ├── books/
│   │       │   ├── page.tsx             # จัดการหนังสือ
│   │       │   └── [id]/
│   │       │       └── page.tsx         # รายละเอียดหนังสือ
│   │       ├── currency/
│   │       │   └── page.tsx             # แลกเปลี่ยนเงินตรา
│   │       ├── export/
│   │       │   └── page.tsx             # ส่งออก Excel
│   │       ├── backup/
│   │       │   └── page.tsx             # สำรองข้อมูล
│   │       ├── search/
│   │       │   └── page.tsx             # ค้นหา
│   │       ├── premium/
│   │       │   └── page.tsx             # ซื้อ Premium
│   │       └── settings/
│   │           └── page.tsx             # ตั้งค่าทั่วไป
│   │
│   ├── add/                             # หน้าเพิ่มรายการ (Modal)
│   │   ├── layout.tsx                   # Layout แบบ Modal/Sheet
│   │   ├── expense/
│   │   │   └── page.tsx                 # เพิ่มค่าใช้จ่าย
│   │   ├── income/
│   │   │   └── page.tsx                 # เพิ่มรายได้
│   │   └── transfer/
│   │       └── page.tsx                 # โอนเงิน
│   │
│   ├── (auth)/                          # Authentication
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── forgot-password/
│   │       └── page.tsx
│   │
│   ├── api/                             # API Routes
│   │   ├── auth/
│   │   ├── transactions/
│   │   ├── categories/
│   │   ├── wallets/
│   │   ├── budgets/
│   │   ├── analytics/
│   │   └── export/
│   │
│   ├── layout.tsx                       # Root Layout
│   └── globals.css
│
├── components/
│   ├── ui/                              # Base UI Components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── sheet.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   │
│   ├── layout/                          # Layout Components
│   │   ├── bottom-nav.tsx
│   │   ├── header.tsx
│   │   └── page-container.tsx
│   │
│   ├── transactions/                    # Transaction Components
│   │   ├── transaction-card.tsx
│   │   ├── transaction-list.tsx
│   │   ├── transaction-form.tsx
│   │   ├── day-group.tsx
│   │   └── summary-bar.tsx
│   │
│   ├── categories/                      # Category Components
│   │   ├── category-grid.tsx
│   │   ├── category-icon.tsx
│   │   └── category-selector.tsx
│   │
│   ├── wallets/                         # Wallet Components
│   │   ├── wallet-card.tsx
│   │   ├── wallet-list.tsx
│   │   └── wallet-summary.tsx
│   │
│   ├── analytics/                       # Analytics Components
│   │   ├── donut-chart.tsx
│   │   ├── category-breakdown.tsx
│   │   ├── trend-chart.tsx
│   │   └── analytics-tabs.tsx
│   │
│   ├── common/                          # Shared Components
│   │   ├── calculator-pad.tsx
│   │   ├── month-picker.tsx
│   │   ├── date-picker.tsx
│   │   ├── book-selector.tsx
│   │   ├── currency-display.tsx
│   │   └── empty-state.tsx
│   │
│   └── forms/                           # Form Components
│       ├── add-transaction-form.tsx
│       ├── add-wallet-form.tsx
│       ├── add-category-form.tsx
│       └── add-budget-form.tsx
│
├── lib/
│   ├── db/
│   │   ├── index.ts                     # Database client
│   │   ├── schema.ts                    # Drizzle/Prisma schema
│   │   └── queries/
│   │       ├── transactions.ts
│   │       ├── categories.ts
│   │       ├── wallets.ts
│   │       └── analytics.ts
│   │
│   ├── utils/
│   │   ├── format-currency.ts
│   │   ├── format-date.ts
│   │   ├── calculate.ts
│   │   └── group-by-date.ts
│   │
│   └── validations/
│       ├── transaction.ts
│       ├── category.ts
│       └── wallet.ts
│
├── hooks/
│   ├── use-transactions.ts
│   ├── use-categories.ts
│   ├── use-wallets.ts
│   ├── use-analytics.ts
│   ├── use-calculator.ts
│   └── use-book.ts
│
├── stores/                              # State Management (Zustand)
│   ├── transaction-store.ts
│   ├── filter-store.ts
│   └── book-store.ts
│
├── types/
│   ├── transaction.ts
│   ├── category.ts
│   ├── wallet.ts
│   ├── budget.ts
│   └── analytics.ts
│
└── constants/
    ├── categories.ts                    # Default categories
    ├── icons.ts                         # Icon mappings
    └── currencies.ts                    # Currency list
```

---

## Core Features ที่ต้องพัฒนา

### 1. ระบบหนังสือ (Books)

**หน้าที่หลัก:**
- รองรับหลายหนังสือบัญชี (เช่น ส่วนตัว, ธุรกิจ, ครอบครัว)
- สลับระหว่างหนังสือได้จาก Dropdown ด้านบน
- สรุปยอดแยกตามหนังสือ
- เพิ่มหนังสือใหม่ได้

**ฟีเจอร์:**
- [ ] CRUD หนังสือ
- [ ] เลือกหนังสือที่ใช้งาน
- [ ] แชร์หนังสือกับสมาชิกอื่น

---

### 2. ระบบธุรกรรม (Transactions)

**หน้าที่หลัก:**
- เพิ่ม/แก้ไข/ลบ รายการธุรกรรม
- 3 ประเภท: ค่าใช้จ่าย (Expense), รายได้ (Income), โอนเงิน (Transfer)
- แสดงรายการแยกตามวัน พร้อมสรุปยอดรายวัน

**ฟีเจอร์:**
- [ ] เพิ่มรายการพร้อม Calculator ในตัว
- [ ] เลือกหมวดหมู่จาก Grid
- [ ] เลือกบัญชี/กระเป๋าเงิน
- [ ] เลือกวันที่ (TODAY หรือวันอื่น)
- [ ] เพิ่มโน้ต/บันทึก
- [ ] แนบรูปภาพ (ใบเสร็จ)
- [ ] กรองตามเดือน/ปี
- [ ] มุมมองปฏิทิน
- [ ] มุมมองรายละเอียด

---

### 3. ระบบหมวดหมู่ (Categories)

**หน้าที่หลัก:**
- หมวดหมู่แยกรายรับ/รายจ่าย
- ไอคอนและสีประจำหมวดหมู่
- AI แนะนำหมวดหมู่ที่ใช้บ่อย

**หมวดหมู่เริ่มต้น (ค่าใช้จ่าย):**

| หมวดหมู่ | ไอคอน |
|----------|-------|
| อาหาร | 🍔 |
| ของใช้ | 🛒 |
| การจราจร | 🚌 |
| เดท | 🍽️ |
| ทางการแพทย์ | 🏥 |
| ครอบครัว | 👨‍👩‍👧 |
| นันทนาการ | 🎬 |
| ทางสังคม | 🥂 |
| ที่อยู่อาศัย | 🏠 |
| สื่อสาร | 📱 |
| เสื้อผ้า | 👕 |
| toy model | 🎠 |

**ฟีเจอร์:**
- [ ] CRUD หมวดหมู่
- [ ] เลือกไอคอนและสี
- [ ] จัดกลุ่มหมวดหมู่
- [ ] หมวดหมู่ที่ยังไม่จัดกลุ่ม
- [ ] AI แนะนำหมวดหมู่

---

### 4. ระบบกระเป๋าเงิน/บัญชี (Wallets)

**หน้าที่หลัก:**
- จัดการหลายบัญชี/กระเป๋าเงิน
- แสดงสินทรัพย์สุทธิ, สินทรัพย์, หนี้
- รองรับหลายสกุลเงิน

**ประเภทบัญชี:**
- เงินสด (Cash)
- บัญชีธนาคาร (Bank Account)
- บัตรเครดิต (Credit Card)
- E-Wallet (PromptPay, TrueMoney)
- บัญชีออมทรัพย์ (Savings)

**ฟีเจอร์:**
- [ ] CRUD บัญชี
- [ ] ตั้งยอดเริ่มต้น
- [ ] โอนเงินระหว่างบัญชี
- [ ] แสดงยอดคงเหลือแต่ละบัญชี
- [ ] รองรับหลายสกุลเงิน (THB, USD, etc.)

---

### 5. ระบบวิเคราะห์ (Analytics)

**หน้าที่หลัก:**
- แสดงกราฟวิเคราะห์รายรับรายจ่าย
- กรองตามช่วงเวลา (เดือน/สัปดาห์/ปี)
- แยกหมวดหมู่พร้อมเปอร์เซ็นต์

**5 มุมมอง (Tabs):**

| มุมมอง | หน้าที่ |
|--------|--------|
| ค่าใช้จ่าย | Donut Chart แยกหมวดหมู่ค่าใช้จ่าย |
| รายได้ | Donut Chart แยกหมวดหมู่รายได้ |
| งบดุล | เปรียบเทียบรายรับ-รายจ่าย |
| สินทรัพย์ | รายการสินทรัพย์ทั้งหมด |
| หนี้สิน | รายการหนี้สินทั้งหมด |

**ฟีเจอร์:**
- [ ] Donut Chart แยกหมวดหมู่
- [ ] แสดง % และยอดเงิน
- [ ] เรียงลำดับตามยอดเงิน
- [ ] กรองตามช่วงเวลา
- [ ] Trend Chart รายเดือน
- [ ] เปรียบเทียบกับเดือนก่อน

---

### 6. ระบบงบประมาณ (Budgets)

**หน้าที่หลัก:**
- ตั้งงบประมาณรายหมวดหมู่
- ติดตามการใช้จ่ายเทียบกับงบ
- แจ้งเตือนเมื่อใกล้เกินงบ

**ฟีเจอร์:**
- [ ] ตั้งงบรายหมวดหมู่
- [ ] ตั้งงบรายเดือน/สัปดาห์
- [ ] Progress bar แสดงการใช้จ่าย
- [ ] แจ้งเตือนเมื่อถึง 80%, 100%
- [ ] สรุปงบคงเหลือ

---

### 7. ระบบบิลประจำงวด (Recurring Transactions)

**หน้าที่หลัก:**
- จัดการรายการที่เกิดซ้ำอัตโนมัติ
- สร้างธุรกรรมอัตโนมัติตามกำหนด

**ตัวอย่างรายการประจำ:**
- ค่าเช่ารายเดือน
- ค่าโทรศัพท์
- ค่าไฟฟ้า/น้ำประปา
- ค่าสมาชิก Netflix/Spotify
- เงินเดือน

**ฟีเจอร์:**
- [ ] CRUD รายการประจำ
- [ ] ตั้งความถี่: รายวัน/สัปดาห์/เดือน/ปี
- [ ] ตั้งวันเริ่มต้น/สิ้นสุด
- [ ] สร้างธุรกรรมอัตโนมัติ
- [ ] แจ้งเตือนก่อนถึงกำหนด

---

### 8. ระบบเป้าหมายการออม (Goals)

**หน้าที่หลัก:**
- ตั้งเป้าหมายเงินออม
- ติดตามความคืบหน้า
- กำหนดระยะเวลา

**ฟีเจอร์:**
- [ ] CRUD เป้าหมาย
- [ ] ตั้งยอดเป้าหมาย
- [ ] กำหนดวันครบกำหนด
- [ ] ฝากเงินเข้าเป้าหมาย
- [ ] Progress bar
- [ ] แจ้งเตือนความคืบหน้า

---

### 9. ระบบสมาชิก/ครอบครัว (Members)

**หน้าที่หลัก:**
- แชร์หนังสือบัญชีกับคนอื่น
- ติดตามว่าใครใช้จ่ายอะไร

**ฟีเจอร์:**
- [ ] เชิญสมาชิกเข้าหนังสือ
- [ ] กำหนดสิทธิ์ (Admin/Member/Viewer)
- [ ] ระบุผู้ใช้จ่ายในแต่ละรายการ
- [ ] กรองรายการตามสมาชิก

---

### 10. ระบบเพิ่มเติม

**ข้อความ/การแจ้งเตือน:**
- [ ] แจ้งเตือนบิลประจำงวด
- [ ] แจ้งเตือนงบประมาณ
- [ ] แจ้งเตือนเป้าหมาย

**แลกเปลี่ยนเงินตรา:**
- [ ] ดูอัตราแลกเปลี่ยน
- [ ] แปลงสกุลเงิน

**ส่งออก/นำเข้า:**
- [ ] ส่งออกเป็น Excel
- [ ] ส่งออกเป็น PDF
- [ ] นำเข้าจาก Excel

**สำรองข้อมูล:**
- [ ] สำรองข้อมูลไป iCloud
- [ ] สำรองข้อมูลไป Google Drive
- [ ] กู้คืนข้อมูล

**ค้นหา:**
- [ ] ค้นหาธุรกรรม
- [ ] กรองตามช่วงเวลา
- [ ] กรองตามจำนวนเงิน
- [ ] กรองตามหมวดหมู่

**Premium:**
- [ ] ปลดล็อคฟีเจอร์พิเศษ
- [ ] ไม่มีโฆษณา
- [ ] สำรองข้อมูลไม่จำกัด

---

## Database Schema

### ER Diagram Overview

```
users
  │
  ├──< books >──< members
  │       │
  │       ├──< wallets
  │       │       │
  │       │       └──< transactions >── categories
  │       │
  │       ├──< budgets >── categories
  │       │
  │       ├──< goals
  │       │
  │       └──< recurring_transactions >── categories
  │
  └──< user_settings
```

### ตารางหลัก

#### 1. users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| email | VARCHAR | อีเมล (unique) |
| password_hash | VARCHAR | รหัสผ่าน (hashed) |
| name | VARCHAR | ชื่อผู้ใช้ |
| avatar_url | VARCHAR | รูปโปรไฟล์ |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | วันที่อัพเดท |

#### 2. books
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | FK → users |
| name | VARCHAR | ชื่อหนังสือ |
| icon | VARCHAR | ไอคอน |
| currency | VARCHAR | สกุลเงินหลัก (THB) |
| is_default | BOOLEAN | เป็นหนังสือเริ่มต้น |
| created_at | TIMESTAMP | วันที่สร้าง |

#### 3. wallets
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| book_id | UUID | FK → books |
| name | VARCHAR | ชื่อบัญชี |
| type | ENUM | ประเภท (cash, bank, credit_card, e_wallet) |
| icon | VARCHAR | ไอคอน |
| color | VARCHAR | สี |
| currency | VARCHAR | สกุลเงิน |
| initial_balance | DECIMAL | ยอดเริ่มต้น |
| current_balance | DECIMAL | ยอดปัจจุบัน (computed) |
| is_asset | BOOLEAN | เป็นสินทรัพย์ (true) หรือหนี้ (false) |
| created_at | TIMESTAMP | วันที่สร้าง |

#### 4. categories
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| book_id | UUID | FK → books (null = system default) |
| name | VARCHAR | ชื่อหมวดหมู่ |
| type | ENUM | ประเภท (expense, income) |
| icon | VARCHAR | ไอคอน |
| color | VARCHAR | สี |
| parent_id | UUID | FK → categories (สำหรับ subcategory) |
| sort_order | INT | ลำดับการแสดงผล |
| is_system | BOOLEAN | เป็นหมวดหมู่ระบบ |
| created_at | TIMESTAMP | วันที่สร้าง |

#### 5. transactions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| book_id | UUID | FK → books |
| wallet_id | UUID | FK → wallets |
| category_id | UUID | FK → categories |
| type | ENUM | ประเภท (expense, income, transfer) |
| amount | DECIMAL | จำนวนเงิน |
| currency | VARCHAR | สกุลเงิน |
| date | DATE | วันที่ทำรายการ |
| note | TEXT | บันทึก |
| image_url | VARCHAR | รูปใบเสร็จ |
| member_id | UUID | FK → members (ผู้ใช้จ่าย) |
| to_wallet_id | UUID | FK → wallets (สำหรับ transfer) |
| recurring_id | UUID | FK → recurring_transactions |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | วันที่อัพเดท |

#### 6. budgets
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| book_id | UUID | FK → books |
| category_id | UUID | FK → categories (null = งบรวม) |
| amount | DECIMAL | จำนวนงบ |
| period | ENUM | ช่วงเวลา (weekly, monthly, yearly) |
| start_date | DATE | วันเริ่มต้น |
| alert_percentage | INT | เปอร์เซ็นต์แจ้งเตือน (80) |
| created_at | TIMESTAMP | วันที่สร้าง |

#### 7. goals
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| book_id | UUID | FK → books |
| name | VARCHAR | ชื่อเป้าหมาย |
| icon | VARCHAR | ไอคอน |
| target_amount | DECIMAL | ยอดเป้าหมาย |
| current_amount | DECIMAL | ยอดปัจจุบัน |
| deadline | DATE | วันครบกำหนด |
| created_at | TIMESTAMP | วันที่สร้าง |

#### 8. recurring_transactions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| book_id | UUID | FK → books |
| wallet_id | UUID | FK → wallets |
| category_id | UUID | FK → categories |
| type | ENUM | ประเภท (expense, income) |
| amount | DECIMAL | จำนวนเงิน |
| frequency | ENUM | ความถี่ (daily, weekly, monthly, yearly) |
| day_of_month | INT | วันของเดือน (1-31) |
| day_of_week | INT | วันของสัปดาห์ (0-6) |
| start_date | DATE | วันเริ่มต้น |
| end_date | DATE | วันสิ้นสุด |
| next_date | DATE | วันถัดไปที่ต้องสร้าง |
| note | TEXT | บันทึก |
| is_active | BOOLEAN | เปิดใช้งาน |
| created_at | TIMESTAMP | วันที่สร้าง |

#### 9. members
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| book_id | UUID | FK → books |
| user_id | UUID | FK → users (null = ไม่มี account) |
| name | VARCHAR | ชื่อสมาชิก |
| role | ENUM | สิทธิ์ (owner, admin, member, viewer) |
| avatar_url | VARCHAR | รูปโปรไฟล์ |
| created_at | TIMESTAMP | วันที่สร้าง |

#### 10. reminders
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | FK → users |
| type | ENUM | ประเภท (budget, recurring, goal) |
| reference_id | UUID | FK → budgets/recurring/goals |
| message | TEXT | ข้อความแจ้งเตือน |
| remind_at | TIMESTAMP | เวลาแจ้งเตือน |
| is_read | BOOLEAN | อ่านแล้ว |
| created_at | TIMESTAMP | วันที่สร้าง |

---

## UI Components ที่ต้องสร้าง

### Layout Components

| Component | หน้าที่ |
|-----------|--------|
| `BottomNav` | แถบนำทางด้านล่าง 4 แท็บ |
| `Header` | ส่วนหัวพร้อม title และ actions |
| `PageContainer` | Container หลักของแต่ละหน้า |
| `BottomSheet` | Modal แบบ slide up จากด้านล่าง |

### Transaction Components

| Component | หน้าที่ |
|-----------|--------|
| `TransactionCard` | แสดงรายการธุรกรรมแต่ละรายการ |
| `TransactionList` | รายการธุรกรรมทั้งหมด |
| `DayGroup` | จัดกลุ่มธุรกรรมตามวัน พร้อมสรุปยอด |
| `SummaryBar` | แถบสรุป (ทั้งหมด / รายได้ / ค่าใช้จ่าย) |
| `TransactionForm` | ฟอร์มเพิ่ม/แก้ไขธุรกรรม |

### Category Components

| Component | หน้าที่ |
|-----------|--------|
| `CategoryGrid` | Grid แสดงหมวดหมู่ให้เลือก |
| `CategoryIcon` | ไอคอนหมวดหมู่พร้อมพื้นหลัง |
| `CategorySelector` | Tabs เลือกประเภท + Grid หมวดหมู่ |
| `CategoryBadge` | Badge แสดงหมวดหมู่ขนาดเล็ก |

### Wallet Components

| Component | หน้าที่ |
|-----------|--------|
| `WalletCard` | แสดงข้อมูลบัญชีแต่ละบัญชี |
| `WalletList` | รายการบัญชีทั้งหมด |
| `WalletSummary` | สรุปสินทรัพย์สุทธิ / สินทรัพย์ / หนี้ |
| `WalletSelector` | Dropdown เลือกบัญชี |

### Analytics Components

| Component | หน้าที่ |
|-----------|--------|
| `DonutChart` | กราฟวงกลมแสดงสัดส่วน |
| `CategoryBreakdown` | รายการหมวดหมู่พร้อม % และยอดเงิน |
| `AnalyticsTabs` | Tabs สลับมุมมอง (5 แท็บ) |
| `TrendChart` | กราฟเส้นแสดง trend รายเดือน |

### Common Components

| Component | หน้าที่ |
|-----------|--------|
| `CalculatorPad` | แป้นตัวเลขพร้อมเครื่องคิดเลข |
| `MonthPicker` | เลือกเดือน/ปี |
| `DatePicker` | เลือกวันที่ |
| `BookSelector` | Dropdown เลือกหนังสือ |
| `CurrencyDisplay` | แสดงจำนวนเงินพร้อมสกุลเงิน |
| `EmptyState` | แสดงเมื่อไม่มีข้อมูล |
| `LoadingSpinner` | แสดงระหว่างโหลด |

### Form Components

| Component | หน้าที่ |
|-----------|--------|
| `AmountInput` | Input จำนวนเงินพร้อม calculator |
| `NoteInput` | Input โน้ต/บันทึก |
| `DateInput` | Input วันที่พร้อมปุ่ม TODAY |
| `ImageUpload` | Upload รูปใบเสร็จ |

---

## API Endpoints

### Authentication

| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| POST | `/api/auth/register` | สมัครสมาชิก |
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| POST | `/api/auth/logout` | ออกจากระบบ |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/forgot-password` | ลืมรหัสผ่าน |

### Books

| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | `/api/books` | รายการหนังสือทั้งหมด |
| POST | `/api/books` | สร้างหนังสือใหม่ |
| GET | `/api/books/:id` | รายละเอียดหนังสือ |
| PUT | `/api/books/:id` | แก้ไขหนังสือ |
| DELETE | `/api/books/:id` | ลบหนังสือ |

### Transactions

| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | `/api/transactions` | รายการธุรกรรม (พร้อม filter) |
| POST | `/api/transactions` | เพิ่มธุรกรรม |
| GET | `/api/transactions/:id` | รายละเอียดธุรกรรม |
| PUT | `/api/transactions/:id` | แก้ไขธุรกรรม |
| DELETE | `/api/transactions/:id` | ลบธุรกรรม |
| GET | `/api/transactions/summary` | สรุปยอดตามช่วงเวลา |

### Categories

| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | `/api/categories` | รายการหมวดหมู่ |
| POST | `/api/categories` | เพิ่มหมวดหมู่ |
| PUT | `/api/categories/:id` | แก้ไขหมวดหมู่ |
| DELETE | `/api/categories/:id` | ลบหมวดหมู่ |
| GET | `/api/categories/suggestions` | AI แนะนำหมวดหมู่ |

### Wallets

| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | `/api/wallets` | รายการบัญชี |
| POST | `/api/wallets` | เพิ่มบัญชี |
| GET | `/api/wallets/:id` | รายละเอียดบัญชี |
| PUT | `/api/wallets/:id` | แก้ไขบัญชี |
| DELETE | `/api/wallets/:id` | ลบบัญชี |
| GET | `/api/wallets/summary` | สรุปสินทรัพย์/หนี้ |

### Analytics

| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | `/api/analytics/expense` | วิเคราะห์ค่าใช้จ่าย |
| GET | `/api/analytics/income` | วิเคราะห์รายได้ |
| GET | `/api/analytics/balance` | งบดุล |
| GET | `/api/analytics/trend` | Trend รายเดือน |
| GET | `/api/analytics/category/:id` | วิเคราะห์ตามหมวดหมู่ |

### Budgets

| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | `/api/budgets` | รายการงบประมาณ |
| POST | `/api/budgets` | เพิ่มงบประมาณ |
| PUT | `/api/budgets/:id` | แก้ไขงบประมาณ |
| DELETE | `/api/budgets/:id` | ลบงบประมาณ |
| GET | `/api/budgets/status` | สถานะงบประมาณปัจจุบัน |

### Goals

| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | `/api/goals` | รายการเป้าหมาย |
| POST | `/api/goals` | เพิ่มเป้าหมาย |
| PUT | `/api/goals/:id` | แก้ไขเป้าหมาย |
| DELETE | `/api/goals/:id` | ลบเป้าหมาย |
| POST | `/api/goals/:id/deposit` | ฝากเงินเข้าเป้าหมาย |

### Recurring Transactions

| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | `/api/recurring` | รายการบิลประจำ |
| POST | `/api/recurring` | เพิ่มบิลประจำ |
| PUT | `/api/recurring/:id` | แก้ไขบิลประจำ |
| DELETE | `/api/recurring/:id` | ลบบิลประจำ |
| POST | `/api/recurring/:id/skip` | ข้ามรอบนี้ |

### Export

| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | `/api/export/excel` | ส่งออก Excel |
| GET | `/api/export/pdf` | ส่งออก PDF |
| POST | `/api/import/excel` | นำเข้า Excel |

---

## Query Parameters สำหรับ Filter

### GET `/api/transactions`

| Parameter | Type | Description |
|-----------|------|-------------|
| book_id | UUID | กรองตามหนังสือ |
| wallet_id | UUID | กรองตามบัญชี |
| category_id | UUID | กรองตามหมวดหมู่ |
| type | string | กรองตามประเภท (expense/income/transfer) |
| start_date | date | วันเริ่มต้น |
| end_date | date | วันสิ้นสุด |
| min_amount | number | จำนวนเงินขั้นต่ำ |
| max_amount | number | จำนวนเงินสูงสุด |
| search | string | ค้นหาใน note |
| page | number | หน้าที่ |
| limit | number | จำนวนต่อหน้า |

---

## Tech Stack แนะนำ

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts หรือ Chart.js |
| Database | PostgreSQL |
| ORM | Drizzle หรือ Prisma |
| Auth | NextAuth.js หรือ Lucia |
| Storage | Cloudflare R2 / S3 (รูปภาพ) |
| Deployment | Vercel |

---

## Development Phases

### Phase 1: MVP (4-6 สัปดาห์)
- [ ] Authentication (Login/Register)
- [ ] CRUD Transactions
- [ ] Basic Categories
- [ ] Single Wallet
- [ ] Monthly Summary
- [ ] Basic Analytics (Donut Chart)

### Phase 2: Core Features (4-6 สัปดาห์)
- [ ] Multiple Wallets
- [ ] Transfer between wallets
- [ ] Custom Categories
- [ ] Budgets
- [ ] Calendar View
- [ ] Search & Filter

### Phase 3: Advanced Features (4-6 สัปดาห์)
- [ ] Multiple Books
- [ ] Recurring Transactions
- [ ] Goals
- [ ] Members/Family sharing
- [ ] Export Excel/PDF
- [ ] Notifications

### Phase 4: Premium & Polish (2-4 สัปดาห์)
- [ ] Multi-currency
- [ ] Cloud Backup
- [ ] AI Category Suggestions
- [ ] Premium Features
- [ ] PWA Support
- [ ] Performance Optimization

---

*Document Version: 1.0*
*Last Updated: January 2026*
