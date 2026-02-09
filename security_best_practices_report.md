# BugSpark Code Review Report (廣東話)

## Executive Summary

今次 review 以 FastAPI backend 同 Next.js dashboard 為主，重點睇咗 auth、reports、comments、upload、integration/webhook 流程。  
高優先問題主要集中喺 **object-level authorization**、**refresh token replay 風險**、同埋 **upload 記憶體 DoS 面**。另外有幾個前後端 contract mismatch，會令正常用戶流程出現 4xx/5xx。

## 高風險 (High)

### F-01: Comments API 有 object-level auth 缺口
- 類別: Security + Logic
- 位置: `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/routers/comments.py:27`, `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/routers/comments.py:42`
- 證據: `list_comments` / `create_comment` 只驗證登入，冇驗證 `report_id` 是否屬於 current user 擁有嘅 project。
- 影響: 已登入但未授權用戶，只要知道 `report_id` 就可以讀/寫其他 project 嘅留言。
- 建議: 先查 `Report` + `Project.owner_id == current_user.id`，授權先俾 list/create；同時補負面測試（跨 project 403）。

### F-02: Refresh token rotation 只「發新 token」但冇「作廢舊 token」
- 類別: Security
- 位置: `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/services/auth_service.py:31`, `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/routers/auth.py:150`
- 證據: refresh token 係 stateless JWT，refresh 時無 jti / token store / blacklist 機制。
- 影響: 被盜 refresh token 可以重播到過期為止。
- 建議: refresh token 加 `jti`，server-side 持久化+輪換（one-time use）；logout 同密碼變更時撤銷全部 active refresh token。

### F-03: Upload endpoint 先全讀入記憶體先做 size check
- 類別: Security + Performance
- 位置: `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/routers/upload.py:17`, `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/services/storage_service.py:33`
- 證據: `await file.read()` 先讀完整文件，之後先比較 `MAX_FILE_SIZE_BYTES`。
- 影響: 大檔案可造成記憶體壓力（DoS）。
- 建議: 用分塊 streaming 驗證大小（超限即中止）；再配合反向代理 request size limit。

### F-04: `get_current_user` 冇驗證 JWT `type=access`
- 類別: Security
- 位置: `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/dependencies.py:38`, `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/dependencies.py:42`
- 證據: decode 後只檢查 `sub`，冇檢查 `type` claim。
- 影響: 一旦 `bugspark_access_token` cookie 被覆寫成 refresh token，可能被當 access token 使用。
- 建議: `get_current_user` 加 `payload["type"] == "access"` 驗證；refresh endpoint 繼續要求 `type == refresh`。

### F-05: Rate limit 配置可能未真正生效（需確認）
- 類別: Security + Abuse Control
- 位置: `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/main.py:25`, `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/routers/auth.py:107`
- 證據: 只見 `Limiter(default_limits=["100/minute"])`，未見 route-level `@limiter.limit(...)`；亦未見可證明 default limit 已套用嘅測試。
- 影響: login/register/refresh 可能無有效節流，增加暴力破解風險。
- 建議: 對 `/auth/login`、`/auth/register`、`/auth/refresh` 加明確 limit；補 integration test 驗證會回 `429`。

## 中風險 (Medium)

### F-06: Webhook URL 欠缺驗證，存在 SSRF 面
- 類別: Security
- 位置: `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/schemas/webhook.py:11`, `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/services/webhook_service.py:39`
- 證據: `url: str` 冇 URL schema / host allowlist 檢查，server 直接 `httpx.post(webhook.url, ...)`。
- 影響: 可觸發對內網/metadata endpoint 出站請求（視乎部署網絡）。
- 建議: 嚴格驗證 scheme+hostname，封鎖私網/loopback/link-local；最好做 egress allowlist。

### F-07: Dashboard 設定頁呼叫咗不存在嘅 API
- 類別: Logic Bug
- 位置: `/Users/hillmanchan/Desktop/BugSpark/packages/dashboard/src/app/(dashboard)/settings/page.tsx:25`, `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/routers/auth.py:163`
- 證據: 前端 `PATCH /auth/me`，後端只有 `GET /auth/me`。
- 影響: 用戶改名功能實際失效（404/405）。
- 建議: 二選一：補後端 `PATCH /auth/me`；或前端移除/改用存在 endpoint。

