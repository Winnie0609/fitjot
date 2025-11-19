## 專案總覽：這個 Workout Log（FitJot）在做什麼

這是一個以 **Next.js 15 + React 19 + Firebase** 打造的全端健身紀錄應用（FitJot）。目標是讓使用者用「像筆記本一樣直覺、但比試算表強大」的方式，紀錄：

- **Workout Sessions**：每一天的訓練內容（動作、組數、重量、RPE、心情、備註）
- **InBody / 體成分**：體重、骨骼肌量、體脂率、InBody score 等指標
- **Dashboard 視覺化**：用圖表與統計卡片，一眼看到近期訓練頻率、最常練的部位、體重與體脂趨勢

整體走 **Server-First 架構 + Client-Side 互動** 的設計：  
靜態 & 共用資料（例如 800+ exercises catalog）盡量在 **Server Component / 伺服器端先抓好**；  
個人化 & 高互動的資料（workout、InBody、auth 狀態）則交給 **Client Components + React Query + Firebase SDK** 處理。

---

## 功能導覽 & 使用流程（從使用者角度）

### 1. 認證流程（Login / Signup / Forgot Password）

- 相關檔案：
  - `app/login/page.tsx`、`components/LoginForm.tsx`
  - `app/signup/page.tsx`、`components/SignUpForm.tsx`
  - `app/forgot-password/page.tsx`、`components/ForgotPasswordForm.tsx`
  - `lib/firebase.ts`、`lib/AuthContext.tsx`

**流程（以 Email/Password 為例）：**

1. 使用者進到 `/login` 或 `/signup`  
   - 這些 `page.tsx` 都是 **Client Components**，因為要使用 router push、讀取 Firebase auth 狀態。
   - 外層包一層 `AppLayout`，但 `requireAuth={false}`，避免未登入就被 redirect。
2. 表單本身使用：
   - **React Hook Form + Zod schema 驗證**
   - **shadcn/ui** 的 `Form / Input / Button` 做 UI
3. 提交時呼叫 Firebase Auth SDK（`createUserWithEmailAndPassword`、`signInWithEmailAndPassword` 等，封裝在表單元件裡），成功後：
   - Firebase Auth 建立 user
   - `lib/db.ts` 裡的 `addUserToDb` 會在 Firestore 的 `users` collection 建立 profile document（使用 `serverTimestamp()`）
4. `lib/AuthContext.tsx` 內部用 `onAuthStateChanged(auth, ...)` 監聽登入狀態：
   - 把 `user`（Firebase User）跟 `userProfile`（Firestore 的 `UserDocument`）放進 Context
   - 在 `app/page.tsx` 與其他頁面中即可用 `useAuth()` 取得

**技術亮點 & 可以跟面試官講的點：**

- **Firebase Auth + Firestore profile 分離**：  
  把登入資訊（email, uid）與應用程式 profile（`isOnboard`、顯示名稱）拆開，有利之後要擴充更多使用者欄位。
- **AuthContext 設計**：  
  `AuthProvider` 是 Client Component，包在 `app/providers.tsx` 中，這樣 app router 下所有頁都可以取得 `user` 狀態；  
  這樣比在每個頁面各自 `onAuthStateChanged` 更乾淨。
- **Local Persistence**：  
  在 `lib/firebase.ts` 中設定 `setPersistence(auth, browserLocalPersistence)`，使用者重新開啟瀏覽器仍維持登入，UX 佳。

---

### 2. Dashboard（首頁 `/`）— 資料視覺化與總覽

- 相關檔案：
  - `app/page.tsx`
  - `components/Dashboard.tsx`
  - `lib/AppDataContext.tsx`
  - `lib/summary.ts`

**使用流程：**

1. 使用者進入 `/`（`app/page.tsx`）：
   - `HomePage` 是 **Client Component**，用 `useAuth()` 讀取登入狀態。
   - 若 `loading`：顯示 `FullScreenLoader`
   - 若沒登入：顯示 `LandingPage`（行銷頁）
   - 若登入：顯示 `AppLayout` + `Dashboard`
