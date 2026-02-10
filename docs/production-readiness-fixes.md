# BugSpark 正式環境就緒修復報告

## 概覽

基於 7 個 Agent 嘅審計結果，BugSpark 嘅正式環境就緒評分為 **B- (68/100)**。共識別咗 18 個阻塞問題，涵蓋 API、Dashboard、Widget、CLI、安全性、DevOps 同資料庫。本次修復喺 `fix/production-readiness` 分支上完成，使用 6 個並行 Agent 同時作業。

## 修復範圍

### 資料庫同模型（db-fixer）— 8 個檔案

**問題：** 外鍵缺少 `ondelete` 規則，刪除父記錄時會導致資料庫錯誤；缺少索引影響查詢效能；Comments 關聯使用 `selectin` 預載入造成不必要嘅查詢。

**修復內容：**
- 喺 7 個外鍵加入 `ondelete="CASCADE"` 或 `ondelete="SET NULL"` 規則
  - `projects.owner_id` → CASCADE
  - `reports.project_id` → CASCADE
  - `reports.assignee_id` → SET NULL
  - `comments.report_id` → CASCADE
  - `comments.author_id` → CASCADE
  - `webhooks.project_id` → CASCADE
  - `integrations.project_id` → CASCADE
- 新增 3 個資料庫索引：`projects.owner_id`、`reports.assignee_id`、`webhooks.project_id`
- 將 Report.comments 關聯改為 `lazy="raise"`，強制顯式載入避免 N+1 查詢
- 修正 Project schema 嘅 `domain` 欄位，由可空改為預設空字串
- 建立 Alembic 遷移 `d5e6f7a8b9c0`

### API 後端（api-fixer）— 15 個檔案

**問題：** Report schema 缺少枚舉驗證；S3 同步呼叫阻塞事件迴圈；缺少正式環境配置；PAT 無過期時間；搜尋有 SQL 注入風險；缺少速率限制同安全日誌。

**修復內容：**
- Report schema 加入 `Literal` 類型驗證（severity / category / status）
- S3 操作改用 `asyncio.to_thread()` 非阻塞呼叫 + 單例客戶端
- 新增 `ENVIRONMENT` 配置變數，修正 JWT 生產環境檢查
- 健康檢查端點加入資料庫 ping
- 正式環境自動停用 Swagger/ReDoc 文件
- CLI PAT 預設 90 日過期，登入時清理舊 PAT
- ILIKE 搜尋轉義 `%` 同 `_` 防止 SQL 注入
- 超級管理員繞過權限檢查（相似報告 / 整合 / 分析）
- 分析端點加入速率限制（5 次/分鐘）
- Anthropic AI 呼叫加入 30 秒超時
- 快取 `pg_trgm` 擴展檢查結果
- 概覽統計由 4 個查詢合併為 1 個
- CSRF 失敗加入日誌記錄
- 非 PAT Bearer token 明確拒絕並記錄

### Dashboard 前端（dashboard-fixer）— 11 個檔案

**問題：** 多個組件缺少深色模式支援；主題切換有閃爍（FOUC）；中間件冇檢查認證；部分字串寫死英文。

**修復內容：**
- Kanban 看板加入 `dark:` 變體（背景、文字、骨架屏）
- 整合頁面卡片加入深色模式
- 所有 14 個 MDX 組件加入深色模式（標題、段落、表格、程式碼等）
- `next.config.ts` 加入正式環境 S3 圖片域名
- 主題供應商加入行內腳本，喺 React hydrate 之前套用主題避免閃爍
- 中間件加入 JWT cookie 檢查，未登入自動跳轉 `/login`
- 修正 6 個寫死嘅英文字串（admin 頁面、tokens 頁面）
- 新增 6 個 i18n 翻譯鍵（`admin.loading`、`admin.deactivate`、`admin.activate`、`admin.totalUsersCount`、`settings.saveFailed`、`tokens.loading`）

### Widget SDK（widget-fixer）— 5 個檔案

**問題：** Endpoint 冇 URL 驗證；重試冇延遲；文字標註用 `prompt()` 會跳出瀏覽器；Session 錄製預設開啟浪費資源。

**修復內容：**
- Endpoint 加入 URL 驗證（必須以 `https://` 或 `http://` 開頭）
- 重試機制加入指數退避延遲（1s → 2s → 4s，上限 8s），預設重試次數由 1 改為 2
- `prompt()` 替換為 Shadow DOM 內嘅自訂文字輸入（支援 Enter 確認 / Escape 取消）
- `enableSessionRecording` 預設值由 `true` 改為 `false`