### F-08: Reports filter 前後端 contract 不一致
- 類別: Logic Bug + Edge Case
- 位置: `/Users/hillmanchan/Desktop/BugSpark/packages/dashboard/src/hooks/use-bugs.ts:12`, `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/routers/reports.py:111`
- 證據: 前端將 status/severity array 用 `join(",")` 傳送；後端用 `Status(status)` / `Severity(severity)` 當單值 enum parse。
- 影響: 多選 filter 容易變成 4xx/5xx 或結果錯誤。
- 建議: API 改成接受 `list[Status]` / `list[Severity]`；或前端改單選並對齊 contract。

### F-09: 多個 enum/UUID/長度邊界缺乏 request-level 驗證
- 類別: Logic Bug + Maintainability
- 位置: `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/routers/reports.py:137`, `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/schemas/auth.py:11`, `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/schemas/project.py:11`
- 證據: 多數 path param 用 `str` 而非 `uuid.UUID`；register/project payload 無長度限制。
- 影響: 非法輸入可能直接打到 DB 層先報錯（500 風險）。
- 建議: path param 改 `uuid.UUID`；schema 加 `min_length/max_length` 同 enum type，將錯誤提早變成 422。

### F-10: API key 以明文儲存並頻繁回傳
- 類別: Security Best Practice
- 位置: `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/models/project.py:24`, `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/schemas/project.py:27`
- 證據: `projects.api_key` 明文儲存；`ProjectResponse` 每次都返回 `api_key`。
- 影響: 一旦 dashboard 有 XSS / log 洩漏，key 容易外流被濫用。
- 建議: 改為「只建立/輪換時顯示一次明文 + DB 存 hash」；平時只顯示 masked key。

## 低風險 (Low)

### F-11: CSRF middleware 將 refresh 列為 exempt
- 類別: Security Hardening
- 位置: `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/middleware/csrf.py:10`, `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/routers/auth.py:125`
- 證據: `/auth/refresh` 喺 `CSRF_EXEMPT_PATHS`，但 endpoint 會改變 cookie 狀態。
- 影響: 可被跨站觸發 refresh（通常影響較低，但屬 session 行為控制面）。
- 建議: 對 refresh 一樣要求 CSRF token，或最少加嚴 Origin 檢查。

### F-12: 可再優化嘅效能細節
- 類別: Performance
- 位置: `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/services/webhook_service.py:38`, `/Users/hillmanchan/Desktop/BugSpark/packages/api/app/services/similarity_service.py:41`
- 證據: 每次 deliver webhook 都新建 `AsyncClient`；similarity 每次先 query pg extension。
- 影響: 高流量時有額外連線/查詢成本。
- 建議: 重用 http client；將 pg_trgm availability 結果 cache。

## 做得好嘅位 (Good Practices)

- G-01 (Security): 密碼使用 bcrypt，冇見到明文密碼儲存。位置：`/Users/hillmanchan/Desktop/BugSpark/packages/api/app/services/auth_service.py:11`
- G-02 (Security): JWT decode 有 algorithm allowlist；access/refresh token 都有 `exp`。位置：`/Users/hillmanchan/Desktop/BugSpark/packages/api/app/services/auth_service.py:45`
- G-03 (Security/Schema): Integration response 冇直接回傳 token，只返 `has_token`。位置：`/Users/hillmanchan/Desktop/BugSpark/packages/api/app/schemas/integration.py:47`
- G-04 (Performance): reports list 有 pagination，並限制 `page_size <= 100`。位置：`/Users/hillmanchan/Desktop/BugSpark/packages/api/app/routers/reports.py:103`
- G-05 (Security): 主要 DB 操作用 SQLAlchemy parameterized 查詢，未見直接 SQL string 拼接 user input（tracking id update 亦有 bind param）。位置：`/Users/hillmanchan/Desktop/BugSpark/packages/api/app/services/tracking_id_service.py:9`

## 驗證狀態 / 風險註記

- 我嘗試執行 `pytest -q`（`/Users/hillmanchan/Desktop/BugSpark/packages/api`）但環境缺少 `aiosqlite`，而且目前 pip metadata 有壞 package version（`Invalid version: '4.0.0-unsupported'`），未能完成自動測試驗證。  
- 關於 rate limit 同 edge security headers，若你喺 CDN / API Gateway 已經做咗，請以部署層設定再交叉確認。