2. `Dashboard` 內部透過 `useAppData()` 讀取：
   - 全部的 `workoutSessions`、`inBodyRecords`
   - 依照 time range（week / month / all）過濾後的資料
   - 由 `lib/AppDataContext.tsx` 使用 **React Query** 去打 `lib/db.ts` 的 Firestore API
3. UI 上有幾塊：
   - **Quick Actions**：「Add New Session」、「Add New Record」按鈕，直接 router push 到 `/workout` / `/inbody`
   - **統計卡片**：Total workouts、InBody records 數量、最近 7 天訓練頻率、最常訓練肌群
     - 使用 `computeSummaryInfo`、`getWorkoutCategories` 計算
   - **最新 Workout / 最新 InBody** 區塊：  
     顯示最近一次訓練的日期、心情表情 icon（`Smile / Meh / Frown`）、該天做了哪些肌群；  
     InBody 則顯示最新體重與 PBF，並計算 delta（相比前一次的變化值）
   - **Charts 分析**：
     - 使用 **Recharts** 做 LineChart / BarChart / PieChart
     - Weight Trend / Body Fat Trend 是用 **filtered InBody records** 產生
     - Workout Categories pie chart：用 `getWorkoutCategories` 將所有 sessions 的 exercises 映射到肌群分類
     - Top 5 exercises：統計在時間範圍內出現次數最多的動作

**技術亮點：**

- **React Query + 自製 AppDataContext**：
  - 集中管理 user 的 Workout / InBody / Profile 相關資料與 loading/error 狀態
  - `timeRange` 也是存在這個 context 內，Dashboard 的圖表只要訂閱 context，不需要自己再打 API。
- **Server state vs Client state 清楚分工**：
  - Firebase Firestore 的資料透過 React Query 管理（快取、revalidation、refetch）
  - Dashboard 的 UI 狀態（timeRange、圖表選擇）由 React state 管理，互不混淆。
- **圖表數據前處理**：
  - 例如 `getWorkoutCategories` 會把 `exercises` 用 bodyPart / category 分群，用 Map 累積計數，最後再產出 pie chart 的 input format。
  - 可講你如何從「原始紀錄 schema」轉成「視覺化友善的資料結構」。

---

### 3. Workout Sessions 功能（/workout）

- 相關檔案：
  - `app/workout/page.tsx`
  - `components/WorkoutDashboard.tsx`
  - `components/SessionForm.tsx`
  - `components/WorkoutHistoryTable.tsx` / `SessionList.tsx`
  - `components/ExerciseSelect.tsx`
  - `lib/db.ts`、`lib/types.ts`

#### 流程：查看列表 + 建立 / 編輯 / 刪除 Session

1. **Server Component 預抓 Exercise catalog**
   - `app/workout/page.tsx` 是 **Server Component**  
   - 進入頁面時先在伺服器呼叫 `getExercises()`（`lib/db.ts`）
   - 這個 collection 是 **800+ exercises**，基本上屬於「幾乎不變的眾多靜態資料」，適合用 **Server Side fetching**，直接序列化成 props 給 client
2. **Client 端顯示 & 互動**
   - `WorkoutDashboard` 是 **Client Component**
   - 接收 `exerciseData` 做為 prop
   - 透過 `useAppData()` 讀取目前使用者的 `workoutSessions`（已由 React Query 連 Firestore）
   - 頂部有「Add New Session」按鈕，打開 modal
3. **表單（SessionForm）為 lazy-loaded Client Component**
   - `WorkoutDashboard` 中使用 `next/dynamic`：
     - `const SessionForm = dynamic(() => import('...').then(mod => ({ default: mod.SessionForm })), { ssr: false, loading: <Skeleton...> })`
   - 只有在 `isFormOpen === true` 時才載入該 chunk → 減少 `/workout` 首屏 JS 體積
