# BugSpark 測試指南：點樣用 BugSpark 做 Bug Testing

最後更新：2026-02-09

---

## 概覽

呢份文件教你點樣用 BugSpark 做 Bug Testing，由本地開發到雲端部署，完整行一次。
分兩個場景：**本地測試**（最快上手）同 **雲端測試**（用免費 plan 部署畀其他人用）。

---

## 場景一：本地測試（5 分鐘上手）

### 前置條件
- Docker Desktop（裝咗就得）
- Node.js 18+
- Python 3.11+
- pnpm

### 步驟

#### 1. 啟動本地資料庫同儲存

```bash
pnpm docker:up
```

呢個指令會啟動：
- **PostgreSQL 16**（port 5432）— 儲存所有 users、projects、reports
- **MinIO**（port 9000/9001）— 本地 S3 儲存 screenshots

#### 2. 跑 migration 同 seed 數據

```bash
pnpm db:migrate
pnpm db:seed
```

Seed 完之後你會得到：
- 測試帳號：`test@bugspark.dev` / `password123`
- 兩個示範專案（各有 API key）
- 20 份示範錯誤報告（有 console log、network log、user actions）

Terminal 會 print 出兩個 API key，記低佢哋。

#### 3. 啟動 API + Dashboard

```bash
# 分開兩個 terminal
pnpm dev:api        # http://localhost:8000
pnpm dev:dashboard   # http://localhost:3000
```

#### 4. 登入 Dashboard

打開 `http://localhost:3000`，用 `test@bugspark.dev` / `password123` 登入。
你會見到：
- 儀表板有 20 份 seeded bug reports
- 兩個專案 + 佢哋嘅 API key

#### 5. Build Widget

```bash
pnpm dev:widget   # 或者 cd packages/widget && pnpm build
```

Build 完會產生：
- `packages/widget/dist/bugspark.iife.js` — Script tag 用
- `packages/widget/dist/bugspark.esm.js` — npm import 用

#### 6. 喺任何網頁嵌入 Widget

建立一個 `test.html`：

```html
<!DOCTYPE html>
<html>
<head><title>BugSpark Test</title></head>
<body>
  <h1>我嘅測試頁面</h1>
  <p>試下 click 右下角個蟲仔按鈕報告 bug。</p>

  <script
    src="http://localhost:5173/bugspark.iife.js"
    data-api-key="bsk_pub_你嘅API_KEY"
    data-endpoint="http://localhost:8000/api/v1"
    data-position="bottom-right"
    data-theme="light"
  ></script>
</body>
</html>
```

用 browser 打開呢個 file（或者用 `npx serve .`）。

#### 7. 測試完整流程

**報告 Bug：**
1. Click 右下角嘅紅色蟲仔按鈕 🐛
2. Widget 自動截圖
3.（可選）Click「Annotate」標註截圖 — 有筆、箭嘴、矩形、圓形、文字、模糊工具
4. 填寫：Title、Description、Severity、Category、Email
5. Click「Submit」

**背後發生咗乜：**
1. Screenshot upload 去 `POST /api/v1/upload/screenshot`（X-API-Key 驗證）
2. 標註過嘅 screenshot 同樣 upload
3. 完整報告 POST 去 `POST /api/v1/reports`，包含：
   - 標題 + 描述
   - 嚴重程度 + 分類
   - Screenshot URL + 標註 Screenshot URL
   - 最近 100 條 console log（error、warning、info）
   - 最近 50 個 network request（method、URL、status、duration）
   - 最近 30 秒嘅 user actions（click、scroll、navigation）
   - 裝置資訊（browser、OS、viewport、locale、timezone）
   - 報告者 email

**喺 Dashboard 查看：**
1. 打開 Dashboard → Bugs
2. 新報告會出現喺列表最頂（Table 或 Kanban 視圖）
3. Click 入去睇詳情：
   - 📸 Screenshot（原始 + 標註版本）
   - 🖥️ Console Logs（error 有 stack trace）
   - 🌐 Network Requests（status code、duration、URL）
   - 🎬 Session Timeline（user 做過啲乜）
   - 📱 Device Info（browser、OS、screen size）
4. 可以：
   - 更新 Status（New → Triaging → In Progress → Resolved → Closed）
   - 更新 Severity（Low / Medium / High / Critical）
   - 指派畀 team member
   - 留 comment 討論
   - 匯出去 GitHub Issues
   - 用 AI 分析（需要 Anthropic API key）

---

## 場景二：雲端測試（用免費 plan）

你已經有晒以下服務嘅 credentials：

| 服務 | 用途 | 你嘅狀態 |
|------|------|---------|
| **Vercel** | Dashboard hosting | ✅ 已部署 |
| **Render** | API hosting | ⚙️ render.yaml 已準備好 |
| **Neon** | PostgreSQL | ✅ 已有 connection string |
| **Cloudflare R2** | Screenshot 儲存 | ✅ 已有 keys + endpoint |

