# BugSpark 報告真確性與需要性核查（Code‑Verified）

最後更新：2026-02-09  
範圍：`packages/widget`、`packages/api`、`packages/dashboard`  
方法：直接檢視原始碼（無執行程式）

## 核心結論（摘要）
- 架構描述同 widget 功能大部分屬實（截圖、註解、console/network logs、Shadow DOM）。
- Dashboard 功能「欠缺 drag-and-drop」唔正確，實際已有 Kanban 拖拉更新 status。
- 安全層面有幾項高風險屬實：public screenshot URL、refresh token 存 localStorage、tracking_id 生成 race condition。
- Webhook 存在簽名功能，但未見在 report 建立時觸發。

## 真確性 + 需要性總表

| 項目（報告主張） | Code 驗證 | 狀態 | 需要性 |

| --- | --- | --- | --- |
| Script tag + data-api-key 自動初始化 | `packages/widget/src/index.ts` | ✅ 真 | P1 |
| Shadow DOM 隔離 CSS | `packages/widget/src/ui/widget-container.ts` | ✅ 真 | P1 |
| html2canvas 截圖 | `packages/widget/src/core/screenshot-engine.ts` | ✅ 真 | P1 |
| Annotation tools（pen/arrow/rect/circle/text/blur） | `packages/widget/src/core/annotation-*` | ✅ 真 | P1 |
| Console logs（最多 100 條） | `packages/widget/src/core/console-interceptor.ts` | ✅ 真 | P1 |
| Network logs（最多 50 條） | `packages/widget/src/core/network-interceptor.ts` | ✅ 真 | P1 |
| User actions（click/scroll/nav，30 秒） | `packages/widget/src/core/session-recorder.ts` | ✅ 真 | P1 |
| Metadata（UA/viewport/locale/timezone） | `packages/widget/src/core/metadata-collector.ts` | ✅ 真 | P2 |
| Screenshot 先 upload，再 submit report | `packages/widget/src/api/report-composer.ts` | ✅ 真 | P1 |
| tracking_id 生成（BUG-0001） | `packages/api/app/services/tracking_id_service.py` | ✅ 真 | P0 |
| tracking_id 有 race condition | `packages/api/app/services/tracking_id_service.py` | ✅ 真 | P0 |
| Dashboard 有 Kanban + Table | `packages/dashboard/src/app/(dashboard)/bugs/page.tsx` | ✅ 真 | P1 |
| Kanban 無 drag-and-drop | `packages/dashboard/src/components/bugs/kanban-board.tsx` | ❌ 假 | 無需 |
| Recharts 圖表（30日趨勢、severity 分佈） | `packages/dashboard/src/components/dashboard/*` | ✅ 真 | P2 |
| Dark mode toggle 缺失 | `packages/dashboard/src/app/(dashboard)/settings/page.tsx` | ⚠️ 半真（有設定但未見 CSS 實作） | P2 |
| Real-time 更新（WebSocket/SSE）缺失 | 未見相關實作 | ✅ 真 | P1 |
| Webhook 有 HMAC-SHA256 簽名 | `packages/api/app/services/webhook_service.py` | ✅ 真 | P1 |
| Webhook 建立時會觸發 | 未見呼叫 `deliver_webhook` | ❌ 未見 | P1 |
| Rate limiting 100/min | `packages/api/app/main.py` | ⚠️ 半真（全域 IP 限制，非 per-key） | P1 |
| API key scoping（read/write）缺失 | 未見 role/scope 欄位 | ✅ 真 | P1 |
| Screenshot URL 公開可直接存取 | `packages/api/app/services/storage_service.py` | ✅ 真 | P0 |
| JWT 存 localStorage | `packages/dashboard/src/providers/auth-provider.tsx` | ⚠️ 半真（refresh token） | P0 |
| CSRF protection 缺失 | 未見 CSRF 機制 | ✅ 真 | P1 |
| Input sanitization for XSS 缺失 | 未見 server-side sanitize | ✅ 真（未見實作） | P1 |
| 缺少關鍵 index | `packages/api/migrations/*` | ✅ 真 | P1 |
| Reports/Comments 無 soft delete | `packages/api/app/routers/reports.py` | ✅ 真 | P2 |
| Stats 每次即時計算 | `packages/api/app/services/stats_service.py` | ✅ 真 | P2 |
| API Secret 生成但用途不明 | `packages/api/app/routers/projects.py` | ✅ 真（未見使用） | P2 |
| Webhook secret 不能 rotate | `packages/api/app/routers/webhooks.py` | ✅ 真 | P2 |

## 優先級修正清單（建議）

### P0（高風險 / 需要即時處理）
- **tracking_id race condition**：用 DB sequence 或 transaction lock per project 生成 ID。  
  影響：並發報告會撞號，造成錯誤或資料覆蓋。
- **Public screenshot URL**：改用 presigned URL 或授權存取。  
  影響：任何人取得 URL 可見截圖，可能含敏感資料。
- **Refresh token 存 localStorage**：改用 HttpOnly cookie。  
  影響：XSS 可偷 token。

### P1（中期優化 / 直接影響穩定性）
- **Webhook 觸發未接入**：建立 report 後要呼叫 `deliver_webhook`，並放入 background job + retry。  
  影響：對外整合不可用或會阻塞請求。
- **Rate limiting 改為 per‑API key**：避免多 IP 繞過。  
- **缺少 DB index**：至少加 `reports.project_id`, `(status,severity)`, `created_at`, `(project_id,tracking_id)`。  
  影響：列表與統計在量大時會變慢。
- **Input sanitization**：server 端 sanitize 或統一輸出 escape。  
  影響：若前端誤用 `dangerouslySetInnerHTML` 會觸發 XSS。
- **API key scoping**：加入 read/write 權限或 role。  

### P2（體驗 / 產品化提升）
- **Dark mode 實作補齊**（Dashboard）：Theme preference 已存，但 CSS 未跟。  
- **Notifications / keyboard shortcuts**：提升操作效率。  
- **Soft delete**（reports/comments）：方便審計與復原。  
- **Stats cache 或 materialized view**：大數據量下改善效能。  
- **Webhook secret rotation**：管理性更好。

## 註記與限制
- 本文件基於目前 repo 代碼檢視，未包含執行環境配置或外部服務設定。  
- 「未見」並不代表不存在，只代表在目前 repo 內未找到實作。