4. **SessionForm 內部**
   - 使用 **React Hook Form + Zod** 做 schema 驗證
   - `Session` 的 domain model：
     - 一個 Session 包含 `date`, `mood`, `notes`, `exercises`
     - 每個 exercise 有 `id`, `exerciseId`, `name`, `rpe`, `sets`
     - set = `{ id, reps, weight }`
   - `useFieldArray` 用來管理 `exercises` 與每個 exercise 內的 `sets`
   - Exercise 選擇使用 `ExerciseSelect`，內部會使用 search（fuse.js）在 800+ exercise catalog 中搜尋（Client-only）
   - 提交時：
     - 先透過 zod schema 做型別與數值清洗
     - 再將結果轉成 Firestore 的 `WorkoutSessionDocument`（在 `lib/types.ts` 定義）
     - 呼叫 `addWorkoutSession` 或 `updateWorkoutSession`
     - 這兩個 function 內部都會補上 `uid`，並用 `serverTimestamp()` 設定 `createdAt`/`updatedAt`
   - 成功後呼叫 `onSaved`，外層 `WorkoutDashboard` 會 `await refresh()`（讓 React Query invalidate cache，再抓一次資料）
5. **刪除 Session**
   - 點擊 `WorkoutHistoryTable` 上的 Trash icon
   - 先打開 `AlertDialog` 確認，再呼叫 `deleteWorkoutSession`，同樣 `refresh` 一次

#### 為什麼這頁要 Server + Client 分工？

- **Exercise catalog** 屬於大型、幾乎不變的資料：
  - 在 Server Component 中 prefetch 可以：
    - 減少 client 初始化時的 waterfall
    - React Query 不需要再打一個額外 HTTP call，只是拿 props 即可
  - 更符合 Next.js 15 推薦的「Server-first」資料載入方式
- **SessionForm / ExerciseSelect 為 pure client-only 邏輯：**
  - 依賴 `window` / `crypto.randomUUID` / search library / focus 管理等，做成 Client Component 較合理
  - 透過 **dynamic import + `ssr: false`**，把這一大塊 UI 從首屏 bundle 拆出去 → 減少 `/workout` 首次載入 JS 大小

#### 可以聊的亮點：

- **Zod + React Hook Form + nested field arrays**：  
  如何設計 schema 來支援「多個動作、多個 set」，並在型別安全與 UX 上取得平衡。
- **deepClean 工具（`lib/utils.ts`）**：
  - 傳到 Firestore 前會把 `undefined/null`、空物件都清掉，避免不必要的欄位污染 DB schema。
- **樂觀 UI / Revalidation**：
  - 雖然這裡沒有做 aggressive optimistic update，但用 `React Query` 的 `invalidateQueries` 確保 **所有使用 `workoutSessions` 的地方（Dashboard、Calendar、History）都同步更新**，這可以說是「資料一致性」的考量。

---

### 4. InBody 功能（/inbody）

- 相關檔案：
  - `app/inbody/page.tsx`
  - `components/InBodyForm.tsx`
  - `components/InBodyHistoryTable.tsx`
  - `lib/db.ts`、`lib/types.ts`

#### 流程：記錄 InBody + 檢視歷史紀錄

1. `/inbody` 本身是 **Client Page Component**：
   - 外層 `AppLayout`
   - 內部 `InBodyPageContent` 用 `useAuth()` 和 `useAppData()` 取得登入者的 InBody records
2. 顯示列表：
   - `InBodyHistoryTable` 用 **@tanstack/react-table** 呈現成桌面版表格 + 行動版卡片列表
   - 可展開 row 看細節（body composition / analysis）
3. 建立 / 編輯 Record：
   - 「Add New Record」按鈕會開啟全畫面 modal  
   - `InBodyForm` 一樣透過 `next/dynamic` dynamic import + `ssr: false`（lazy load）
   - 若編輯則會把該筆 record 帶入 `initialData`