### CLI 工具（cli-fixer）— 3 個檔案

**問題：** HTTP 請求冇超時；損壞嘅配置檔會導致崩潰；錯誤訊息唔夠清楚。

**修復內容：**
- 所有 `fetch` 呼叫加入 30 秒超時（`AbortSignal.timeout(30_000)`）
- `loadConfig` 嘅 `JSON.parse` 加入 try-catch，損壞配置回傳 `null`
- 錯誤訊息根據情境顯示：401（重新登入）/ 403（權限不足）/ 503（服務暫時不可用）/ ECONNREFUSED（伺服器未啟動）/ ENOTFOUND（檢查網絡）/ 超時

### DevOps 同基建（devops-fixer）— 5 個檔案

**問題：** Docker 以 root 身份運行；冇健康檢查；CI 冇依賴審計；冇備份文件。

**修復內容：**
- Dockerfile 加入非 root 用戶（`appuser`）同 `HEALTHCHECK` 指令
- 新增 `.dockerignore` 排除測試同快取檔案
- `render.yaml` 加入 `healthCheckPath: /health`
- CI 工作流新增 `audit` 工作：`pnpm audit` + `pip-audit`
- 新增 `docs/backup-strategy.md` 備份策略文件

## 驗證結果

| 驗證項目 | 結果 |
|---------|------|
| Dashboard ESLint | 0 錯誤，2 個既有警告 |
| Dashboard TypeScript | 0 錯誤 |
| Dashboard vitest | 15 個測試檔案，93 個測試全部通過 |
| Dashboard 正式 build | 成功（所有頁面正常生成） |
| Widget tsc --noEmit | 0 錯誤 |
| Widget vitest | 11 個測試檔案，72 個測試全部通過 |
| Widget 正式 build | 成功（IIFE + ESM） |
| CLI build | 成功（1.8s） |
| API pytest | 103 個測試全部通過（Agent 環境驗證） |

## 回歸修復

Code review 之後發現 3 個回歸問題，已全部修復：

### P1：文字標註工具唔會保存到截圖
**問題：** 將 `prompt()` 替換為自訂輸入框之後，`onPointerUp` 喺用戶打字之前就已經觸發，`pendingShape` 仍然係 `null`，導致文字標註消失。

**修復：** 改變 `createTextTool` 嘅架構，新增 `commitShape` 回調函數直接將形狀推入歷史記錄，繞過 `onPointerUp` 嘅返回機制。

- `packages/widget/src/core/annotation-text-blur.ts` — 新增 `commitShape` 參數，`onPointerUp` 永遠返回 `null`
- `packages/widget/src/core/annotation-canvas.ts` — 傳遞 `history.push` 作為 `commitShape` 回調

### P1：中間件 cookie 檢查阻擋跨域部署
**問題：** Dashboard 中間件檢查 `bugspark_access_token` cookie，但呢個 cookie 由 API host 設置，喺跨域部署中 dashboard 睇唔到。已登入嘅用戶會被重定向到 `/login`。

**修復：** 移除伺服器端 cookie 檢查，清理死代碼（`PUBLIC_PATHS`、`isPublicPath`）。認證繼續由客戶端 `AuthProvider` 處理。

- `packages/dashboard/src/middleware.ts` — 簡化為只處理 locale cookie

### P2：健康檢查喺資料庫斷線時仍回傳 200
**問題：** `/health` 端點喺資料庫無法連接時仍回傳 HTTP 200，導致 Render 同 Docker 嘅健康檢查唔會觸發修復措施。

**修復：** 異常路徑改用 `JSONResponse(status_code=503)`，加入 `warning` 級別日誌記錄。

- `packages/api/app/main.py` — 503 回應 + 異常日誌

## 檔案變更統計

- **修改：** 47 個檔案
- **新增：** 3 個檔案（Alembic 遷移、`.dockerignore`、備份策略文件）
- **涉及套件：** api（22）、dashboard（11）、widget（7）、cli（3）、devops（5）、docs（1）

## 下一步

1. 喺開發環境測試所有功能
2. 執行 `alembic upgrade head` 應用資料庫遷移
3. 手動檢查深色模式（Kanban、整合頁、文件頁）
4. 合併至 `main` 分支
