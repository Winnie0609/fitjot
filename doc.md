# Workout Log - 專案架構文檔

## 目錄

- [背景與目標](#背景與目標)
- [技術](#技術)
- [架構設計](#架構設計)
- [資料流與狀態管理](#資料流與狀態管理)
- [功能實作詳解](#功能實作詳解)
- [測試策略](#測試策略)
- [效能優化](#效能優化)
- [安全性設計](#安全性設計)
- [部署與 CI/CD](#部署與-cicd)
- [專案啟動指南](#專案啟動指南)

---

## 背景與目標

### 專案背景

Workout Log 是一個全端健身記錄追蹤應用，旨在幫助使用者：

- 記錄每日運動訓練（Session、Exercise、Sets）
- 追蹤 InBody 身體組成數據（體重、體脂率、骨骼肌等）
- 可視化健身進展與趨勢分析
- 提供 800+ 運動動作資料庫（來自 [wrkout/exercises.json](https://github.com/wrkout/exercises.json)）
- 登入狀態持久化（重新整理頁面後無需重新登入）

### 設計目標

1. **簡潔架構**：直接使用 Firebase SDK，無需額外 API 層或 Cloud Functions
2. **安全性**：透過 Firestore Rules 實現資料存取控制
3. **用戶體驗**：即時反應的 UI、登入狀態持久化
4. **可測試性**：完整的單元測試、整合測試、E2E 測試覆蓋
5. **開發效率**：TypeScript 類型安全、shadcn/ui 組件庫、React Hook Form

---

## Tech Stack

### 前端框架

- **Next.js 15** - React 框架（App Router）
- **React 19** - UI 函式庫
- **TypeScript** - 類型安全

### UI 組件與樣式

- **Tailwind CSS v4** - Utility-first CSS 框架
- **shadcn/ui** - 基於 Radix UI 的組件庫（New York 風格）
- **Lucide React** - 圖標庫
- **next-themes** - 深色模式支援

### 狀態管理與資料獲取

- **TanStack React Query (v5)** - 伺服器狀態管理、快取、同步
- **React Context** - 全局狀態（Auth、AppData、Sidebar）
- **React Hook Form** - 表單狀態管理
- **Zod** - Schema 驗證

### 後端服務

- **Firebase Authentication** - 使用者認證（Email/Password、Google OAuth）
- **Firestore** - NoSQL 資料庫
- **Vercel** - 自動化部署平台（Git push 後自動 build + deploy）

### 開發工具

- **pnpm** - 套件管理器
- **ESLint** - Linter（含 simple-import-sort 自動排序）
- **Vitest** - 單元測試與整合測試
- **React Testing Library** - React 組件測試
- **Playwright** - E2E 測試（Chromium、Firefox）
- **Firebase Emulator** - 本地開發與測試環境

---

## 架構設計

### 整體架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                 Vercel Edge / Serverless                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Server Components (Next.js App Router)       │  │
│  │  - app/layout.tsx (Metadata, 字型優化)                │  │
│  │  - app/workout/page.tsx (預取 exercises)             │  │
│  │  → getExercises() 在 server 端執行                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                      │ HTML + serialized data
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Client Components (Hydration)                │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Pages (Client Components)                      │  │  │
│  │  │  - /login, /signup, /forgot-password            │  │  │
│  │  │  - / (Dashboard)                                 │  │  │
│  │  │  - /workout (Workout Management)                 │  │  │
│  │  │  - /inbody (InBody Management)                   │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  State Management                               │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │  React Query (Server State)              │  │  │  │
│  │  │  │  - Queries: workout sessions, inbody,    │  │  │  │
│  │  │  │             exercises                     │  │  │  │
│  │  │  │  - Mutations: add, update, delete         │  │  │  │
│  │  │  │  - Cache: 5min stale, 10min GC           │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │  Context Providers                        │  │  │  │
│  │  │  │  - AuthContext: user, loading            │  │  │  │
│  │  │  │  - AppDataContext: workoutSessions,      │  │  │  │
│  │  │  │                    inBodyRecords, filter │  │  │  │
│  │  │  │  - SidebarContext: sidebar state         │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Firebase SDK (Direct Client Access)          │  │  │
│  │  │  - Authentication                              │  │  │
│  │  │  - Firestore SDK                               │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Backend                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Firebase Authentication                              │  │
│  │  - Email/Password                                     │  │
│  │  - Google OAuth                                       │  │
│  │  - Session Persistence (Local Storage)               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Firestore Database                                   │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Collections                                    │  │  │
│  │  │  - users/{uid}                                  │  │  │
│  │  │  - workout_sessions/{sessionId}                 │  │  │
│  │  │  - in_body_data/{recordId}                      │  │  │
│  │  │  - exercises/{exerciseId} (Global)             │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Security Rules (無需 Cloud Functions)         │  │  │
│  │  │  - 用戶只能存取自己的資料 (uid 驗證)             │  │  │
│  │  │  - exercises 為全局唯讀資料                     │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 渲染策略：混合渲染（Hybrid Rendering）

本專案採用 **Server Components + Client Components** 混合架構，充分利用 Next.js App Router 的優勢：

#### Server Components 使用場景

**1. Root Layout (`app/layout.tsx`)**

```typescript
// Server Component (預設，無 'use client')
export const metadata: Metadata = {
  title: 'Workout Log',
  description: 'Track your fitness journey',
};

export default function RootLayout({ children }) {
  // 字型優化在 server 端處理
  const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
  });

  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**優勢**：

- 字型優化在 build time 完成
- Metadata 直接注入 HTML (SEO 友善)
- 減少 client-side JavaScript

**2. Workout Page (`app/workout/page.tsx`) ⭐ 關鍵優化**

```typescript
// Server Component - 在 server 端預取資料
export default async function WorkoutPage() {
  // 在 server 端獲取 800+ 筆運動資料
  const exerciseData = await getExercises();

  return (
    <AppLayout>
      {/* 資料直接傳給 client component，已包含在 initial HTML */}
      <WorkoutDashboard exerciseData={exerciseData} />
    </AppLayout>
  );
}
```

**優勢**：

- ✅ **避免 client 端下載大量資料**：800+ 筆運動資料在 server 端獲取
- ✅ **更快的初始載入**：資料已序列化在 HTML 中
- ✅ **減少 Waterfall Requests**：不需等待 client-side hydration 才開始獲取
- ✅ **降低 Firebase 讀取成本**：全局資料只在 server 端讀一次，快取在 Vercel Edge

**架構圖**：

```
用戶請求 /workout
    ↓
Vercel Edge/Serverless Function
    ↓
getExercises() → Firestore (exercises collection)
    ↓
Server 端渲染 HTML (包含 exerciseData)
    ↓
返回給 Client (已含資料，無需再次請求)
    ↓
Client 端 hydration (接管互動)
```

#### Client Components 使用場景

**所有互動式組件都是 Client Components**：

```typescript
// app/page.tsx, app/inbody/page.tsx 等
'use client';

export default function Page() {
  // 使用 hooks: useState, useAuth, useAppData
  // React Query 管理用戶資料（workout sessions, inbody records）
}
```

**適用情境**：

1. **認證相關**：`useAuth()` hook 監聽 Firebase Auth 狀態
2. **表單互動**：SessionForm、InBodyForm（大量 useState、useFieldArray）
3. **即時資料**：React Query 管理 workout sessions、inbody records
4. **用戶操作**：按鈕點擊、輸入、modal 開關

#### 為何採用混合架構？

| 需求                     | 解決方案                        | 原因                              |
| ------------------------ | ------------------------------- | --------------------------------- |
| 大量靜態資料 (exercises) | Server Components               | 避免 client 端下載、更快載入      |
| 用戶個人資料 (sessions)  | Client Components + React Query | 即時更新、樂觀 UI、快取管理       |
| 認證狀態                 | Client Components               | Firebase Auth SDK 僅支援 client   |
| 表單互動                 | Client Components               | React Hook Form 需要 client hooks |
| SEO 基礎                 | Server Components (Layout)      | Metadata 直接生成                 |

#### Firebase SDK 在混合架構中的使用

```typescript
// ✅ Server Component 可用
import { getExercises } from '@/lib/db';
const data = await getExercises(); // Firestore SDK 在 server 端也能用

// ❌ Server Component 不可用（需要 browser APIs）
import { useAuth } from '@/lib/AuthContext'; // 依賴 onAuthStateChanged
const { user } = useAuth(); // 錯誤！需要在 Client Component
```

**注意**：Firestore SDK 可以在 server 端使用，但 **Firebase Auth 的 `onAuthStateChanged`** 需要 browser 環境，因此認證邏輯必須在 client 端。

#### 快取分層策略

### ✅ 已實作：React Query Client Cache

**位置**：`app/providers.tsx`

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 分鐘內視為新鮮
      gcTime: 10 * 60 * 1000, // 10 分鐘後垃圾回收
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});
```

**管理的資料**：

- Workout Sessions（用戶個人資料）
- InBody Records（用戶個人資料）

**運作流程**：

1. 首次查詢 → Firestore → cache
2. 5 分鐘內 → 直接返回 cache（零延遲）
3. 5-10 分鐘 → 返回舊資料 + 背景重新獲取
4. Mutations 後 → `invalidateQueries` 強制刷新

---

### ⏳ 待優化：Server Components Cache

**目前狀況**：`app/workout/page.tsx` 每次都重新 fetch

```typescript
// 目前：每次訪問都查詢 Firestore
export default async function WorkoutPage() {
  const exerciseData = await getExercises(); // 800+ 筆
  return <WorkoutDashboard exerciseData={exerciseData} />;
}
```

**問題**：

- 每次訪問 `/workout` 都重新從 Firestore 獲取 800+ 筆 exercises
- 增加 Firebase 讀取成本
- 影響頁面載入速度

**建議優化**：

```typescript
// app/workout/page.tsx (建議)
export const revalidate = 3600; // 1 小時重新驗證

export default async function WorkoutPage() {
  const exerciseData = await getExercises();
  return <WorkoutDashboard exerciseData={exerciseData} />;
}
```

**優勢**：

- 降低 Firebase 讀取次數（exercises 資料很少變動）
- Vercel 會快取渲染結果 1 小時
- 提升頁面載入速度
- 降低成本

---

### ⚠️ Browser Cache

**已實作**：

- ✅ **Auth Persistence** (`localStorage`) - 登入狀態持久化

**未實作**：

- ❌ Service Worker（PWA）
- ❌ Firestore Offline Persistence (`enableIndexedDbPersistence`)

---

## 資料流與狀態管理

### 1. 認證流程 (AuthContext)

```typescript
// lib/AuthContext.tsx
┌──────────────┐
│  AuthContext │  ← onAuthStateChanged (Firebase)
└──────────────┘
      │
      ├─ user: User | null
      └─ loading: boolean

流程：
1. App 啟動 → onAuthStateChanged 監聽
2. 已登入 → setUser(firebaseUser)
3. 未登入 → redirect to /login
4. Logout → signOut() → redirect to /login
```

### 2. 資料獲取流程 (React Query + AppDataContext)

```typescript
// lib/AppDataContext.tsx
┌────────────────┐
│ AppDataContext │
└────────────────┘
      │
      ├─ React Query: workoutSessions
      │   └─ queryKey: ['workoutSessions', uid]
      │   └─ queryFn: getWorkoutSessions({ uid })
      │
      ├─ React Query: inBodyRecords
      │   └─ queryKey: ['inBodyRecords', uid]
      │   └─ queryFn: getInBodyData({ uid })
      │
      ├─ Derived State:
      │   ├─ filteredWorkoutSessions (based on timeRange)
      │   └─ summary (computed from latest data)
      │
      └─ Methods:
          └─ refresh() → queryClient.invalidateQueries()
```

**關鍵優勢**：

- **自動重複請求消除**：相同 queryKey 的請求會自動合併
- **背景更新**：資料過期後自動重新獲取（stale-while-revalidate）
- **樂觀更新**：mutations 可配合 optimistic updates（目前未實作）

### 3. Mutations 流程（以新增 Workout 為例）

```
User Action (SessionForm)
      ↓
onSubmit() → addWorkoutSession({ uid, sessionData })
      ↓
Firebase Firestore: addDoc()
      ↓
Success → onSaved() callback
      ↓
queryClient.invalidateQueries(['workoutSessions', uid])
      ↓
React Query 自動重新獲取 → UI 更新
      ↓
Toast notification (Sonner)
```

---

## 功能實作詳解

### 1. 認證系統

#### 支援方式

- **Email/Password**：`createUserWithEmailAndPassword`、`signInWithEmailAndPassword`
- **Google OAuth**：`signInWithPopup(auth, googleProvider)`
- **密碼重設**：`sendPasswordResetEmail`

#### 實作細節

```typescript
// lib/firebase.ts
// 設定 Auth 持久化：登入狀態保存在 localStorage
setPersistence(auth, browserLocalPersistence);

// components/LoginForm.tsx
const onSubmit = async (data: LoginFormData) => {
  const { email, password } = data;
  await signInWithEmailAndPassword(auth, email, password);
  // AuthContext 自動偵測登入狀態改變 → redirect
  // 登入狀態會持久化，關閉瀏覽器後重新開啟無需重新登入
};

// components/GoogleLoginButton.tsx
const handleGoogleLogin = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  // 同時建立 Firestore user document
  await addUserToDb({ uid: result.user.uid, userData: {...} });
};
```

#### 路由保護

```typescript
// components/AppLayout.tsx
useEffect(() => {
  if (requireAuth && !authLoading && !user) {
    router.push('/login');
  }
}, [user, authLoading]);
```

---

### 2. Workout Session 管理

#### 資料結構

```typescript
interface WorkoutSessionDocument {
  id?: string;
  uid: string;
  date: Date;
  mood?: 'happy' | 'neutral' | 'sad';
  notes?: string;
  exercises: ExerciseDocument[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface ExerciseDocument {
  id: string;
  exerciseId: string; // 關聯至 global exercises
  name: string;
  rpe?: number; // Rate of Perceived Exertion
  sets: WorkoutSetDocument[];
}

interface WorkoutSetDocument {
  id: string;
  reps: number;
  weight: number;
}
```

#### 功能實作

**1. 新增 Session (SessionForm)**

```typescript
// components/SessionForm.tsx
- React Hook Form + Zod 驗證
- useFieldArray 動態新增/刪除 Exercises 與 Sets
- ExerciseSelect: 搜尋 800+ 運動（Fuse.js 模糊搜尋）
- Date Picker (react-day-picker) + Time Input
- Mood Selection (Smile/Neutral/Frown icons)

提交流程：
1. form.handleSubmit(onSubmit)
2. 構建 Firestore document（移除 undefined）
3. addWorkoutSession() → Firestore
4. queryClient.invalidateQueries(['workoutSessions'])
5. Toast success → Dialog close
```

**2. 編輯 Session**

```typescript
// 同 SessionForm，透過 initialData prop 區分
- initialData 存在 → updateWorkoutSession()
- useEffect 監聽 initialData → form.reset(initialData)
```

**3. 刪除 Session**

```typescript
// components/SessionList.tsx
- AlertDialog 二次確認
- deleteWorkoutSession({ sessionId })
- invalidateQueries → 列表自動更新
```

**4. 歷史記錄 (WorkoutHistoryTable)**

```typescript
- 可摺疊卡片 (Collapsible)
- 顯示 Date、Exercises、Mood、Notes
- 點擊展開查看完整 Sets 資訊
```

---

### 3. InBody 數據管理

#### 資料結構

```typescript
interface InBodyDataDocument {
  uid: string;
  reportDate: Date;
  reportTime: string;
  overallScore: number;
  bodyCompositionAnalysis?: {
    totalBodyWater: { value?: number; unit: 'L'; range: string };
    protein: { value?: number; unit: 'kg' | 'lbs'; range: string };
    mineral: { ... };
    bodyFatMass: { ... };
    weight: { ... };
  };
  bodyComposition?: {
    totalWeight: { value: number; unit: 'kg' | 'lbs' };
    skeletalMuscleMass: { ... };
    bodyFatMass: { ... };
    bmi: { ... };
    pbf: { value: number; unit: '%' };
    segmentalLeanAnalysis: { ... };  // 四肢肌肉分析
    segmentalFatAnalysis: { ... };   // 四肢脂肪分析
  };
}
```

#### 功能實作 (InBodyForm)

```typescript
- 複雜表單（30+ 欄位）
- React Hook Form 自動處理數字轉換
- 分區塊輸入：
  1. 基本資訊（日期、時間、總分）
  2. 身體組成分析（水分、蛋白質、礦物質、脂肪、體重）
  3. 詳細組成（BMI、體脂率、骨骼肌）
  4. 四肢分析（左右手臂、軀幹、左右腿）
```

---

### 4. Dashboard 統計

#### 實作邏輯 (lib/summary.ts)

```typescript
// Pure functions for summary computations
export function computeSummaryInfo(
  sessions: WorkoutSessionDocument[],
  inbodies: InBodyDataDocument[]
): SummaryInfo {
  // 1. 最新 Workout：日期、Mood
  // 2. 最新 InBody：
  //    - 當前值：weight, pbf, smm
  //    - 變化量：與上一筆比較 (delta)
}

// 使用在 Dashboard.tsx
const summary = computeSummaryInfo(filteredWorkoutSessions, inBodyRecords);
```

#### 顯示卡片

```typescript
1. Latest Workout
   - 日期 + Mood icon
   - 預覽前 2 個運動名稱

2. Latest InBody
   - 日期
   - 體重 + delta (紅↑ / 綠↓)
   - 體脂率 (PBF) + delta
   - 骨骼肌 (SMM) + delta

3. 統計卡片
   - Total Workouts (本月新增數量)
   - InBody Records
   - Combined Activities
```

---

### 5. 運動資料庫 (Exercises)

#### 資料來源

- GitHub: [wrkout/exercises.json](https://github.com/wrkout/exercises.json)
- 800+ 筆運動數據

#### Schema

```typescript
interface ExerciseData {
  id: string;
  titleEn: string;
  titleZh: string;
  aliases: string[];
  force: string | null;
  level: string; // beginner, intermediate, expert
  mechanic: string | null; // compound, isolation
  bodyPart: string; // chest, back, legs, etc.
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string | null; // barbell, dumbbell, bodyweight
  instructionsEn: string[];
  instructionsZh: string[];
  category: string;
  thumbnailUrl?: string;
  isCardio: boolean;
  type: 'global' | 'custom';
  createdBy: 'system' | string;
}
```

#### 搜尋實作 (ExerciseSelect)

```typescript
// components/ExerciseSelect.tsx
- Combobox (shadcn/ui)
- Fuse.js 模糊搜尋：
  - 搜尋欄位：titleEn, titleZh, aliases
  - threshold: 0.3
- 即時過濾顯示
- 點選後自動填入 exerciseId 與 name
```

---

## 測試策略

### 測試金字塔

```
        ┌──────────┐
        │   E2E    │  ← Playwright (3 個流程)
        │ (3 tests)│
        └──────────┘
       ┌────────────┐
       │ Integration│  ← Vitest + Firebase Emulator
       │  (DB Layer)│
       └────────────┘
    ┌────────────────┐
    │  Unit Tests    │  ← Vitest + React Testing Library
    │  (Components)  │
    └────────────────┘
```

### 1. 單元測試 (Vitest + React Testing Library)

#### 配置 (vitest.config.unit.ts)

```typescript
{
  include: ['**/__tests__/**/*.unit.test.ts?(x)'],
  environment: 'jsdom',
  setupFiles: ['./vitest.setup.unit.ts']
}
```

#### 測試範例

```typescript
// components/__tests__/SessionForm.unit.test.tsx
describe('SessionForm', () => {
  it('should render form fields correctly', () => {
    render(<SessionForm {...props} />);
    expect(screen.getByLabelText('Date & Time')).toBeInTheDocument();
    expect(screen.getByLabelText('Mood')).toBeInTheDocument();
  });

  it('should add a new set when "Add Set" button is clicked', async () => {
    const user = userEvent.setup();
    render(<SessionForm {...props} />);

    await user.click(screen.getByRole('button', { name: 'Add Set' }));
    expect(screen.getAllByTestId('weight-input')).toHaveLength(2);
  });
});
```

### 2. 整合測試 (Firebase Emulator)

#### 配置 (vitest.config.int.ts)

```typescript
{
  include: ['**/__tests__/**/*.int.test.ts?(x)'],
  environment: 'node',
  setupFiles: ['./vitest.setup.int.ts']
}
```

#### 測試範例

```typescript
// lib/__tests__/db.int.test.ts
describe('Firestore DB Integration', () => {
  beforeAll(async () => {
    // 連接 Firebase Emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
  });

  afterEach(async () => {
    // 清空測試資料
    await clearFirestoreData(projectId);
  });

  it('should add and retrieve workout session', async () => {
    const docRef = await addWorkoutSession({ uid, sessionData });
    const sessions = await getWorkoutSessions({ uid });

    expect(sessions).toHaveLength(1);
    expect(sessions[0].date).toEqual(sessionData.date);
  });
});
```

### 3. E2E 測試 (Playwright)

#### 配置 (playwright.config.ts)

```typescript
{
  testDir: './e2e',
  projects: [
    { name: 'chromium' },
    { name: 'firefox' }
    // webkit 暫時 skip（Firebase Auth 兼容性問題）
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000'
  }
}
```

#### 測試流程 (e2e/workout.spec.ts)

**1. Authentication Setup**

```typescript
// e2e/auth.spec.ts - 執行一次儲存 session
test('should log in and save session', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('/');
  await page.context().storageState({ path: 'storageState.json' });
});
```

**2. Workout CRUD Tests**

```typescript
// 使用已儲存的 session
test.use({ storageState: 'storageState.json' });

test('should create a new workout session', async ({ page }) => {
  // 1. 開啟表單
  await page.click('button[name="Add New Session"]');

  // 2. 選擇運動
  await page.click('[data-testid="exercise-select"]');
  await page.fill('input[placeholder="Search by name"]', 'Bench Press');
  await page.click('role=option[name="Dumbbell Bench Press"]');

  // 3. 填寫 Sets
  await page.fill('[data-testid="weight-input"]', '60');
  await page.fill('[data-testid="reps-input"]', '10');

  // 4. 儲存
  await page.click('button[name="Save Session"]');

  // 5. 驗證
  await expect(page.getByText(/Session for .* has been saved/)).toBeVisible();
});
```

**3. InBody Tests**

```typescript
// e2e/inbody.spec.ts
- 新增記錄
- 編輯記錄
- 刪除記錄（含二次確認）
```

### 測試覆蓋率目標

- **單元測試**：組件邏輯 > 70%
- **整合測試**：DB 層 CRUD 100%
- **E2E 測試**：核心用戶流程（登入、新增/編輯/刪除 Workout/InBody）

---

## 效能優化

### 1. 已實作優化

#### 1.1 **Code Splitting** ✅

- **位置**：Next.js App Router 自動處理
- **實作**：每個 route 自動分割成獨立 chunk（無需手動配置）
- **效果**：
  ```
  app/workout/page.tsx → workout-[hash].js
  app/inbody/page.tsx → inbody-[hash].js
  app/login/page.tsx → login-[hash].js
  ```

#### 1.2 **Dynamic Import (Lazy Loading)** ✅

- **位置**：`app/inbody/page.tsx`
- **實作**：InBodyForm 僅在開啟 modal 時才載入

  ```typescript
  const InBodyForm = dynamic(
    () =>
      import('@/components/InBodyForm').then((mod) => ({
        default: mod.InBodyForm,
      })),
    {
      loading: () => <Skeleton />,
      ssr: false, // Form doesn't need SSR
    }
  );
  ```

- **優勢**：減少首次載入 bundle size（InBodyForm 有 30+ 欄位）

#### 1.3 **Font Optimization** ✅

- **位置**：`app/layout.tsx`
- **實作**：使用 `next/font` 自動優化

  ```typescript
  import { Geist, Geist_Mono } from 'next/font/google';

  const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'], // 只載入需要的字集
  });
  ```

- **優勢**：
  - 自動 self-hosting（不依賴 Google CDN）
  - 預設 `font-display: swap`（避免 FOIT）
  - Build time 下載並內嵌字型

#### 1.4 **Server-Side Data Fetching** ✅

- **位置**：`app/workout/page.tsx`
- **實作**：在 server 端預取 exercises 資料

  ```typescript
  export default async function WorkoutPage() {
    const exerciseData = await getExercises(); // Server-side fetch
    return <WorkoutDashboard exerciseData={exerciseData} />;
  }
  ```

- **優勢**：
  - 避免 client-side waterfall requests
  - 資料已序列化在 HTML 中
  - 減少首次內容繪製時間（LCP）

#### 1.5 **Auth Persistence** ✅

- **位置**：`lib/firebase.ts` (第 26 行)
- **實作**：

  ```typescript
  import { browserLocalPersistence, setPersistence } from 'firebase/auth';

  setPersistence(auth, browserLocalPersistence);
  ```

- **優勢**：關閉瀏覽器後重新開啟無需重新登入

---

### 2. Core Web Vitals 考量

#### 預期指標（未實測）

```
- LCP (Largest Contentful Paint): ~2.5s
  → 主要內容為 Dashboard 卡片，等待 Firebase 查詢

- INP (Interaction to Next Paint): < 200ms
  → React 19 並發渲染 + 事件優化

- CLS (Cumulative Layout Shift): < 0.1
  → Skeleton loaders 預留空間
```

#### 待優化項目

1. **Bundle 分析**

   - 使用 `@next/bundle-analyzer` 找出大型依賴
   - 預期大型依賴：Firebase SDK (~200KB), React Query, Radix UI

2. **圖片優化**
   - 目前無大量圖片
   - 未來可用 `next/image` 自動優化

---

### 3. React Query 快取策略

#### Stale-While-Revalidate 實作

```typescript
// app/providers.tsx
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分鐘內視為新鮮
      gcTime: 10 * 60 * 1000, // 10分鐘後垃圾回收
      refetchOnWindowFocus: false, // 不在 focus 時重新獲取
      retry: 2, // 失敗重試 2 次
    },
  },
});
```

**運作流程**：

1. 首次查詢 → 從 Firestore 獲取 → 快取
2. 5 分鐘內再次查詢 → 直接從快取返回（不觸發網路請求）
3. 5 分鐘後查詢 → 返回快取（stale data），背景重新獲取
4. 10 分鐘後無人使用 → 自動清除快取

#### 手動 Invalidation

```typescript
// lib/AppDataContext.tsx
const refresh = async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['workoutSessions', uid] }),
    queryClient.invalidateQueries({ queryKey: ['inBodyRecords', uid] })
  ]);
};

// Mutations 後自動觸發
await addWorkoutSession(...);
await refresh();  // 強制重新獲取最新資料
```

---

### 4. 錯誤處理與離線支援

#### 目前實作

```typescript
// React Query 錯誤處理
const { error } = useQuery({
  queryKey: ['workoutSessions', uid],
  queryFn: () => getWorkoutSessions({ uid }),
  retry: 2, // 自動重試
});

if (error) {
  toast.error('Failed to load data. Please try again.');
}
```

#### 未來改進方向

1. **完整離線支援**（目前僅有 Auth 持久化）

   - 啟用 Firestore 離線持久化：`enableIndexedDbPersistence(db)`

     ```typescript
     // lib/firebase.ts (未來可加入)
     import { enableIndexedDbPersistence } from 'firebase/firestore';

     enableIndexedDbPersistence(db).catch((err) => {
       if (err.code === 'failed-precondition') {
         // 多個分頁同時開啟
       } else if (err.code === 'unimplemented') {
         // 瀏覽器不支援
       }
     });
     ```

   - React Query Persist Plugin（IndexedDB）
   - Service Worker 快取靜態資源

2. **Optimistic Updates**

   ```typescript
   // 範例：刪除時立即更新 UI
   const mutation = useMutation({
     mutationFn: deleteWorkoutSession,
     onMutate: async (sessionId) => {
       await queryClient.cancelQueries(['workoutSessions', uid]);
       const previous = queryClient.getQueryData(['workoutSessions', uid]);

       queryClient.setQueryData(['workoutSessions', uid], (old) =>
         old.filter((s) => s.id !== sessionId)
       );

       return { previous };
     },
     onError: (err, variables, context) => {
       queryClient.setQueryData(['workoutSessions', uid], context.previous);
       toast.error('Failed to delete');
     },
   });
   ```

3. **Error Boundary**
   ```tsx
   // 未來可加入
   <ErrorBoundary fallback={<ErrorPage />}>
     <App />
   </ErrorBoundary>
   ```

---

## 安全性設計

### Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper Functions
    function isSignedIn() {
      return request.auth != null;
    }
    function authUid() {
      return isSignedIn() ? request.auth.uid : null;
    }
    function newOwnerId() {
      return request.resource.data.uid;
    }
    function existingOwnerId() {
      return resource.data.uid;
    }

    // Workout Sessions: 只能存取自己的資料
    match /workout_sessions/{sessionId} {
      allow create: if isSignedIn() && newOwnerId() == authUid();
      allow read, update, delete: if isSignedIn() && existingOwnerId() == authUid();
    }

    // Users: 只能操作自己的 user document
    match /users/{userId} {
      allow create: if authUid() == userId;
      allow read, update: if authUid() == userId;
    }

    // InBody Data: 同樣限制 + 防止修改 createdAt
    match /in_body_data/{recordId} {
      allow create: if isSignedIn() && newOwnerId() == authUid();
      allow read: if isSignedIn() && existingOwnerId() == authUid();
      allow update: if isSignedIn()
        && existingOwnerId() == authUid()
        && newOwnerId() == existingOwnerId()
        && request.resource.data.createdAt == resource.data.createdAt;
      allow delete: if isSignedIn() && existingOwnerId() == authUid();
    }

    // Exercises: 全局唯讀（公開資料）
    match /exercises/{exerciseId} {
      allow read: if true;
    }
  }
}
```

### 安全性優勢

1. **無需後端驗證**：Rules 直接在 Firestore 層執行
2. **類型安全**：TypeScript + Zod 防止無效資料
3. **XSS 防護**：React 自動 escape 輸出
4. **CSRF**：Firebase Auth 內建防護

---

## 部署與 CI/CD

### 目前架構：Vercel 自動化部署 ✅

專案已部署在 **Vercel**，享有以下自動化流程：

```
Git Repository (GitHub/GitLab)
       ↓
   git push
       ↓
Vercel 自動偵測變更
       ↓
┌──────────────────────┐
│ 1. Install (pnpm)    │
│ 2. Build (next build)│
│ 3. Deploy to CDN     │
└──────────────────────┘
       ↓
Production URL 自動更新
```

#### Vercel 部署配置

**自動觸發條件**：

- ✅ Push to `main` → Production 部署
- ✅ Pull Request → Preview 部署
- ✅ 環境變數透過 Vercel Dashboard 管理

**Build 設定**：

```bash
# Vercel 自動執行
pnpm install
pnpm build  # next build --turbopack
```

**Server Components 支援**：

- Vercel Edge Functions / Serverless Functions 執行 Server Components
- 自動程式碼分割與優化
- 全球 CDN 快取靜態資源

#### 環境變數管理

```bash
# .env.local (本地開發，不納入 Git)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... 其他 Firebase 配置

# Vercel Dashboard (生產環境)
# 透過 Vercel UI 或 CLI 設定
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
```

### 待改進：測試自動化

雖然部署已自動化，但 **pre-deploy 驗證流程**尚未整合：

```yaml
# .github/workflows/ci.yml (建議新增)
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint # ✅ 檢查程式碼品質

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test # ✅ Unit + Integration Tests

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: npx playwright install
      - run: pnpm playwright test # ✅ E2E Tests


  # Vercel 會在 tests 成功後自動部署（需配置 Vercel + GitHub integration）
```

**優勢**：

- 🚫 防止有 linting 錯誤的程式碼部署
- 🚫 防止測試失敗的版本上線
- ✅ PR 中顯示測試結果

### 部署平台優勢

**為何選擇 Vercel？**

| 功能              | Vercel             | Firebase Hosting      |
| ----------------- | ------------------ | --------------------- |
| Next.js 支援      | ⭐⭐⭐ 原生整合    | ⚠️ 需手動配置         |
| Server Components | ✅ 自動支援        | ❌ 僅靜態檔案         |
| Edge Functions    | ✅ 全球分布        | ❌ 無                 |
| 自動 Preview      | ✅ PR 預覽部署     | ⚠️ 需手動設定         |
| 零配置            | ✅ Git push 即部署 | ⚠️ 需 `firebase.json` |

**目前狀態**：

- ✅ Vercel 生產環境部署
- ✅ Git push 自動觸發
- ⏳ CI 測試流程（待整合 GitHub Actions）

---

## 專案啟動指南

> 下列步驟涵蓋環境變數、Firebase Emulator、本地測試帳號、資料種子與常用指令。

### 1. 安裝依賴與 Node 版本

```bash
pnpm install
```

- 建議 Node 版本：20 以上。
- 已設定 `@/*` 絕對匯入（見 `tsconfig.json` → `paths`）。

### 2. 設定環境變數（.env.local）

在專案根目錄建立 `.env.local`：

```bash
# Firebase client config（請從 Firebase Console 專案設定複製）
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# 啟用本地 Emulator（本地開發/測試建議開啟）
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

### 3. 啟動 Firebase Emulator 與開發伺服器

開兩個終端視窗：

```bash
# Terminal A
pnpm exec firebase emulators:start

# Terminal B
pnpm dev
```

- Emulator UI：`http://localhost:4000`

### 4. 建立本地測試帳號（E2E 需要）

- 於 Emulator UI 建立帳號（或以實際 Firebase 專案建立）：
  - Email：`test-user@example.com`
  - Password：`password123`
- 若調整帳號，請同步更新 `e2e/auth.spec.ts` 測試使用的憑證。

### 5. 匯入資料（Seeding）

部分功能（例如 800+ 運動資料搜尋）需要先寫入 Firestore。

1. 全域運動資料（exercises）：

```bash
# 注意：scripts/seed-exercises.ts 預設讀 scripts/data/raw_data.json
# 此專案中實際檔名為 scripts/data/exercise_raw_data.json
# 請調整腳本路徑或重新命名檔案後再執行
pnpm tsx scripts/seed-exercises.ts
```

2. 模擬使用者資料（workout + inbody）：

```bash
# 需在專案根目錄放置 Firebase Admin 的 service_account.json（不要提交到 Git）
pnpm tsx scripts/seed-mock-user.ts               # 同時寫入 workout + inbody
pnpm tsx scripts/seed-mock-user.ts --only=workout
pnpm tsx scripts/seed-mock-user.ts --only=inbody
```

### 6. 常用指令

```bash
pnpm lint              # 檢查 Lint
pnpm test:unit         # 單元測試（jsdom）
pnpm test:int          # 整合測試（需 Emulator）
pnpm playwright test   # E2E 測試
pnpm build             # 生產建置
```

> 備註：Safari/WebKit 在 Firebase Auth 上有既知相容性問題，Playwright 設定已暫時停用 webkit 專案。

## 未來優化方向

### 1. 效能監控

- **Firebase Performance Monitoring**：追蹤 API 延遲
- **Vercel Analytics**：Real User Monitoring (RUM)
- **Web Vitals 追蹤**：

  ```typescript
  import { onCLS, onINP, onLCP } from 'web-vitals';

  onLCP(console.log);
  onINP(console.log);
  onCLS(console.log);
  ```

### 2. 功能增強

- **圖表視覺化**：Recharts / Chart.js 顯示進度曲線
- **社群功能**：好友、分享 Workout
- **AI 建議**：根據歷史推薦訓練計劃
- **完整離線支援**：Firestore 離線持久化 + PWA (Service Worker + Manifest)

### 3. 架構演進

- **Monorepo**：Turborepo 管理前後端
- **自訂 API**：若需複雜查詢可加 Next.js API Routes
- **Microservices**：分離運動資料服務（若資料量大）

---

## 專案腳本指令

```json
{
  "dev": "next dev --turbopack", // 開發伺服器（Turbopack）
  "build": "next build --turbopack", // 生產建置
  "start": "next start", // 生產伺服器
  "lint": "eslint .", // 檢查 Lint
  "lint:fix": "eslint . --fix", // 自動修復
  "test": "vitest --run -c vitest.config.unit.ts && vitest --run -c vitest.config.int.ts",
  "test:unit": "vitest -c vitest.config.unit.ts",
  "test:int": "vitest -c vitest.config.int.ts",
  "test:ui": "vitest --ui -c vitest.config.unit.ts"
}
```

---

## 總結

### 專案亮點

1. **混合渲染架構**：Server Components 優化初始載入 + Client Components 處理互動
2. **類型安全**：TypeScript + Zod 全棧類型檢查
3. **完整測試**：Unit + Integration + E2E 三層覆蓋
4. **現代工具鏈**：Next.js 15, React 19, TanStack Query, Tailwind v4
5. **自動化部署**：Vercel Git push 即部署，零配置
6. **可擴展性**：模組化設計，易於新增功能

### 技術取捨決策摘要

| 決策     | 選擇                              | 原因                             |
| -------- | --------------------------------- | -------------------------------- |
| 渲染策略 | Server + Client Components (混合) | 靜態資料 SSR、互動邏輯 CSR       |
| 狀態管理 | React Query + Context             | 伺服器狀態快取 + 全局狀態分離    |
| 表單處理 | React Hook Form                   | 效能佳、整合 Zod 驗證            |
| UI 組件  | shadcn/ui                         | 可客製化、無鎖定風險             |
| 測試框架 | Vitest + Playwright               | 速度快、與 Vite 整合佳           |
| 套件管理 | pnpm                              | 磁碟效率、monorepo 友善          |
| 部署平台 | Vercel                            | Next.js 原生支援、零配置自動部署 |

### 待改進項目

- [ ] GitHub Actions CI（pre-deploy linting + testing）
- [ ] Core Web Vitals 實測與優化
- [ ] Optimistic Updates 實作
- [ ] 完整離線支援（Firestore Persistence + PWA）
- [ ] 錯誤監控（Sentry / Vercel Analytics）
- [ ] 數據視覺化圖表

---

**文檔版本**: 1.0  
**更新日期**: 2025-10-20 
**作者**: AI Assistant (based on codebase analysis)