4. InBodyForm 設計：
   - 上半部有 **Quick Log**：只輸入 Weight / PBF 就可以快速送出
   - 下半部是完整的 InBody 欄位（score, weight, SMM, BFM, BMI, segmental analysis 等）
   - 全部 schema 用 **Zod**，而且很刻意設計成「大部分欄位 optional」，搭配 `deepClean`，只會把使用者真正填寫的欄位寫入 Firestore
   - 有一個 cross-field refine：檢查至少要填 `Weight` 或 `PBF` 其中一個，避免存入完全空白的 InBody
   - 右上角還預留「Auto-fill with Photo」UX：目前只顯示「coming soon」toast，未開發但可作為 roadmap / 可談的延伸功能（未來可掛上 OCR / Vision API）

**技術亮點：**

- **欄位極多、且深度巢狀的表單 schema 設計**：  
  InBody 原始報告其實非常龐雜，專案刻意用 Zod 定義嵌套物件（bodyComposition, bodyCompositionAnalysis, segmentalLeanAnalysis, segmentalFatAnalysis），但透過 **optional + partial + deepClean** 控制「實際存進 DB 的結構」。
- **responsive 表格 + row 展開**：  
  `InBodyHistoryTable` 同時支援桌面與行動裝置：
  - Desktop 用 `Table` + row expand 來避免一次露出所有欄位
  - Mobile 則用 card + collapsible 方式呈現，同一組資料兩種 layout

---

### 5. Landing Page（行銷 / Onboarding）

- 相關檔案：
  - `components/LandingPage.tsx`
  - `constants/navigation.ts`

這個部分比較偏設計 / 前端動效，但也有幾個可講的技術點：

- **單頁 scroll 導覽 + active section detection**
  - 用 `useEffect` 監聽 scroll，計算每個 `section[id]` 的位置來設定 `activeSection`
  - 導覽列用 `NAVIGATION_ITEMS` 常數定義，`NavItem` 元件根據 active 給不同樣式
- **平滑捲動 & sticky navbar**
  - `handleSmoothScroll` 使用 `window.scrollTo({ behavior: 'smooth' })`
  - `nav` 使用 `sticky top-2` + glassmorphism 風格 + 圓角，配合 Logo 讓產品感更強
- **圖像資產最佳化**
  - 所有 hero / mockup 圖片使用 `next/image`，並利用 `priority` 和適當尺寸避免 layout shift

這一頁是你可以跟面試官展示「不只是做 CRUD，也有在意 UX 與品牌感」的地方。

---

## Server Component vs Client Component：分工與理由

### Server Components（主要）

- `app/layout.tsx`
  - 設定全域字體（`next/font` + Geist）與 metadata
  - 在 `<head>` 裡預先做 `dns-prefetch` / `preconnect` 到 Firebase / Google APIs → **降低 TLS handshake 延遲**
  - 包 `Providers`（其實裡面才是 client）
- `app/workout/page.tsx`
  - 在伺服器用 `getExercises()` 抓 exercise catalog，再把結果序列化給 client

**選擇 Server Component 的理由：**

- 不需要直接操作瀏覽器或事件的頁面邏輯，盡量保持在 server，減少 client JS 負擔。
- 把較大的、與 user 無關的資料（exercise catalog）放在 server-side fetch，避免 client「先載入再打 API」的 waterfall。

### Client Components（互動、狀態、Firebase SDK）

- 使用 `use client` 的檔案（節錄）：
  - `app/page.tsx`、`app/inbody/page.tsx`、`app/login/page.tsx`、`app/signup/page.tsx`
  - `lib/AuthContext.tsx`、`lib/AppDataContext.tsx`
  - 所有表單和 dashboard 元件：`Dashboard.tsx`、`WorkoutDashboard.tsx`、`InBodyForm.tsx`、`SessionForm.tsx`、`WorkoutHistoryTable.tsx`、`InBodyHistoryTable.tsx` 等

**必須是 Client 的理由：**

- 要用到：
  - `useState` / `useEffect` / `useRouter`（Next navigation）
  - Firebase 客戶端 SDK（`onAuthStateChanged`, `getDocs`, `getFirestore` 等）
  - 第三方 UI library 的互動元件（Recharts、React Hook Form）