### 步驟

#### 1. 部署 API 去 Render（10 分鐘）

去 [render.com](https://render.com)：
1. New → Web Service → Connect GitHub repo
2. Root Directory 設做 `packages/api`
3. Render 會自動識別 `render.yaml`
4. 喺 Environment 加入以下變數：

```
DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_5LGW2tjDvziI@ep-purple-base-aifnsmxa-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=（自己生成一個隨機字串）
S3_ENDPOINT_URL=https://7d2747f6cc21c13e70c7650314efbccc.r2.cloudflarestorage.com
S3_ACCESS_KEY=（你嘅 R2 access key）
S3_SECRET_KEY=（你嘅 R2 secret key）
S3_BUCKET_NAME=bug-spark
S3_PUBLIC_URL=https://pub-7d2747f6cc21c13e70c7650314efbccc.r2.dev
CORS_ORIGINS=https://你嘅vercel網址.vercel.app
COOKIE_SECURE=true
COOKIE_SAMESITE=none
FRONTEND_URL=https://你嘅vercel網址.vercel.app
```

5. Deploy。等 2-3 分鐘。

#### 2. 跑 Migration（2 分鐘）

喺本地跑（指向 Neon DB）：

```bash
cd packages/api
DATABASE_URL="postgresql+asyncpg://neondb_owner:npg_5LGW2tjDvziI@ep-purple-base-aifnsmxa-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" alembic upgrade head
```

（可選）Seed 測試數據：

```bash
DATABASE_URL="postgresql+asyncpg://..." python scripts/seed.py
```

#### 3. 更新 Vercel Dashboard 環境變數

喺 Vercel Dashboard → Settings → Environment Variables：

```
NEXT_PUBLIC_API_URL=https://bugspark-api.onrender.com/api/v1
```

Redeploy。

#### 4. 喺你嘅網站嵌入 Widget

```html
<script
  src="https://cdn.jsdelivr.net/npm/@bugspark/widget@latest/dist/bugspark.iife.js"
  data-api-key="bsk_pub_你喺Dashboard拎到嘅KEY"
  data-endpoint="https://bugspark-api.onrender.com/api/v1"
></script>
```

或者 serve widget 自己嘅 build：upload `bugspark.iife.js` 去 R2 bucket，用 R2 public URL 引用。

#### 5. 測試

同場景一一樣 — click 蟲仔、報告 bug、喺 Dashboard 睇。

---

## Widget 所有配置選項

```javascript
BugSpark.init({
  // 必填
  apiKey: 'bsk_pub_...',

  // API 地址（預設 http://localhost:8000/api/v1）
  endpoint: 'https://bugspark-api.onrender.com/api/v1',

  // 按鈕位置（預設 bottom-right）
  position: 'bottom-right',  // bottom-left, top-right, top-left

  // 主題（預設 light）
  theme: 'light',  // dark, auto

  // 強調色（預設 #e94560）
  primaryColor: '#e94560',

  // 開關功能
  enableScreenshot: true,       // 截圖
  enableConsoleLogs: true,      // Console log 擷取（最多 100 條）
  enableNetworkLogs: true,      // Network request 擷取（最多 50 個）
  enableSessionRecording: true, // User action 錄製（最近 30 秒）

  // 預先識別用戶（可選）
  user: {
    id: 'user_123',
    email: 'user@example.com',
    name: 'Alice'
  },

  // Callback：提交前攔截（return null 取消提交）
  beforeSend(report) {
    // 過濾敏感資料
    report.consoleLogs = report.consoleLogs.filter(
      log => !log.message.includes('password')
    );
    return report;
  },

  // Callback：提交成功後
  onSubmit(report) {
    console.log('Bug reported:', report.title);
  }
});
```

### 程式化控制

```javascript
BugSpark.open();      // 打開報告表單
BugSpark.close();     // 關閉表單
BugSpark.destroy();   // 完全移除 Widget
BugSpark.identify({   // 登入後識別用戶
  id: 'user_456',
  email: 'bob@example.com'
});
```

---

## 每份 Bug Report 自動擷取嘅數據

| 數據類型 | 詳情 | 對 Testing 嘅價值 |
|---------|------|-------------------|
| **截圖** | html2canvas 全頁截圖 + 標註工具 | 一眼睇到 UI 問題，唔使叫 tester 描述 |
| **Console Logs** | 最近 100 條 log/warn/error + stack trace | 直接睇到 JS error，唔使叫 tester 開 DevTools |
| **Network Requests** | 最近 50 個 fetch/XHR（method、URL、status、duration） | 即刻知道邊個 API call 失敗或者慢 |
| **User Actions** | 最近 30 秒嘅 click（有 CSS selector）、scroll、resize、navigation | 知道 tester 做咗啲乜先觸發到 bug |
| **Error Stack Trace** | uncaught exception + unhandled promise rejection | 直接定位到邊行 code 出事 |
| **裝置資訊** | Browser、OS、viewport、screen resolution、locale、timezone、connection type | 知道係咪特定 browser/device 先有問題 |
| **用戶身份** | ID、email、name（如果有 call identify） | 知道邊個 tester 報嘅 bug |

---

## 測試場景建議

### QA 團隊內部測試

1. 每個 QA 用自己 email `identify()` — 報告自動帶名
2. 用 Kanban view 做 triage — 拖拉改 status
3. 設 webhook 通知 Slack — 新 bug 即時收到
4. 用 AI 分析自動分類 — 慳手動 triage 時間

### 客戶 UAT（User Acceptance Testing）

1. 畀客戶嘅網站加 Widget script tag
2. 客戶 click 蟲仔報告問題 — 唔使教佢哋開 DevTools
3. 你喺 Dashboard 收到完整報告 — 有截圖、console、network 全部
4. 匯出去 GitHub Issues 做 tracking

### 開發者自測

1. 用 `beforeSend` 過濾敏感 log
2. 用 `enableConsoleLogs: true` 擷取所有 console output
3. 直接喺 Dashboard 睇 network waterfall — 唔使開 Chrome DevTools
4. 用 AI 分析畀你 root cause 建議

---

## 免費 Plan 限制同 Workaround

| 服務 | 限制 | 影響 | Workaround |
|------|------|------|-----------|
| **Vercel Hobby** | 非商業用途；10s function timeout | Testing 冇問題 | 正式收費後升 Pro（US$20/月） |
| **Render Free** | 15 分鐘無流量就瞓覺；wake up 要 30-60 秒 | 第一個 request 會慢 | 加 Vercel cron 每 14 分鐘 ping 一次 keep alive |
| **Neon Free** | 0.5GB storage per project；scale-to-zero | 夠放幾千份 bug report；第一個 query 有 cold start | 數據量大就升 Neon Launch（US$19/月） |
| **Cloudflare R2** | 10GB storage；1M writes/month | 夠放 ~50,000 張截圖 | Testing 階段綽綽有餘 |

### Render Cold Start Workaround

喺 Vercel 加一個 keep-alive API route：

```typescript
// packages/dashboard/src/app/api/keep-alive/route.ts
export async function GET() {
  await fetch('https://bugspark-api.onrender.com/health');
  return Response.json({ ok: true });
}
```

喺 `vercel.json` 加 cron：

```json
{
  "crons": [{ "path": "/api/keep-alive", "schedule": "*/14 * * * *" }]
}
```

免費，用 Vercel 嘅 cron quota（100 個/project）。

---

## 快速檢查清單

### 本地測試
- [ ] `pnpm docker:up` — Postgres + MinIO 啟動
- [ ] `pnpm db:migrate` — 建立 tables
- [ ] `pnpm db:seed` — 填入測試數據
- [ ] `pnpm dev:api` — API 跑喺 :8000
- [ ] `pnpm dev:dashboard` — Dashboard 跑喺 :3000
- [ ] `pnpm dev:widget` — Widget build + watch
- [ ] 喺 test page 嵌入 widget script
- [ ] 報告一個 bug → Dashboard 睇到

### 雲端測試
- [ ] Render API 部署成功 + 環境變數設好
- [ ] Neon DB migration 跑完
- [ ] Vercel Dashboard 環境變數更新 + redeploy
- [ ] CORS_ORIGINS 兩邊都設好
- [ ] Widget script 嵌入目標網站
- [ ] 報告一個 bug → Dashboard 睇到
- [ ]（可選）Render keep-alive cron 設好

---

## 常見問題

**Q: Widget 個蟲仔按鈕冇出現？**
A: Check browser console 有冇 error。通常係 `data-api-key` 打錯或者 script src path 唔啱。

**Q: 報告提交失敗？**
A: Check CORS — API 嘅 `CORS_ORIGINS` 要包含你個網站嘅 domain。本地用 `http://localhost:3000`。

**Q: Screenshot 係灰色？**
A: html2canvas 有時唔支援某啲 CSS（例如 `backdrop-filter`）。Widget 會 fallback 做灰色 canvas，報告照常提交。

**Q: Dashboard 登入失敗？**
A: 確認 API 同 Dashboard 指向同一個 database。Seed script 要跑過先有 test user。

**Q: AI 分析按鈕 click 咗冇反應？**
A: 需要喺 `.env` 設 `ANTHROPIC_API_KEY`。冇 key 就用唔到 AI 功能，其他功能照用。
