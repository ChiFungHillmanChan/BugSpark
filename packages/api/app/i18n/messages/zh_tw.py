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
    # Admin
    "admin.user_not_found": "找不到使用者",
    "admin.cannot_demote_self": "無法更改自己的角色",
    "admin.invalid_role": "無效的角色",
    "admin.invalid_plan": "無效的方案",
    "admin.forbidden": "需要管理員權限",
    # 方案限制
    "plan.project_limit": "已達方案上限：您的方案最多允許 {limit} 個專案。請升級方案。",
    "plan.report_per_project_limit": "已達方案上限：您的方案每個專案最多允許 {limit} 則回報。請升級方案。",
    "plan.report_monthly_limit": "已達方案上限：您的方案每月最多允許 {limit} 則回報。請升級方案。",
}