- 某些元件需要依賴瀏覽器 API（例如 localStorage、window、拖拉檔案事件等），因此不能在 Server Component 執行。

### Lazy Loading（Dynamic Import）的應用

- `InBodyForm` 和 `SessionForm` 都是用 `next/dynamic` + `ssr: false`：
  - 在 `/inbody` 和 `/workout` 初次載入時，只下載列表與主要 layout + AppData
  - 真正打開 modal（新增 / 編輯）才載入表單，大幅減少首屏 JS 體積
  - 對 Lighthouse / Web Vitals（JS execution time, TTI）有實際改善

你可以向面試官展示一個簡單的 Network Panel 驗證流程（`docs/VERIFY_LAZY_LOADING.md` 有詳細說明），證明 lazy chunk 確實只有在 modal 打開時才載入。

---

## 資料流與資料存取（fetch data 的完整路徑）

### 1. Firebase 設定與環境（`lib/firebase.ts`）

- 使用 `initializeApp(firebaseConfig)` 初始 Firebase app：
  - `firebaseConfig` 來自 `NEXT_PUBLIC_FIREBASE_*` env vars；  
    若在 CI / 本地沒有設定，會 fallback 到安全的預設值，避免 build / test 直接炸掉。
- 建立單例：
  - `const db = getFirestore(app);`
  - `const auth = getAuth(app);`
  - `const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null)`
- 設定 auth persistence：
  - `setPersistence(auth, browserLocalPersistence)` → login 狀態掛在 localStorage
- CI / Emulator 整合：
  - 若 `NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true'` 或 `CI === 'true'`，就自動 `connectFirestoreEmulator` & `connectAuthEmulator`
  - 好處：整個測試流程不依賴真實 Firebase 專案，還可以跑 integration tests。

### 2. Firestore 操作層（`lib/db.ts`）

這一層是針對 Firestore 的 **薄封裝**，統一 CRUD 邏輯，並維持 Typescript 型別一致。

- Users:
  - `addUserToDb`, `updateUser`, `getUser`
- Workout Sessions:
  - `addWorkoutSession`, `getWorkoutSessions`, `updateWorkoutSession`, `deleteWorkoutSession`
  - 新增與 InBody 一樣會透過 `writeBatch` + `markUserAsOnboardedIfNeeded`，順手把 `isOnboard` 更新成 true（避免多次 onboarding flow）
  - `getWorkoutSessions` 會把 Firestore 的 `Timestamp` 轉成 JS `Date` 再回傳（方便 Dashboard 直接使用）
- InBody Data:
  - `addInBodyData`, `getInBodyData`, `updateInBodyData`, `deleteInBodyData`
  - 這裡同樣處理 `createdAt` / `reportDate` 的 `Timestamp` → `Date` 轉換
- Exercises:
  - `getExercises` 讀取 `exercises` collection，轉成 `ExerciseData[]`

**fetch path（例如 Dashboard 看到的資料）大致是：**

1. Client component 呼叫 `useAppData()` → React Query 建立 query：
   - `queryKey: ['workoutSessions', uid]`
   - `queryFn: () => getWorkoutSessions({ uid })`
2. `getWorkoutSessions` 內部使用 `query(collection(db, 'workout_sessions'), where('uid', '==', uid), orderBy('date', 'desc'))`
3. `getDocs(q)` 從 Firestore 撈資料，做 `Timestamp -> Date` 轉型後回傳
4. React Query 把結果快取在 client memory，以後畫面 re-render 只讀 cache，不會重打 API（除非 `invalidateQueries`）

你可以把這段流程在面試中畫成簡單的架構圖（Client → React Query → db.ts → Firestore）。

---

## Dashboard / Forms 使用的技術總結

### Dashboard

- **技術組合：**
  - Client Component + React Hooks (`useMemo`)
  - React Query + AppDataContext 統一管理資料來源
  - Recharts 做圖表
  - shadcn/ui 做 Card / Select / Button / Tooltip
