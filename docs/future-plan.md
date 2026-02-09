# BugSpark 未來發展計劃

最後更新：2026-02-09

---

## 概覽

呢份文件記錄咗 BugSpark 嘅未來發展方向，分四個階段推進。主要目標係令 BugSpark 成為一個可以收費、穩定運作、同埋喺香港市場有競爭力嘅 Bug Reporting SaaS 產品。

---

## 第一階段：正式上線準備（2026 Q1）

### 定價同收費系統
- 加入訂閱方案：Free / Starter（HK$199/月）/ Team（HK$799/月）/ Business（HK$2,399/月）
- 整合 **Stripe** 做國際信用卡 + Apple Pay + Google Pay 收費
- 透過 **Airwallex** 加入香港本地付款：AlipayHK、WeChat Pay、轉數快（FPS）
- 每個方案設用量上限（報告數量、專案數量、席位數量）
- 加入自託管授權方案（HK$15,999/年）

### 部署上線
- Dashboard 部署去 **Vercel**（Next.js 原生支援、全球 CDN）
- API 部署去 **Render**（現有 `render.yaml` 已準備好）
- 資料庫用 **Neon PostgreSQL**（serverless、按用量計費）
- 檔案儲存由 MinIO 轉去 **Cloudflare R2**（10GB 免費、零 egress fee）
- Widget JS 放上 **Cloudflare CDN** 或 **jsDelivr**
- 亞洲地區延遲優化（考慮 AWS ap-east-1 香港 region）

### 核心功能補齊
- **電郵通知**：新錯誤、狀態變更、被指派時發 email
- **團隊管理**：邀請成員、角色分三級（管理員 / 成員 / 檢視者）
- **用量儀表板**：顯示目前方案嘅用量 vs 上限
- **Webhook 觸發修正**：建立報告後要真正呼叫 `deliver_webhook`（依家只有簽名功能但未接入）

---

## 第二階段：追平競爭對手（2026 Q2）

### 同 Marker.io / Usersnap 睇齊嘅功能

| 功能 | Marker.io 有冇 | BugSpark 目前 | 計劃 |
|------|---------------|--------------|------|
| Jira 雙向同步 | ✅ 有 | ❌ 冇（只有 GitHub） | Q2 加入 |
| Linear 整合 | ❌ 冇 | ❌ 冇 | Q2 加入 |
| Slack / Discord 通知 | ✅ 有 | ❌ 冇 | Q2 加入 |
| Session Replay 影片 | ✅ 有 | ⚠️ 只有時間軸 | Q2 升級做 DOM 錄影 |
| 自訂品牌 | ✅ Team plan | ❌ 冇 | Q2 加入 |
| 批量操作 | ✅ 有 | ❌ 冇 | Q2 加入 |

### 具體工作項目
- **Jira 整合**：由錯誤報告建立 Jira issue，狀態雙向同步
- **Linear 整合**：push 錯誤去 Linear，帶齊 metadata
- **Slack / Discord**：webhook template，即時通知到團隊 channel
- **Notion 匯出**：將錯誤報告匯出做 Notion page
- **Session Replay 影片**：用 rrweb 做完整 DOM 錄影，唔止係事件時間軸
- **自訂欄位**：每個專案可以加自己嘅報告欄位
- **錯誤報告範本**：預設範本，方便 QA 團隊統一格式
- **批量操作**：一次過關閉、指派或者重新分類多個錯誤
- **Widget 自訂**：顏色、字型、位置、品牌 logo 全部可改

---

## 第三階段：做出差異化（2026 Q3）

### AI 功能（BugSpark 嘅核心優勢）
- **智能重複偵測**：用 embedding（唔止 pg_trgm text match）做相似度比對
- **自動分類**：報告建立時 AI 自動指派嚴重程度同類別，唔使人手操作
- **根本原因建議**：AI 分析 console log + network log，直接建議修復方向
- **趨勢分析**：偵測跨專案嘅重複錯誤模式，提早預警

### 企業級功能
- **SSO / SAML**：支援 Okta、Azure AD 等企業單一登入
- **審計日誌**：記錄所有用戶操作，符合合規需要
- **數據落地選擇**：用戶可以揀伺服器放喺香港、歐盟定美國
- **SLA 同優先支援**：Business plan 專屬客服同回應時間保證

### 公開功能
- **狀態頁面**：每個專案一個公開頁面，顯示錯誤修復進度畀最終用戶睇
- **更新日誌 Widget**：用戶報告嘅 bug 修好咗就自動通知佢
- **意見回饋入口**：畀用戶投票揀佢哋想要嘅功能

---

## 第四階段：增長同擴展（2026 Q4）

### 平台擴展
- **整合市集**：第三方整合（Asana、Monday.com、ClickUp、Trello）
- **API v2**：加入 GraphQL API，同現有 REST API 並存
- **手機 SDK**：原生 iOS 同 Android bug reporter
- **瀏覽器擴展**：唔使裝 widget 都可以喺任何網站回報錯誤

