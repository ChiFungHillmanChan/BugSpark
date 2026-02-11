MESSAGES: dict[str, str] = {
    # Auth
    "auth.email_registered": "此電子郵件已註冊",
    "auth.invalid_credentials": "電子郵件或密碼無效",
    "auth.missing_token": "缺少存取權杖",
    "auth.invalid_token": "權杖無效或已過期",
    "auth.token_missing_subject": "權杖缺少主體",
    "auth.user_not_found": "找不到使用者",
    "auth.missing_refresh": "缺少重新整理權杖",
    "auth.invalid_refresh": "重新整理權杖無效",
    "auth.invalid_token_type": "權杖類型無效",
    "auth.invalid_api_key": "API 金鑰無效",
    "auth.logged_out": "已登出",
    "auth.account_deactivated": "帳號已被停用",
    "auth.token_expired": "個人存取權杖已過期",
    "auth.wrong_current_password": "目前密碼不正確",
    "auth.password_changed": "密碼更新成功",
    # Tokens
    "token.not_found": "找不到權杖",
    "token.not_owner": "非權杖擁有者",
    # Reports
    "report.not_found": "找不到回報",
    "report.not_authorized_view": "無權檢視此回報",
    "report.not_authorized_update": "無權更新此回報",
    "report.not_authorized_delete": "無權刪除此回報",
    # Projects
    "project.not_found": "找不到專案",
    "project.not_owner": "非專案擁有者",
    # 留言
    "comment.not_found": "找不到留言",
    "comment.not_owner": "非留言作者",
    # Admin
    "admin.user_not_found": "找不到使用者",
    "admin.cannot_demote_self": "無法更改自己的角色",
    "admin.invalid_role": "無效的角色",
    "admin.invalid_plan": "無效的方案",
    "admin.forbidden": "需要管理員權限",
    # 裝置驗證
    "device.invalid_code": "無效或已過期的裝置代碼",
    "device.code_expired": "裝置代碼已過期",
    # Beta 測試
    "beta.waiting_list": "您的帳號正在 Beta 測試等候名單中，請等待管理員審核。",
    "beta.rejected": "您的 Beta 測試申請已被拒絕。",
    "beta.registered": "您已加入 Beta 測試等候名單。帳號核准後我們會通知您。",
    "beta.approved": "Beta 測試申請已核准。",
    "beta.already_applied": "此電子郵件的帳號已存在或已申請 Beta 測試。",
    "beta.not_found": "找不到 Beta 使用者。",
    "beta.not_beta_user": "此使用者不是 Beta 申請者。",
    "beta.mode_updated": "Beta 模式設定已更新。",
    # 方案限制
    "plan.project_limit": "已達方案上限：您的方案最多允許 {limit} 個專案。請升級方案。",
    "plan.report_per_project_limit": "已達方案上限：您的方案每個專案最多允許 {limit} 則回報。請升級方案。",
    "plan.report_monthly_limit": "已達方案上限：您的方案每月最多允許 {limit} 則回報。請升級方案。",
}