- **重點設計：**
  - `timeRange` 控制：`week / month / all` 影響 **filtered** 資料來源，但 summary 卡片仍基於 all-time 資料 → 讓使用者可以同時掌握「全局」與「短期趨勢」。
  - 使用 `getWorkoutCategories` 把訓練動作 mapping 成「Legs / Back / Chest / Shoulders / Arms / Core / Other」，讓 pie chart 不只是 raw data，而是 domain-aware 的維度。

### Forms（SessionForm / InBodyForm / Auth Forms）

- **核心原則：**
  - 全站表單一律使用 **React Hook Form + Zod**，搭配 shadcn/ui 的 `Form` 樣式系統，確保一致的 UX 與可測試性。
  - 把「domain schema」寫在前端（Zod）再映射到後端（Firestore types），降低因後端 schema 改變造成的 runtime error。
- **具體手法：**
  - 使用 `z.preprocess` 處理空字串 → 0 或 undefined，避免 `<input type="number">` 回傳空字串造成 NaN。
  - `useFieldArray` 處理 exercise / set 的動態增減與 validation。
  - 對於超大型表單（InBodyForm），把大多數欄位標成 optional + partial，搭配 `deepClean` 僅儲存實際輸入過的欄位。

---

## 技術取捨 & 設計決策摘要（可以直接講給面試官聽的版本）

### 1. 為什麼選 Next.js App Router + Firebase，而不是 REST API / 自架後端？

- 這個產品的型態是典型 B2C side project，後端邏輯相對簡單：
  - 以「誰的資料是誰的」為主，不需要很多 server-side business logic。
- 使用 Firebase 有幾個好處：
  - 免管理 server / database，部署速度快
  - Firestore + Security Rules 直接解決多租戶資料隔離問題
  - 搭配 Firebase Emulator 可以做 integration / e2e 測試，而不用多架一套 mock server
- Next.js App Router + Server Components：
  - 官方推薦、長期維護穩定
  - Server-first data fetching 可以優化首屏載入與 SEO（雖然這個產品偏 web app，但仍有 landing page 需要）

### 2. 為什麼 Client 端用 React Query，而不是全部用 Server Actions / Route Handlers？

- 因為這個 app 的大部分互動是 **高度動態、使用者個人資料**，而且：
  - Firestore 本身就是一個 client SDK 友善的服務
  - 需要即時感受（例如：新增一筆 workout 後 Dashboard / History 立刻更新）
- React Query 的優點：
  - cache, refetch, staleTime, error handling，全都幫你處理好
  - 同一份資料可以被多個 component 共用，減少重複 fetch
  - `invalidateQueries` 可以作為 mutation 完成後的 **單一 revalidation 入口**

### 3. 為什麼要刻意切 Server Component + Client Component，而不是全部 client？

- 純 client 架構雖然實做較快，但缺點是：
  - 首屏 JS 體積大
  - 需要自行處理 SEO / metadata / font loading / preconnect 等
- 利用 Next.js 15 的 Server Component 能：
  - 在 server 處理 metadata 與 font、DNS preconnect（減少 CLS 與 connection latency）
  - 將不常變動、但資料量大的 exercise catalog 在 server 預抓，減少 client 再多打一個 roundtrip

### 4. 為什麼用 shadcn/ui + Tailwind，而不是 MUI / Chakra？

- 這個專案偏向 **產品感** / **品牌感**，而不是高生產力內部管理系統：
  - shadcn/ui 基於 Radix primitives，較容易客製且符合 design system
  - Tailwind + shadcn 可以快速組合出符合品牌視覺的 component（如 LandingPage 的 hero / CTA / FAQ）
- 相比 MUI 這類 library：
  - 自由度更高，不會被內建 theme 綁死
  - code-splitting 也較容易控制（自行 import 需要的 component）

### 5. Lazy Loading & Performance 的取捨