### 商業模式擴展
- **白標方案**：代理商用自己品牌轉售 BugSpark
- **自託管 Docker 映像**：帶 license key，部署喺客戶自己嘅伺服器
- **合作夥伴計劃**：代理商同顧問嘅推薦佣金

### 合規同安全認證
- **SOC 2 Type II**：企業安全認證（香港金融機構需要）
- **PDPO 合規**：符合香港《個人資料（私隱）條例》
- **GDPR**：歐盟數據保護（有海外客戶需要）
- **ISO 27001**：資訊安全管理認證

---

## 競爭對手比較同定位

### BugSpark vs 主要競爭對手

| | BugSpark | Marker.io | Usersnap | Sentry |
|---|---|---|---|---|
| **定位** | Bug Report Widget + AI 分析 | Bug Report Widget | Feedback Widget | Error Monitoring |
| **起步價** | 免費 | US$39/月 | US$69/月 | 免費 |
| **AI 分析** | ✅ Anthropic Claude | ❌ | ❌ | ✅ Seer |
| **自託管** | ✅ | ❌ | ❌ | ✅ |
| **中文支援** | ✅ 繁體 + 廣東話 | ❌ | ❌ | 有限 |
| **Console + Network Log** | ✅ 兩樣都有 | 有限 | ❌ | ✅ |
| **香港付款方式** | ✅ 計劃中 | ❌ | ❌ | ❌ |

### BugSpark 嘅護城河
1. **AI 分析** — 自動分類同根本原因建議，慳返 QA 好多時間
2. **自託管** — 注重私隱嘅企業（銀行、政府）可以部署喺自己嘅伺服器
3. **中文 + 廣東話** — 香港市場唯一有本地化嘅 Bug Reporting Widget
4. **全面數據擷取** — Console + Network + Session + Screenshot 一次過搞掂
5. **價錢** — 免費計劃 + 比 Marker.io 平嘅付費方案

---

## 香港市場策略

### 目標客戶
1. **本地 startup**（Cyberport、Science Park 嘅公司）
2. **Web agency**（幫客戶整網站嘅公司，需要 QA 工具）
3. **中小企**（有自己網站或 web app 嘅公司）
4. **企業 IT 部門**（銀行、保險、政府，需要自託管）

### 推廣渠道
- **StartupsHK / HK Startup Community** — 社群推廣
- **Cyberport / Science Park** — incubator 內部推薦
- **Product Hunt / Hacker News** — 國際曝光
- **SEO 關鍵字**：「Bug 報告工具」、「網站錯誤追蹤」、「QA 測試工具香港」
- **LinkedIn HK tech community** — B2B 推廣

### 本地化要點
- 價錢用 **HK$** 顯示，年繳有折扣
- 支援 **轉數快（FPS）、AlipayHK、WeChat Pay**
- 加入 **簡體中文（zh-CN）** 支援跨境客戶
- 數據中心喺 **亞洲區**，延遲低

---

## 技術債清理（同步進行）

根據 `docs/report-verification.md` 嘅發現，以下 P0/P1 項目要同新功能一齊處理：

### P0（即時修復）
- [ ] `tracking_id` race condition — 改用 DB sequence
- [ ] Screenshot URL 公開可存取 — 改用 presigned URL
- [ ] Refresh token 存 localStorage — 改用 HttpOnly cookie

### P1（Q1 內完成）
- [ ] Webhook 觸發未接入 — `deliver_webhook` 要接入 report 建立流程
- [ ] Rate limiting 改為 per-API key
- [ ] 加 DB index（`reports.project_id`、`status,severity`、`created_at`）
- [ ] Server 端 input sanitization（防 XSS）
- [ ] API key 加入 read/write scope

---

## 里程碑時間表

| 時間 | 里程碑 | 主要交付物 |
|------|--------|-----------|
| 2026 年 2 月 | 技術債清理 | P0 修復、DB index、Webhook 接入 |
| 2026 年 3 月 | 上線準備 | Stripe 收費、Vercel/Render 部署、團隊管理 |
| 2026 年 4 月 | 正式上線 | 公開網站、定價頁面、免費方案 |
| 2026 年 5 月 | 整合擴展 | Jira + Linear + Slack |
| 2026 年 6 月 | Session Replay | rrweb DOM 錄影 |
| 2026 年 7-8 月 | AI 升級 | Embedding 重複偵測、自動分類 |
| 2026 年 9 月 | 企業功能 | SSO、審計日誌、數據落地 |
| 2026 年 10-12 月 | 擴展 | 手機 SDK、白標、合規認證 |

---

## 註記
- 呢份計劃會每個月 review 一次，按實際進度調整。
- 優先級以用戶反饋同收入影響為準。
- 技術架構決策（例如 rrweb vs 自建 session replay）會另外出技術文件。
