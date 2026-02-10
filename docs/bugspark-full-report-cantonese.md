# 🐛⚡ BugSpark 完整技術報告（廣東話版）

> **版本:** v0.1.0  
> **日期:** 2026 年 2 月 10 日  
> **語言:** 廣東話 / 繁體中文

---

## 目錄

1. [項目簡介](#1-項目簡介)
2. [架構總覽](#2-架構總覽)
3. [技術棧](#3-技術棧)
4. [Monorepo 結構](#4-monorepo-結構)
5. [快速開始](#5-快速開始)
6. [Widget 組件（前端嵌入式 SDK）](#6-widget-組件)
7. [Dashboard 管理面板](#7-dashboard-管理面板)
8. [API 後端](#8-api-後端)
9. [CLI 命令行工具](#9-cli-命令行工具)
10. [數據庫架構](#10-數據庫架構)
11. [認證系統](#11-認證系統)
12. [所有 CLI 指令大全](#12-所有-cli-指令大全)
13. [所有 npm 腳本大全](#13-所有-npm-腳本大全)
14. [所有 API 端點大全](#14-所有-api-端點大全)
15. [環境變數](#15-環境變數)
16. [部署方案](#16-部署方案)
17. [代碼邏輯詳解](#17-代碼邏輯詳解)
18. [文件結構全覽](#18-文件結構全覽)

---

## 1. 項目簡介

### BugSpark 係乜嘢？

BugSpark 係一個**通用嘅嵌入式 Bug 報告系統**。簡單嚟講，你將一段 JavaScript 放落你嘅網站度，用戶就可以：

- 📸 **自動截圖** — 一按就可以捕捉當前畫面
- 🎨 **截圖標註** — 用筆、箭嘴、方框、圓形、文字、模糊工具喺截圖上面標記問題位置
- 📋 **Console 日誌** — 自動攔截瀏覽器嘅 `console.log`、`warn`、`error` 等
- 🌐 **Network 請求** — 自動追蹤所有 `fetch` 同 `XMLHttpRequest` 請求
- 🎥 **Session 錄製** — 記錄用戶嘅點擊、滾動、調整大小等操作
- 📊 **效能指標** — 自動收集 LCP、CLS、FID、INP、TTFB
- 💻 **設備資訊** — User Agent、視窗大小、螢幕解析度、語言、時區等
- ❌ **錯誤追蹤** — 攔截 `window.onerror` 同 unhandled rejection

所有報告會送去 BugSpark 後端，然後喺 Dashboard 管理面板度管理。

### 適合邊啲場景？

| 場景 | 點用 |
|------|------|
| SaaS 產品 Bug 追蹤 | 嵌入 Widget，用戶直接報 Bug |
| QA 測試團隊 | 測試人員一按就有截圖 + 設備資訊 |
| 客戶反饋收集 | 客人可以截圖標註問題 |
| 開發者自用 | CLI 管理 + Dashboard 查看 |

---

## 2. 架構總覽

```
┌──────────────────────────────────────────────────────────────────┐
│                        用戶嘅網站                                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐            │
│  │  BugSpark Widget (JavaScript SDK)                │            │
│  │  • 截圖引擎 (html2canvas-pro)                    │            │
│  │  • Console 攔截器                                 │            │
│  │  • Network 攔截器                                 │            │
│  │  • Session 錄製器                                 │            │
│  │  • 標註工具 (Canvas)                              │            │
│  │  • Shadow DOM UI (浮動按鈕 + 報告表單)            │            │
│  └──────────────┬───────────────────────────────────┘            │
│                 │ POST /upload/screenshot                        │
│                 │ POST /reports                                  │
│                 │ (X-API-Key 認證)                               │
└─────────────────┼────────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────────┐
│              BugSpark API (FastAPI / Python)                      │
│                                                                  │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Auth   │ │ Projects │ │ Reports  │ │ Upload   │            │
│  │  Router │ │  Router  │ │  Router  │ │  Router  │            │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘            │
│       │           │            │             │                   │
│  ┌────┴───────────┴────────────┴─────────────┴────┐             │
│  │           Services 層                          │             │
│  │  • AuthService (JWT/PAT)                       │             │
│  │  • StorageService (S3/MinIO)                   │             │
│  │  • AIAnalysisService (Claude)                  │             │
│  │  • WebhookService                              │             │
│  │  • SimilarityService                           │             │
│  │  • StatsService                                │             │
│  └────────────────────┬───────────────────────────┘             │
│                       │                                          │
│               ┌───────┴────────┐                                 │
│               │  PostgreSQL 16 │                                 │
│               │  (SQLAlchemy)  │                                 │
│               └───────┬────────┘                                 │
│                       │                                          │
│               ┌───────┴────────┐                                 │
│               │  S3 / MinIO    │                                 │
│               │  (截圖存儲)     │                                 │
│               └────────────────┘                                 │
└──────────────────────────────────────────────────────────────────┘
                  ▲                    ▲
                  │                    │
    ┌─────────────┴──────┐   ┌────────┴──────────┐
    │  Dashboard          │   │  CLI 命令行工具    │
    │  (Next.js 15)       │   │  (Commander.js)   │
    │  Cookie + CSRF 認證  │   │  PAT Token 認證   │
    └─────────────────────┘   └───────────────────┘
```

### 數據流（一個 Bug 報告嘅完整旅程）

```
1. 用戶喺網站見到 Bug → 按 Widget 浮動按鈕
2. Widget 自動截圖（html2canvas-pro）
3. 用戶可以用標註工具喺截圖上標記
4. 用戶填寫標題、描述、嚴重程度
5. Widget 上傳截圖去 S3 → POST /upload/screenshot
6. Widget 提交報告 → POST /reports（帶所有日誌、指標）
7. API 將報告存入 PostgreSQL
8. API 觸發 Webhook（如有設定）
9. 開發者喺 Dashboard 或 CLI 查看同管理報告
10. 可選：AI 分析報告（Claude）
11. 可選：導出去 GitHub Issues
```

---

## 3. 技術棧

| 領域 | 技術 | 點解揀佢 |
|------|------|----------|
| **API 後端** | Python 3.12、FastAPI、SQLAlchemy 2（async）、Alembic | FastAPI 效能好、自動生成文檔 |
| **數據庫** | PostgreSQL 16（asyncpg 驅動） | 穩定、支援 JSONB、pg_trgm |
| **文件存儲** | S3 / MinIO（boto3） | 截圖上傳用、S3 兼容 |
| **管理面板** | Next.js 15、React 19、Tailwind CSS 4、TanStack Query | SSR + SPA、現代 React |
| **嵌入式 Widget** | TypeScript、Rollup、html2canvas-pro | 輕量、自包含、Shadow DOM |
| **CLI 工具** | TypeScript、Commander.js、Chalk、Ora | 終端友好、互動式 |
| **AI 分析** | Anthropic Claude（可選） | 智能分析 Bug |
| **Monorepo** | pnpm + Turborepo | 工作區管理 + 快取 |
| **基建** | Docker Compose、Render（API）、Vercel（Dashboard） | 開發 + 生產部署 |

---

## 4. Monorepo 結構

BugSpark 用 **pnpm workspace + Turborepo** 管理，分咗 4 個 package：

```
BugSpark/
├── packages/
│   ├── api/           ← FastAPI 後端（Python）
│   ├── dashboard/     ← Next.js 管理面板
│   ├── widget/        ← 嵌入式 Bug 報告 SDK
│   └── cli/           ← 命令行工具
├── docker-compose.yml ← PostgreSQL + MinIO
├── turbo.json         ← Turborepo 配置
├── pnpm-workspace.yaml
├── package.json       ← 根 scripts
├── .env.example
└── docs/              ← 文檔
```

### Turborepo Pipeline

```json
{
  "tasks": {
    "dev":   { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "lint":  { "dependsOn": ["^build"] }
  }
}
```

- `dev`：唔快取，持續運行（開發模式）
- `build`：先 build 依賴嘅 package，輸出 `dist/` 同 `.next/`
- `lint`：lint 之前先確保依賴已經 build 好

---

## 5. 快速開始

### 前置條件

- Node.js 18+
- pnpm 8+
- Python 3.12+
- Docker（跑 PostgreSQL + MinIO）

### 步驟

```bash
# 1. Clone 項目
git clone <repo-url> BugSpark
cd BugSpark

# 2. 安裝前端依賴
pnpm install

# 3. 安裝 API 依賴
cd packages/api
pip install -e ".[dev]"
cd ../..

# 4. 複製環境變數
cp .env.example .env
cp packages/api/.env.example packages/api/.env

# 5. 改 .env 入面嘅 JWT_SECRET（生產環境必須改！）

# 6. 啟動 Docker（PostgreSQL + MinIO）
pnpm docker:up

# 7. 跑數據庫 migration
pnpm db:migrate

# 8. （可選）Seed 測試數據
pnpm db:seed

# 9. 啟動所有服務
pnpm dev
# 或者分開啟動：
# pnpm dev:api       ← localhost:8000
# pnpm dev:dashboard ← localhost:3000
# pnpm dev:widget    ← watch mode
```

### 驗證

- API：`http://localhost:8000`（會見到 BugSpark Landing Page）
- API 文檔：`http://localhost:8000/docs`（Swagger UI）
- Dashboard：`http://localhost:3000`
- MinIO Console：`http://localhost:9001`（bugspark / bugspark_dev）

---

## 6. Widget 組件

### 6.1 Widget 係乜嘢

Widget 係一段 JavaScript，嵌入用戶嘅網站之後會：

1. 顯示一個**浮動按鈕**（右下角，可配置）
2. 按下後彈出**報告表單**
3. 支持**自動截圖** + **標註工具**
4. 自動收集 **Console/Network/Session/Performance/設備資訊**
5. 提交報告去 BugSpark API

### 6.2 嵌入方式

#### 方式一：Script Tag（自動初始化）

```html
<script
  src="https://cdn.example.com/bugspark.iife.js"
  data-project-key="bsk_pub_xxx"
  data-endpoint="https://api.example.com/api/v1"
  data-position="bottom-right"
  data-theme="light"
></script>
```

Widget 會自動讀取 `data-*` 屬性嚟初始化。

#### 方式二：NPM 安裝（手動初始化）

```bash
npm install @bugspark/widget
```

```typescript
import BugSpark from '@bugspark/widget';

BugSpark.init({
  projectKey: 'bsk_pub_xxx',
  endpoint: 'https://api.example.com/api/v1',
  position: 'bottom-right',
  theme: 'dark',
  primaryColor: '#e94560',
  enableScreenshot: true,
  collectConsole: true,
  collectNetwork: true,
  enableSessionRecording: true,
  maxConsoleLogs: 50,
  maxNetworkLogs: 30,
  beforeSend: (report) => {
    // 可以修改或過濾報告，return null 就唔會送出
    return report;
  },
  onSubmit: (report) => {
    console.log('Bug 已提交:', report);
  },
  onError: (error) => {
    console.error('提交失敗:', error);
  },
});
```

### 6.3 Widget 公開 API

| 方法 | 作用 | 示例 |
|------|------|------|
| `BugSpark.init(config)` | 初始化 Widget | 見上面 |
| `BugSpark.open()` | 打開報告表單 | `BugSpark.open()` |
| `BugSpark.close()` | 關閉表單 | `BugSpark.close()` |
| `BugSpark.destroy()` | 銷毀 Widget（停止所有攔截器） | `BugSpark.destroy()` |
| `BugSpark.setReporter(id)` | 設定報告者身份 | `BugSpark.setReporter('user@test.com')` |
| `BugSpark.identify(user)` | （已棄用）設定用戶資訊 | `BugSpark.identify({email:'x'})` |

### 6.4 配置選項

| 選項 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `projectKey` | string | **必填** | 項目 API Key |
| `endpoint` | string | **必填** | API 地址（如 `https://api.example.com/api/v1`） |
| `position` | enum | `bottom-right` | 浮動按鈕位置：`bottom-right`、`bottom-left`、`top-right`、`top-left` |
| `theme` | enum | `light` | 主題：`light`、`dark`、`auto`（跟系統） |
| `primaryColor` | string | `#e94560` | 主色調 |
| `enableScreenshot` | boolean | `true` | 啟用截圖 |
| `collectConsole` | boolean | `true` | 收集 Console 日誌 |
| `collectNetwork` | boolean | `true` | 收集 Network 請求 |
| `enableSessionRecording` | boolean | `false` | 錄製用戶操作 |
| `maxConsoleLogs` | number | `50` | 最多收集幾條 Console |
| `maxNetworkLogs` | number | `30` | 最多收集幾條 Network |
| `beforeSend` | function | — | 送出前回調（return null = 唔送） |
| `onSubmit` | function | — | 送出後回調 |
| `onOpen` | function | — | 表單打開時回調 |
| `onClose` | function | — | 表單關閉時回調 |
| `onError` | function | — | 出錯時回調 |
| `reporterIdentifier` | string | — | 報告者 ID（如 email） |

### 6.5 Widget 核心模組代碼邏輯

#### 截圖引擎（`screenshot-engine.ts`）

```
captureScreenshot()
  ├── 用 html2canvas-pro 將 document.body 渲染成 Canvas
  ├── 排除 #bugspark-host（Widget 自己嘅 DOM）
  ├── 用 window.devicePixelRatio 確保高清
  └── 失敗嘅話返回一個帶錯誤訊息嘅 fallback canvas
```

#### Console 攔截器（`console-interceptor.ts`）

```
start(limit)
  ├── 保存原始 console.log/warn/error/info/debug
  ├── 用自定義函數取代每個 method
  │   ├── safeStringify() 避免 circular reference
  │   ├── 記錄 { level, message, timestamp, stack? }
  │   └── 呼叫原始 console method（唔會影響正常功能）
  └── 限制最多 limit 條記錄

stop()
  └── 還原所有 console method
```

#### Network 攔截器（`network-interceptor.ts`）

```
start(endpoint, limit)
  ├── Patch fetch()
  │   ├── 過濾掉去 BugSpark endpoint 嘅請求
  │   ├── 記錄 method, url, status, duration, headers
  │   └── 排除敏感 header
  └── Patch XMLHttpRequest
      ├── 攔截 open() 同 send()
      ├── 監聽 load + error 事件
      └── 記錄同樣嘅資訊

stop()
  └── 還原 fetch 同 XHR
```

#### Session 錄製器（`session-recorder.ts`）

```
start()
  ├── 監聽 click → 記錄 CSS selector + 座標
  ├── 監聽 scroll → debounce 記錄 scrollY
  ├── 監聽 resize → debounce 記錄 viewport
  ├── Patch pushState → 記錄 navigation
  ├── 監聽 popstate → 記錄 navigation
  └── 30 秒 rolling buffer

stop()
  └── 移除所有 event listener
```

#### 效能收集器（`performance-collector.ts`）

```
initPerformanceObservers()
  ├── PerformanceObserver('largest-contentful-paint') → LCP
  ├── PerformanceObserver('layout-shift') → CLS（累計）
  ├── PerformanceObserver('first-input') → FID
  ├── PerformanceObserver('event') → INP（最大 interaction delay）
  └── navigation timing → TTFB
```

#### 標註工具（`annotation-tools.ts` + `annotation-text-blur.ts`）

```
6 種工具：
  ├── Pen（自由畫筆）→ 記錄 points array
  ├── Arrow（箭嘴）→ startX/Y → endX/Y
  ├── Rectangle（方框）→ x/y/width/height
  ├── Circle（圓形）→ centerX/Y + radius
  ├── Text（文字）→ 彈出 input，確認後渲染
  └── Blur（模糊）→ 選擇範圍，像素平均化處理

AnnotationCanvas:
  ├── init(targetCanvas, screenshot) → 設置畫布
  ├── Pointer events → 路由去當前工具
  ├── setTool() / setColor() / setLineWidth()
  ├── undo() / redo() → 歷史堆疊
  └── getAnnotatedCanvas() → 返回最終 Canvas
```

#### Shadow DOM UI

Widget 所有 UI 都喺 **Shadow DOM** 入面，完全唔會影響宿主網站嘅 CSS。

```
mount(primaryColor, theme)
  ├── 創建 div#bugspark-host
  ├── attachShadow({ mode: 'open' })
  ├── 注入 CSS（根據 theme + primaryColor 生成）
  └── 返回 shadow root

Widget UI 組件：
  ├── floating-button.ts → 浮動 Bug 圖標按鈕
  ├── report-modal.ts → 報告表單（標題、描述、嚴重程度、分類、email）
  ├── annotation-overlay.ts → 全屏標註覆蓋層 + 工具列
  └── toast.ts → 成功/失敗提示（3 秒自動消失）
```

#### 報告提交流程（`report-composer.ts`）

```
submitReport(config, report)
  ├── 執行 beforeSend(report)，如果 return null 就中止
  ├── 如果有截圖 → uploadScreenshot()
  │   ├── POST {endpoint}/upload/screenshot
  │   ├── FormData with file (PNG blob)
  │   ├── Header: X-API-Key
  │   └── 返回 { key: "storage-key" }
  ├── 如果有標註截圖 → 同上
  ├── POST {endpoint}/reports
  │   ├── Header: X-API-Key, Content-Type: application/json
  │   └── Body: { title, description, severity, category,
  │              screenshot_url, annotated_screenshot_url,
  │              console_logs, network_logs, user_actions,
  │              metadata, reporter_identifier }
  └── fetchWithRetry → 5xx 自動重試 2 次（exponential backoff）
```

### 6.6 Widget Build 輸出

| 文件 | 用途 |
|------|------|
| `dist/bugspark.iife.js` | Script tag 用（全局 `window.BugSpark`） |
| `dist/bugspark.esm.js` | NPM import 用 |
| `dist/index.d.ts` | TypeScript 類型定義 |

---

## 7. Dashboard 管理面板

### 7.1 技術棧

- **框架**：Next.js 15（App Router）、React 19
- **樣式**：Tailwind CSS 4
- **數據層**：TanStack React Query 5 + Axios
- **國際化**：next-intl（英文 + 繁中）
- **圖表**：Recharts
- **圖標**：Lucide React

### 7.2 頁面一覽

#### 公開頁面

| 路徑 | 頁面 | 內容 |
|------|------|------|
| `/` | Landing Page | 產品介紹、Hero Section |
| `/about` | 關於 | 團隊介紹 |
| `/features` | 功能介紹 | Widget 功能亮點 |
| `/pricing` | 定價 | Free / Pro / Enterprise |
| `/changelog` | 更新日誌 | 版本更新記錄 |
| `/docs/[[...slug]]` | 文檔 | MDX 文檔系統（多語言） |

#### 認證頁面

| 路徑 | 頁面 | 內容 |
|------|------|------|
| `/login` | 登入 | Email + 密碼 |
| `/register` | 註冊 | 名稱 + Email + 密碼 |

#### Dashboard（需要登入）

| 路徑 | 頁面 | 內容 |
|------|------|------|
| `/dashboard` | 總覽 | 統計數據、趨勢圖、嚴重程度分佈、最近嘅 Bug |
| `/bugs` | Bug 列表 | Table / Kanban 視圖、篩選器（項目、狀態、嚴重程度、搜索、日期） |
| `/bugs/[id]` | Bug 詳情 | 截圖、Console、Network、Session、Metadata、留言、導出、AI 分析 |
| `/projects` | 項目列表 | 所有項目卡片 |
| `/projects/[id]` | 項目詳情 | API Key 顯示、Widget 代碼片段、Key 輪替 |
| `/settings` | 設定 | 個人檔案、改密碼 |
| `/settings/tokens` | Token 管理 | Personal Access Token CRUD |
| `/settings/integrations` | 整合 | GitHub 整合設定 |

#### 管理員（需要 superadmin）

| 路徑 | 頁面 | 內容 |
|------|------|------|
| `/admin` | 管理總覽 | 平台統計（用戶數、項目數、報告數） |
| `/admin/users` | 用戶管理 | 改角色、方案、啟用/停用 |
| `/admin/reports` | 報告管理 | 查看所有報告 |

### 7.3 核心組件

#### Bug 詳情頁面嘅組件

| 組件 | 功能 |
|------|------|
| `ScreenshotViewer` | 查看原始截圖 + 標註截圖 |
| `ConsoleLogViewer` | 顯示攔截到嘅 Console 日誌（含 level 分色） |
| `NetworkWaterfall` | Network 請求瀑布圖（method、URL、status、耗時） |
| `SessionTimeline` | 用戶操作時間線（click、scroll、navigate） |
| `MetadataPanel` | 設備資訊面板 |
| `PerformanceMetrics` | Web Vitals 指標 |
| `CommentThread` | 留言討論串 |
| `ExportToTracker` | 導出去 GitHub Issues |
| `AiAnalysisPanel` | AI 分析結果（分類、嚴重程度建議、復現步驟） |
| `SimilarBugsPanel` | 相似 Bug 列表 |

### 7.4 數據流（Dashboard → API）

```
Dashboard 用 Axios (api-client.ts) 同 API 溝通：
  ├── withCredentials: true（Cookie 認證）
  ├── 自動從 cookie 讀取 CSRF Token
  ├── 401 時自動 refresh token → 重試
  ├── Accept-Language header（國際化）
  └── TanStack Query 做快取 + 自動 refetch

Hooks:
  ├── useBugs() → GET /reports
  ├── useProjects() → GET /projects
  ├── useStats() → GET /stats/overview + /stats/aggregated
  ├── useComments() → GET/POST /reports/:id/comments
  ├── useAnalysis() → POST /reports/:id/analyze
  ├── useSimilarBugs() → GET /reports/:id/similar
  ├── useIntegrations() → GET/POST /projects/:id/integrations
  └── useAdmin() → GET /admin/*
```

---

## 8. API 後端

### 8.1 FastAPI 主入口（`app/main.py`）

```python
app = FastAPI(title="BugSpark API", version="0.1.0")

# Middleware（由外到內）：
# 1. SlowAPI（Rate Limiting，100 req/min）
# 2. CORS（允許 Dashboard origin + Vercel preview）
# 3. CSRF（防跨站請求偽造）

# Rate Limit Key：
#   - 如果有 X-API-Key → 用 key 前 8 碼做 key
#   - 否則用 IP 地址

# 12 個 Router，全部掛喺 /api/v1 下面
```

### 8.2 Router 總覽

| Router | Prefix | 認證 | 功能 |
|--------|--------|------|------|
| `auth` | `/auth` | 混合 | 註冊、登入、登出、refresh、me、CLI 認證 |
| `tokens` | `/auth/tokens` | JWT/PAT | Personal Access Token CRUD |
| `admin` | `/admin` | Superadmin | 用戶管理、平台統計 |
| `projects` | `/projects` | JWT | 項目 CRUD、API Key 輪替 |
| `reports` | `/reports` | X-API-Key / JWT | 報告 CRUD、相似報告 |
| `upload` | `/upload` | X-API-Key | 截圖上傳 |
| `comments` | — | JWT | 報告留言 CRUD |
| `webhooks` | `/webhooks` | JWT | Webhook 設定 |
| `stats` | `/stats` | JWT | 統計數據、趨勢 |
| `analysis` | `/reports` | JWT | AI 分析 |
| `integrations` | — | JWT | GitHub 整合、導出 |
| `plans` | `/plans` | JWT | 方案 / 限制 |

### 8.3 Services 層

| Service | 功能 |
|---------|------|
| `auth_service.py` | JWT 簽發/驗證、密碼 hash、Token refresh |
| `storage_service.py` | S3/MinIO 文件上傳、生成公開 URL |
| `ai_analysis_service.py` | 用 Anthropic Claude 分析 Bug 報告 |
| `github_integration.py` | 創建 GitHub Issue（含截圖、描述、metadata） |
| `webhook_service.py` | 派發 webhook 事件（report.created 等） |
| `similarity_service.py` | 基於 pg_trgm 嘅文本相似度搜索 |
| `stats_service.py` | 聚合統計（趨勢、嚴重程度分佈等） |
| `plan_limits_service.py` | 檢查用戶方案限制 |
| `tracking_id_service.py` | 生成報告追蹤 ID（如 BSK-001） |

### 8.4 安全措施

| 措施 | 實現 |
|------|------|
| **Rate Limiting** | SlowAPI，100/min，認證端點更嚴 |
| **CORS** | 白名單 origins + Vercel preview regex |
| **CSRF** | 自訂 CSRFMiddleware + X-CSRF-Token |
| **API Key Hash** | 項目 API Key 以 hash 存儲，唔存明文 |
| **JWT** | HttpOnly cookie，唔暴露俾 JavaScript |
| **密碼** | bcrypt hash |
| **生產 JWT 檢查** | 啟動時拒絕默認 JWT_SECRET |

---

## 9. CLI 命令行工具

### 9.1 安裝

```bash
# 從 Monorepo build + link
cd packages/cli
pnpm build
npm link

# 之後可以全局用
bugspark --help
```

### 9.2 認證流程

```
bugspark login
  ├── 互動式輸入 Email + Password
  ├── POST /auth/cli/login
  │   └── 返回 Personal Access Token (PAT)
  ├── PAT 存入 ~/.bugspark/config.json
  └── 之後所有請求用 Authorization: Bearer bsk_pat_xxx

bugspark register
  ├── 互動式輸入 Name + Email + Password
  ├── POST /auth/cli/register
  └── 成功後提示用 bugspark login

bugspark logout
  └── 清除 ~/.bugspark/config.json

bugspark whoami
  ├── GET /auth/me
  └── 顯示用戶 ID、Email、名稱、角色、方案
```

### 9.3 所有指令

見下面 [第 12 節](#12-所有-cli-指令大全)。

---

## 10. 數據庫架構

### 10.1 模型關係圖

```
┌──────────┐       ┌──────────────┐       ┌───────────┐
│  User    │───┐   │   Project    │───┐   │  Report   │
│          │   │   │              │   │   │           │
│ id       │   │   │ id           │   │   │ id        │
│ email    │   ├──>│ owner_id(FK) │   ├──>│ project_id│
│ password │   │   │ name         │   │   │ tracking_id│
│ name     │   │   │ domain       │   │   │ title     │
│ role     │   │   │ api_key_hash │   │   │ description│
│ plan     │   │   │ settings     │   │   │ severity  │
│ is_active│   │   │ report_counter│   │   │ category  │
│          │   │   └──────┬───────┘   │   │ status    │
└──────┬───┘   │          │           │   │ assignee_id│
       │       │          │           │   │ screenshot │
       │       │   ┌──────┴───────┐   │   │ console_logs│
       │       │   │  Webhook     │   │   │ network_logs│
       │       │   │  Integration │   │   │ user_actions│
       │       │   └──────────────┘   │   │ metadata  │
       │       │                      │   └─────┬─────┘
       │       │                      │         │
       │       │               ┌──────┴─────┐   │
       │       └──────────────>│  Comment    │<──┘
       │                       │             │
       │                       │ id          │
       │                       │ report_id   │
       ├──────────────────────>│ author_id   │
       │                       │ body        │
       │                       └─────────────┘
       │
       │    ┌──────────────────────┐
       └───>│ PersonalAccessToken  │
            │                      │
            │ id                   │
            │ user_id (FK)         │
            │ name                 │
            │ token_hash           │
            │ token_prefix         │
            │ expires_at           │
            └──────────────────────┘
```

### 10.2 枚舉值

| 枚舉 | 值 |
|------|------|
| **嚴重程度 (Severity)** | `critical`（嚴重）、`high`（高）、`medium`（中）、`low`（低） |
| **分類 (Category)** | `bug`、`ui`、`performance`、`crash`、`other` |
| **狀態 (Status)** | `new`（新建）、`triaging`（分類中）、`in_progress`（處理中）、`resolved`（已解決）、`closed`（已關閉） |
| **角色 (Role)** | `user`（普通）、`admin`（管理員）、`superadmin`（超級管理員） |
| **方案 (Plan)** | `free`、`pro`、`enterprise` |

### 10.3 JSONB 欄位

- **`Project.settings`**：項目設定（如通知偏好等）
- **`Report.metadata`**：設備資訊（userAgent、viewport、screen、url 等）
- **`Report.console_logs`**：Console 日誌 array
- **`Report.network_logs`**：Network 請求 array
- **`Report.user_actions`**：Session 事件 array
- **`Integration.config`**：整合配置（如 GitHub token、repo 名）

---

## 11. 認證系統

BugSpark 有 **三種認證模式**，適用唔同場景：

### 11.1 Dashboard 認證（Cookie + CSRF）

```
用戶登入 → POST /auth/login (email + password)
     │
     ▼
API 設定 3 個 HttpOnly Cookie：
  ├── bugspark_access_token  (JWT, 60 分鐘)
  ├── bugspark_refresh_token (JWT, 30 日)
  └── bugspark_csrf_token    (CSRF 防護)
     │
     ▼
Dashboard 每個請求自動帶 Cookie
  ├── withCredentials: true
  └── X-CSRF-Token header
     │
     ▼
Access Token 過期 → 401
  ├── Dashboard 自動 POST /auth/refresh
  ├── 用 refresh token 換新 access token
  └── 重試原本嘅請求
     │
     ▼
Refresh Token 都過期 → redirect 去 /login
```

### 11.2 CLI 認證（Personal Access Token）

```
bugspark login → POST /auth/cli/login
     │
     ▼
API 返回 PAT (bsk_pat_xxxxxxxxxxxxxxxx)
     │
     ▼
CLI 存入 ~/.bugspark/config.json
     │
     ▼
之後每個請求：
  └── Authorization: Bearer bsk_pat_xxx
     │
     ▼
API 用 token_hash 驗證 → 更新 last_used_at
```

### 11.3 Widget 認證（Project API Key）

```
Widget init → 設定 projectKey
     │
     ▼
每個請求：
  └── X-API-Key: bsk_pub_xxx
     │
     ▼
API 用 api_key_hash 驗證 → 確認項目存在且啟用
```

---

## 12. 所有 CLI 指令大全

### 認證

| 指令 | 說明 | 用法 |
|------|------|------|
| `bugspark register` | 創建新帳號 | 互動式輸入 Name、Email、Password |
| `bugspark login` | 登入 | 互動式輸入 Email、Password |
| `bugspark logout` | 登出（清除本地憑據） | `bugspark logout` |
| `bugspark whoami` | 查看當前用戶 | 顯示 ID、Email、Name、Role、Plan |

### 初始化

| 指令 | 說明 | 用法 |
|------|------|------|
| `bugspark init` | 互動式項目設置 | 選擇/創建項目 → 生成配置 |

### 項目管理

| 指令 | 說明 | 用法 |
|------|------|------|
| `bugspark projects list` | 列出所有項目 | 表格顯示 ID、名稱、域名 |
| `bugspark projects create <name>` | 創建項目 | `-d, --domain <domain>` 可選 |
| `bugspark projects delete <id>` | 刪除項目 | 需確認 |

### 報告管理

| 指令 | 說明 | 用法 |
|------|------|------|
| `bugspark reports list` | 列出報告 | 可篩選（見下） |
| `bugspark reports view <id>` | 查看報告詳情 | 顯示所有欄位 |
| `bugspark reports update <id>` | 更新報告 | 改狀態或嚴重程度 |

**`reports list` 篩選選項：**

| 選項 | 說明 |
|------|------|
| `-p, --project <id>` | 按項目 ID 篩選 |
| `-s, --status <status>` | 按狀態篩選（new、in_progress、resolved、closed） |
| `--severity <severity>` | 按嚴重程度篩選（critical、high、medium、low） |
| `-l, --limit <n>` | 限制結果數量 |

### Token 管理

| 指令 | 說明 | 用法 |
|------|------|------|
| `bugspark tokens list` | 列出所有 PAT | 表格顯示 prefix、名稱、過期日 |
| `bugspark tokens create <name>` | 創建 PAT | `-e, --expires <days>` 過期天數（1-365） |
| `bugspark tokens revoke <id>` | 撤銷 PAT | 需確認 |

---

## 13. 所有 npm 腳本大全

### 根目錄 Scripts

| Script | 命令 | 說明 |
|--------|------|------|
| `pnpm dev` | `turbo dev` | 啟動所有 package 嘅開發模式 |
| `pnpm build` | `turbo build` | 建構所有 package |
| `pnpm lint` | `turbo lint` | Lint 所有 package |
| `pnpm dev:api` | `uvicorn app.main:app --reload --port 8000` | 啟動 API（熱重載，:8000） |
| `pnpm dev:dashboard` | `cd packages/dashboard && pnpm dev` | 啟動 Dashboard（:3000） |
| `pnpm dev:widget` | `cd packages/widget && pnpm dev` | Widget watch 模式 |
| `pnpm db:migrate` | `alembic upgrade head` | 執行數據庫 migration |
| `pnpm db:seed` | `python scripts/seed.py` | Seed 測試數據 |
| `pnpm docker:up` | `docker compose up -d` | 啟動 PostgreSQL + MinIO |
| `pnpm docker:down` | `docker compose down` | 停止 Docker 服務 |
| `pnpm cli:link` | build CLI + `npm link` | 全局安裝 CLI |

### Widget Package Scripts

| Script | 命令 | 說明 |
|--------|------|------|
| `pnpm build` | `rollup -c` | 建構 IIFE + ESM |
| `pnpm dev` | `rollup -c -w` | Watch 模式 |
| `pnpm lint` | `tsc --noEmit` | TypeScript 類型檢查 |
| `pnpm test` | `vitest run` | 運行測試 |

### Dashboard Package Scripts

| Script | 命令 | 說明 |
|--------|------|------|
| `pnpm dev` | `next dev -p 3000` | 開發模式 |
| `pnpm build` | `next build` | 生產建構 |
| `pnpm start` | `next start` | 生產啟動 |
| `pnpm lint` | `next lint` | ESLint |
| `pnpm test` | `vitest run` | 運行測試 |

### CLI Package Scripts

| Script | 命令 | 說明 |
|--------|------|------|
| `pnpm build` | `rollup -c` | 建構 |
| `pnpm dev` | `rollup -c -w` | Watch 模式 |

---

## 14. 所有 API 端點大全

### 認證 (`/api/v1/auth`)

| Method | 端點 | 認證 | 說明 |
|--------|------|------|------|
| POST | `/auth/register` | 無 | 註冊新帳號 |
| POST | `/auth/login` | 無 | 登入（設 Cookie） |
| POST | `/auth/logout` | JWT | 登出（清 Cookie） |
| POST | `/auth/refresh` | Refresh Token | 刷新 Access Token |
| GET | `/auth/me` | JWT/PAT | 查看當前用戶 |
| PATCH | `/auth/me` | JWT | 更新個人資料 |
| PUT | `/auth/me/password` | JWT | 更改密碼 |
| POST | `/auth/cli/register` | 無 | CLI 註冊 |
| POST | `/auth/cli/login` | 無 | CLI 登入（返回 PAT） |

### Token (`/api/v1/auth/tokens`)

| Method | 端點 | 認證 | 說明 |
|--------|------|------|------|
| POST | `/auth/tokens` | JWT/PAT | 創建 PAT |
| GET | `/auth/tokens` | JWT/PAT | 列出 PAT |
| DELETE | `/auth/tokens/{id}` | JWT/PAT | 撤銷 PAT |

### 項目 (`/api/v1/projects`)

| Method | 端點 | 認證 | 說明 |
|--------|------|------|------|
| POST | `/projects` | JWT | 創建項目 |
| GET | `/projects` | JWT | 列出項目 |
| GET | `/projects/{id}` | JWT | 查看項目 |
| PATCH | `/projects/{id}` | JWT | 更新項目 |
| DELETE | `/projects/{id}` | JWT | 刪除項目 |
| POST | `/projects/{id}/rotate-key` | JWT | 輪替 API Key |

### 報告 (`/api/v1/reports`)

| Method | 端點 | 認證 | 說明 |
|--------|------|------|------|
| POST | `/reports` | X-API-Key | 創建報告（Widget 用） |
| GET | `/reports` | JWT | 列出報告（支持篩選） |
| GET | `/reports/{id}` | JWT | 查看報告 |
| PATCH | `/reports/{id}` | JWT | 更新報告（狀態、嚴重程度） |
| DELETE | `/reports/{id}` | JWT | 刪除報告 |
| GET | `/reports/{id}/similar` | JWT | 相似報告 |
| POST | `/reports/{id}/analyze` | JWT | AI 分析 |

### 上傳 (`/api/v1/upload`)

| Method | 端點 | 認證 | 說明 |
|--------|------|------|------|
| POST | `/upload/screenshot` | X-API-Key | 上傳截圖 |

### 留言 (`/api/v1/reports/{id}/comments`)

| Method | 端點 | 認證 | 說明 |
|--------|------|------|------|
| GET | `/reports/{id}/comments` | JWT | 列出留言 |
| POST | `/reports/{id}/comments` | JWT | 新增留言 |
| DELETE | `/comments/{id}` | JWT | 刪除留言 |

### Webhook (`/api/v1/webhooks`)

| Method | 端點 | 認證 | 說明 |
|--------|------|------|------|
| POST | `/webhooks` | JWT | 創建 Webhook |
| GET | `/webhooks` | JWT | 列出 Webhook |
| PATCH | `/webhooks/{id}` | JWT | 更新 Webhook |
| DELETE | `/webhooks/{id}` | JWT | 刪除 Webhook |

### 統計 (`/api/v1/stats`)

| Method | 端點 | 認證 | 說明 |
|--------|------|------|------|
| GET | `/stats/overview` | JWT | 總覽統計 |
| GET | `/stats/aggregated` | JWT | 聚合趨勢數據 |
| GET | `/stats/projects/{id}` | JWT | 項目統計 |

### 整合 (`/api/v1`)

| Method | 端點 | 認證 | 說明 |
|--------|------|------|------|
| POST | `/projects/{id}/integrations` | JWT | 添加整合 |
| GET | `/projects/{id}/integrations` | JWT | 列出整合 |
| PATCH | `/integrations/{id}` | JWT | 更新整合 |
| DELETE | `/integrations/{id}` | JWT | 刪除整合 |
| POST | `/reports/{id}/export/{provider}` | JWT | 導出去外部服務 |

### 管理員 (`/api/v1/admin`)

| Method | 端點 | 認證 | 說明 |
|--------|------|------|------|
| GET | `/admin/users` | Superadmin | 列出用戶 |
| GET | `/admin/users/{id}` | Superadmin | 查看用戶 |
| PATCH | `/admin/users/{id}` | Superadmin | 更新用戶（角色、方案、啟用） |
| GET | `/admin/stats` | Superadmin | 平台統計 |
| GET | `/admin/projects` | Superadmin | 所有項目 |
| GET | `/admin/reports` | Superadmin | 所有報告 |

### 方案 (`/api/v1/plans`)

| Method | 端點 | 認證 | 說明 |
|--------|------|------|------|
| GET | `/plans` | JWT | 當前方案同限制 |

### 健康檢查

| Method | 端點 | 認證 | 說明 |
|--------|------|------|------|
| GET/HEAD | `/health` | 無 | 服務同數據庫狀態 |

---

## 15. 環境變數

### API 後端 `.env`

| 變數 | 用途 | 預設值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 連接字串 | `postgresql+asyncpg://bugspark:bugspark_dev@localhost:5432/bugspark` |
| `JWT_SECRET` | JWT 簽名密鑰 | `change-me-in-production`（生產必須改！） |
| `JWT_ALGORITHM` | JWT 算法 | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access Token 過期時間 | `60` |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Refresh Token 過期時間 | `30` |
| `S3_ENDPOINT_URL` | S3/MinIO 地址 | `http://localhost:9000` |
| `S3_ACCESS_KEY` | S3 Access Key | `bugspark` |
| `S3_SECRET_KEY` | S3 Secret Key | `bugspark_dev` |
| `S3_BUCKET_NAME` | S3 Bucket 名 | `bugspark-uploads` |
| `S3_PUBLIC_URL` | 截圖公開 URL | `http://localhost:9000/bugspark-uploads` |
| `CORS_ORIGINS` | 允許嘅 origins | `http://localhost:3000,http://localhost:5173` |
| `FRONTEND_URL` | Dashboard URL | — |
| `COOKIE_SECURE` | Cookie secure flag | `false`（開發），`true`（生產） |
| `COOKIE_SAMESITE` | Cookie SameSite | `lax` |
| `ANTHROPIC_API_KEY` | Claude API Key（可選） | — |
| `SUPERADMIN_EMAIL` | Superadmin email | — |
| `SUPERADMIN_PASSWORD` | Superadmin 密碼 | — |
| `ENVIRONMENT` | 環境 | `development` |

### Dashboard `.env`

| 變數 | 用途 |
|------|------|
| `NEXT_PUBLIC_API_URL` | API 地址（如 `http://localhost:8000/api/v1`） |

---

## 16. 部署方案

### 16.1 本地開發（Docker Compose）

```yaml
# docker-compose.yml 包含：
services:
  postgres:    # PostgreSQL 16 Alpine, port 5432
  minio:       # MinIO (S3 兼容), port 9000/9001
  minio-init:  # 自動創建 bugspark-uploads bucket
```

### 16.2 生產部署建議

| 組件 | 平台 | 說明 |
|------|------|------|
| **API** | Render | Web Service，`render.yaml` 已配置 |
| **Dashboard** | Vercel | Next.js 自動部署 |
| **數據庫** | Neon PostgreSQL | 免費 Serverless PostgreSQL |
| **文件存儲** | Cloudflare R2 | S3 兼容，便宜 |
| **Widget CDN** | Vercel / CloudFlare | 靜態 JS 文件 |

### 16.3 CI/CD（GitHub Actions）

#### PR 時（`ci.yml`）

```
lint → audit → test-api → test-dashboard → test-widget → build
```

#### Merge 去 main（`deploy.yml`）

```
test-api + test-dashboard + test-widget → build-widget → upload artifact
```

Render 同 Vercel 嘅部署通過 platform integration 自動觸發。

### 16.4 Docker API 建構

```dockerfile
FROM python:3.12-slim
# 非 root user (appuser)
# pip install . && alembic upgrade head
# CMD: uvicorn app.main:app --host 0.0.0.0 --port 8000
# HEALTHCHECK: GET /health
```

---

## 17. 代碼邏輯詳解

### 17.1 Widget 完整初始化流程

```
BugSpark.init(config)
  │
  ├── 1. mergeConfig(config)
  │      ├── 驗證 projectKey 存在
  │      ├── 驗證 endpoint 存在且係合法 URL
  │      └── 合併默認值
  │
  ├── 2. 啟動攔截器
  │      ├── consoleInterceptor.start(maxConsoleLogs)  → patch console.*
  │      ├── networkInterceptor.start(endpoint, maxNetworkLogs) → patch fetch/XHR
  │      ├── errorTracker.start() → window.onerror + unhandledrejection
  │      ├── performanceCollector.init() → PerformanceObserver
  │      └── (如果 enableSessionRecording) sessionRecorder.start()
  │
  ├── 3. 掛載 UI
  │      ├── widgetContainer.mount(primaryColor, theme) → Shadow DOM
  │      └── floatingButton.mount(root, position, onClick: open)
  │
  └── 4. 設定全局 window.BugSpark

BugSpark.open()
  │
  ├── 1. floatingButton.hide()
  └── 2. reportModal.mount(root, callbacks)
         ├── 「截圖」按鈕 → handleCapture()
         │     ├── reportModal.unmount()
         │     ├── captureScreenshot() → html2canvas → Canvas
         │     ├── Canvas → Blob (PNG)
         │     ├── Blob → Object URL
         │     └── reportModal.mount(root, callbacks, screenshotUrl)
         │
         ├── 「標註」按鈕 → handleAnnotate()
         │     ├── reportModal.unmount()
         │     ├── annotationOverlay.mount(root, canvas, callbacks)
         │     │     ├── 工具列：pen, arrow, rect, circle, text, blur
         │     │     ├── 色盤：紅, 橙, 黃, 綠, 藍, 黑, 白
         │     │     ├── 線寬：2, 4, 6
         │     │     └── undo / redo
         │     └── 「完成」→ getAnnotatedCanvas() → 返回報告表單
         │
         └── 「提交」→ handleSubmit(formData)
               ├── 驗證標題 ≥ 3 字元
               ├── 收集所有數據：
               │     ├── consoleInterceptor.getEntries()
               │     ├── networkInterceptor.getEntries()
               │     ├── sessionRecorder.getEvents()
               │     ├── collectMetadata()
               │     └── getPerformanceMetrics()
               ├── 建構 BugReport 對象
               ├── submitReport(config, report)
               │     ├── beforeSend(report) → 可修改/過濾
               │     ├── uploadScreenshot() → S3
               │     ├── POST /reports → API
               │     └── onSubmit(report) callback
               └── showToast('success') 或 showToast('error')

BugSpark.destroy()
  │
  ├── consoleInterceptor.stop()   → 還原 console.*
  ├── networkInterceptor.stop()   → 還原 fetch/XHR
  ├── errorTracker.stop()
  ├── performanceCollector.stop()
  ├── sessionRecorder.stop()
  └── widgetContainer.unmount()   → 移除 Shadow DOM
```

### 17.2 API 報告處理流程

```
Widget → POST /api/v1/reports (X-API-Key)
  │
  ├── 1. validate_api_key(X-API-Key)
  │      ├── 用 key prefix 搵數據庫記錄
  │      ├── hash(key) == project.api_key_hash ?
  │      └── project.is_active ?
  │
  ├── 2. tracking_id_service.generate(project)
  │      ├── project.report_counter += 1
  │      └── 返回 "BSK-{counter:04d}"
  │
  ├── 3. 創建 Report 記錄
  │      ├── 存入 PostgreSQL
  │      └── 返回 201 + report JSON
  │
  ├── 4. webhook_service.dispatch('report.created', report)
  │      ├── 搵項目所有啟用嘅 webhook
  │      ├── 每個 webhook POST payload
  │      └── 帶 HMAC 簽名
  │
  └── 5. 返回 response
```

### 17.3 認證 Middleware 邏輯

```
每個需要認證嘅端點：

JWT 路徑（Dashboard）：
  ├── 讀取 Cookie: bugspark_access_token
  ├── jwt.decode(token, JWT_SECRET, algorithms=[HS256])
  ├── 從 payload 攞 user_id
  └── 查數據庫搵 User → 返回 current_user

PAT 路徑（CLI）：
  ├── 讀取 Header: Authorization: Bearer bsk_pat_xxx
  ├── hash(token)
  ├── 查數據庫 personal_access_tokens where token_hash = hash
  ├── 檢查 expires_at
  ├── 更新 last_used_at
  └── 從 token.user_id 搵 User → 返回 current_user

API Key 路徑（Widget）：
  ├── 讀取 Header: X-API-Key
  ├── 提取 prefix (前 12 碼)
  ├── 查數據庫 projects where api_key_prefix = prefix
  ├── hash(full_key) == project.api_key_hash ?
  └── 返回 project
```

### 17.4 AI 分析流程

```
POST /api/v1/reports/{id}/analyze
  │
  ├── 1. 驗證 JWT → current_user
  ├── 2. 搵 Report
  ├── 3. 組裝 prompt：
  │      ├── 報告標題 + 描述
  │      ├── Console 日誌（if any）
  │      ├── Network 請求（if any）
  │      ├── 設備資訊
  │      └── 效能指標
  │
  ├── 4. 呼叫 Anthropic Claude API
  │      ├── System prompt: "你係一個 Bug 分析專家..."
  │      └── User prompt: 報告詳情
  │
  └── 5. 返回分析結果：
         ├── suggested_category
         ├── suggested_severity
         ├── root_cause_analysis
         ├── reproduction_steps
         └── recommended_fix
```

---

## 18. 文件結構全覽

```
BugSpark/
├── .github/
│   └── workflows/
│       ├── ci.yml                    ← PR CI pipeline
│       └── deploy.yml                ← Post-merge deploy
│
├── docs/
│   ├── backup-strategy.md            ← 備份策略
│   ├── future-plan.md                ← 未來規劃
│   ├── production-readiness-fixes.md ← 生產就緒修復
│   ├── report-verification.md        ← 報告驗證
│   ├── testing-guide.md              ← 測試指南（廣東話）
│   └── index.html                    ← 整合指南
│
├── packages/
│   ├── api/                          ← FastAPI 後端
│   │   ├── app/
│   │   │   ├── main.py              ← FastAPI 入口
│   │   │   ├── config.py            ← Pydantic Settings
│   │   │   ├── database.py          ← SQLAlchemy engine + session
│   │   │   ├── dependencies.py      ← Auth 依賴注入
│   │   │   ├── exceptions.py        ← 全局錯誤處理
│   │   │   ├── models/              ← SQLAlchemy 模型
│   │   │   │   ├── user.py
│   │   │   │   ├── project.py
│   │   │   │   ├── report.py
│   │   │   │   ├── comment.py
│   │   │   │   ├── webhook.py
│   │   │   │   ├── integration.py
│   │   │   │   └── personal_access_token.py
│   │   │   ├── routers/             ← API 路由
│   │   │   │   ├── auth.py
│   │   │   │   ├── tokens.py
│   │   │   │   ├── admin.py
│   │   │   │   ├── projects.py
│   │   │   │   ├── reports.py
│   │   │   │   ├── upload.py
│   │   │   │   ├── comments.py
│   │   │   │   ├── webhooks.py
│   │   │   │   ├── stats.py
│   │   │   │   ├── analysis.py
│   │   │   │   ├── integrations.py
│   │   │   │   └── plans.py
│   │   │   ├── schemas/             ← Pydantic 請求/響應 schema
│   │   │   ├── services/            ← 業務邏輯層
│   │   │   │   ├── auth_service.py
│   │   │   │   ├── storage_service.py
│   │   │   │   ├── ai_analysis_service.py
│   │   │   │   ├── github_integration.py
│   │   │   │   ├── webhook_service.py
│   │   │   │   ├── similarity_service.py
│   │   │   │   ├── stats_service.py
│   │   │   │   ├── plan_limits_service.py
│   │   │   │   └── tracking_id_service.py
│   │   │   └── middleware/
│   │   │       └── csrf.py          ← CSRF 中間件
│   │   ├── migrations/              ← Alembic migrations
│   │   ├── scripts/
│   │   │   └── seed.py              ← 測試數據 seed
│   │   ├── Dockerfile               ← API Docker 鏡像
│   │   ├── alembic.ini
│   │   ├── pyproject.toml
│   │   └── render.yaml              ← Render 部署配置
│   │
│   ├── dashboard/                    ← Next.js 管理面板
│   │   ├── src/
│   │   │   ├── app/                 ← App Router 頁面
│   │   │   │   ├── (auth)/          ← /login, /register
│   │   │   │   ├── (dashboard)/     ← /dashboard, /bugs, /projects, /settings, /admin
│   │   │   │   └── (public)/        ← /, /about, /features, /pricing, /docs
│   │   │   ├── components/          ← React 組件
│   │   │   │   ├── bugs/            ← Bug 相關組件
│   │   │   │   ├── dashboard/       ← Dashboard 統計組件
│   │   │   │   ├── layout/          ← Sidebar, Topbar, MobileNav
│   │   │   │   ├── projects/        ← 項目組件
│   │   │   │   ├── landing/         ← Landing page 組件
│   │   │   │   └── shared/          ← 共用組件
│   │   │   ├── hooks/               ← TanStack Query hooks
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts    ← Axios 客戶端
│   │   │   │   └── auth.ts          ← Auth 工具函數
│   │   │   ├── providers/           ← Context providers
│   │   │   ├── types/               ← TypeScript 類型
│   │   │   └── messages/            ← i18n 翻譯
│   │   │       ├── en.json
│   │   │       └── zh-TW.json
│   │   ├── content/docs/            ← MDX 文檔
│   │   └── package.json
│   │
│   ├── widget/                       ← 嵌入式 Bug 報告 SDK
│   │   ├── src/
│   │   │   ├── index.ts             ← 主入口 + autoInit
│   │   │   ├── types.ts             ← TypeScript 類型
│   │   │   ├── config.ts            ← 配置合併 + 驗證
│   │   │   ├── api/
│   │   │   │   └── report-composer.ts  ← 截圖上傳 + 報告提交
│   │   │   ├── core/
│   │   │   │   ├── screenshot-engine.ts     ← html2canvas 截圖
│   │   │   │   ├── console-interceptor.ts   ← Console 攔截
│   │   │   │   ├── network-interceptor.ts   ← Network 攔截
│   │   │   │   ├── error-tracker.ts         ← 全局錯誤追蹤
│   │   │   │   ├── session-recorder.ts      ← 用戶操作錄製
│   │   │   │   ├── metadata-collector.ts    ← 設備資訊收集
│   │   │   │   ├── performance-collector.ts ← Web Vitals
│   │   │   │   ├── annotation-tools.ts      ← 標註工具
│   │   │   │   ├── annotation-text-blur.ts  ← 文字 + 模糊工具
│   │   │   │   ├── annotation-canvas.ts     ← 標註畫布管理
│   │   │   │   └── annotation-history.ts    ← Undo/Redo
│   │   │   ├── ui/
│   │   │   │   ├── widget-container.ts      ← Shadow DOM 容器
│   │   │   │   ├── floating-button.ts       ← 浮動按鈕
│   │   │   │   ├── report-modal.ts          ← 報告表單
│   │   │   │   ├── annotation-overlay.ts    ← 標註覆蓋層
│   │   │   │   ├── toast.ts                 ← 提示訊息
│   │   │   │   └── styles.ts               ← CSS 樣式生成
│   │   │   └── utils/
│   │   │       ├── event-emitter.ts         ← 事件發射器
│   │   │       └── dom-helpers.ts           ← DOM 工具函數
│   │   ├── rollup.config.mjs        ← Rollup 打包配置
│   │   └── package.json
│   │
│   └── cli/                          ← 命令行工具
│       ├── src/
│       │   ├── index.ts             ← Commander.js 主程序
│       │   ├── commands/
│       │   │   ├── login.ts
│       │   │   ├── logout.ts
│       │   │   ├── register.ts
│       │   │   ├── whoami.ts
│       │   │   ├── init.ts
│       │   │   ├── projects.ts
│       │   │   ├── reports.ts
│       │   │   └── tokens.ts
│       │   └── lib/
│       │       ├── api-client.ts    ← CLI API 客戶端
│       │       ├── config.ts        ← ~/.bugspark/config.json 管理
│       │       ├── errors.ts        ← 錯誤處理
│       │       └── output.ts        ← 終端輸出格式化
│       ├── rollup.config.mjs
│       └── package.json
│
├── docker-compose.yml                ← PostgreSQL + MinIO
├── turbo.json                        ← Turborepo 配置
├── pnpm-workspace.yaml               ← pnpm workspace
├── package.json                      ← 根 scripts
├── .env.example                      ← 環境變數模板
└── .gitignore
```

---

## 總結

BugSpark 係一個完整嘅 Bug 報告生態系統，包含：

| 組件 | 功能 | 技術 |
|------|------|------|
| **Widget** | 嵌入網站，自動截圖 + 標註 + 日誌收集 | TypeScript、Rollup、html2canvas-pro、Shadow DOM |
| **API** | 後端服務，處理報告、認證、存儲 | FastAPI、SQLAlchemy、PostgreSQL、S3 |
| **Dashboard** | 管理面板，查看同管理 Bug | Next.js 15、React 19、TanStack Query |
| **CLI** | 命令行管理工具 | Commander.js、Chalk |

核心流程簡單明瞭：

> **用戶見到 Bug → 按 Widget → 截圖 + 標註 → 自動收集日誌 → 提交 → 開發者喺 Dashboard 查看 → 解決問題**

整個系統設計考慮咗：
- **安全**：API Key hash、JWT HttpOnly Cookie、CSRF 防護、Rate Limiting
- **可擴展**：Webhook、GitHub 整合、AI 分析
- **開發者體驗**：CLI 工具、Swagger 文檔、Docker 本地開發
- **用戶體驗**：Shadow DOM 隔離、Dark/Light 主題、手機響應式

---

*呢份報告涵蓋咗 BugSpark 嘅所有方面，包括架構、代碼邏輯、CLI 指令、API 端點、數據庫、認證、部署等。如果有任何問題，歡迎查閱源碼或者問我！*