- 不把所有東西塞進首屏 bundle：
  - SessionForm / InBodyForm 只有在需要時才載入
  - 對於 `/workout` / `/inbody` 這種核心頁面，可以明顯減少初次載入時間
- 有刻意在 `RootLayout` 中加入多個 `preconnect` 到 Firebase / Google 的 domain，儘管這看起來很「微優化」，但在慢網路環境下可以實際降低 first request 的 latency。

### 6. 測試策略（簡述）

- Unit + Integration（Vitest）：
  - 測試 `db.ts` 對 Firestore Emulator 的存取，確保 schema 與 query 正確
  - 對一些關鍵 UI component（表單、table）做行為與 validation 測試
- E2E（Playwright）：
  - 覆蓋 **Auth flow / Workout CRUD / InBody CRUD** 三大核心 user journey
  - 這可以說明你有實際把整個產品從「單元正確」拉到「user level 正確」的測試思維。

---

## 檔案結構：如何向面試官講解

可以用以下角度介紹專案結構（比單純唸目錄更有邏輯）：

- **`app/`**：Routing + 頁級組合
  - `layout.tsx`：Server root layout，處理 metadata、字體、Providers、全域 Toaster
  - `page.tsx`：Dashboard 入口（Client），根據 auth 狀態決定 Landing / Dashboard
  - `workout/page.tsx`：Server + Client 混和頁，負責 exercise catalog 的 server-side fetch
  - `inbody/login/signup/forgot-password`：各自的單獨頁面，皆為 Client Components
- **`components/`**：純視圖與互動元件
  - `AppLayout.tsx`：主框架（sidebar + content）
  - `Dashboard.tsx`：概覽與圖表
  - `WorkoutDashboard.tsx` / `InBodyForm.tsx` / `WorkoutHistoryTable.tsx` / `InBodyHistoryTable.tsx`：特定功能區域的 UI
  - `ui/`：shadcn/ui 基礎元件
- **`lib/`**：邏輯與工具
  - `firebase.ts`：Firebase 初始化與 emulator 設定
  - `db.ts`：所有與 Firestore 有關的 CRUD
  - `AuthContext.tsx` / `AppDataContext.tsx`：跨頁面共享的狀態與資料
  - `summary.ts`：從 raw data 算出統計與圖表 input
  - `types.ts`：domain model 與 Firestore document 型別
  - `utils.ts`：`cn()` + `deepClean()` 等通用工具
- **`e2e/`、`lib/__tests__/`、`components/__tests__/`**：測試與 coverage 報告

---

## 面試小結：可以強調的關鍵點清單

- **完整的前後端資料流故事**：  
  從使用者點擊「新增 Session」，到資料寫入 Firestore，再回到 Dashboard / History 的更新流程，你可以一口氣講完。
- **Server vs Client 分工哲學**：  
  哪些資料屬於 server responsibility（例如 exercise catalog）、哪些屬於 client responsibility（auth、user data），並解釋背後的效能與 developer experience 考量。
- **表單與型別設計**：  
  InBodyForm 與 SessionForm 都是典型「高維度 domain model + 嚴謹 validation」的例子，可以講你如何利用 Zod / React Hook Form / deepClean 把 dirty form data 變成乾淨而結構化的 document。
- **React Query + Context 的搭配**：  
  為什麼不用 Redux / Zustand，而選擇「React Query 管 server state、Context 管視圖狀態與組裝」這種輕量但足夠的架構。
- **Firebase Emulator + Playwright / Vitest 測試**：  
  展現你不只是做 happy path，還有為此搭建測試基礎設施（emulator、integration / e2e test）。
- **Performance & UX 細節**：  
  Lazy load 表單、preconnect Firebase domain、自適應 layout（桌面 / 手機）、chart 視覺化等都可以挑幾個深入說明。

這份整理可以當你跟面試官聊這個 side project 時的「腳本」，你可以依照面試官感興趣的面向（架構 / 前端 / Firebase / 測試 / UX）挑幾段深入講。 


