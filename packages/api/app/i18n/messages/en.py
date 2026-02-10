MESSAGES: dict[str, str] = {
    # Auth
    "auth.email_registered": "Email already registered",
    "auth.invalid_credentials": "Invalid email or password",
    "auth.missing_token": "Missing access token",
    "auth.invalid_token": "Invalid or expired token",
    "auth.token_missing_subject": "Token missing subject",
    "auth.user_not_found": "User not found",
    "auth.missing_refresh": "Missing refresh token",
    "auth.invalid_refresh": "Invalid refresh token",
    "auth.invalid_token_type": "Invalid token type",
    "auth.invalid_api_key": "Invalid API key",
    "auth.logged_out": "Logged out",
    "auth.account_deactivated": "Account has been deactivated",
    "auth.token_expired": "Personal access token has expired",
    "auth.wrong_current_password": "Current password is incorrect",
    "auth.password_changed": "Password updated successfully",
    # Tokens
    "token.not_found": "Token not found",
    "token.not_owner": "Not the token owner",
    # Reports
    "report.not_found": "Report not found",
    "report.not_authorized_view": "Not authorized to view this report",
    "report.not_authorized_update": "Not authorized to update this report",
    "report.not_authorized_delete": "Not authorized to delete this report",
    # Projects
    "project.not_found": "Project not found",
    "project.not_owner": "Not the project owner",
    # Comments
    "comment.not_found": "Comment not found",
    "comment.not_owner": "Not the comment author",
    # Admin
    "admin.user_not_found": "User not found",
    "admin.cannot_demote_self": "Cannot change your own role",
    "admin.invalid_role": "Invalid role",
    "admin.invalid_plan": "Invalid plan",
    "admin.forbidden": "Admin access required",
    # Device auth
    "device.invalid_code": "Invalid or expired device code",
    "device.code_expired": "Device code has expired",
    # Beta testing
    "beta.waiting_list": "Your account is on the beta testing waiting list. Please wait for admin approval.",
    "beta.rejected": "Your beta testing application has been rejected.",
    "beta.registered": "You have been added to the beta testing waiting list. We will notify you when your account is approved.",
    "beta.approved": "Beta testing application approved.",
    "beta.already_applied": "An account with this email already exists or has already applied for beta testing.",
    "beta.not_found": "Beta user not found.",
    "beta.not_beta_user": "This user is not a beta applicant.",
    "beta.mode_updated": "Beta mode setting updated.",
    # Plan limits
    "plan.project_limit": "Plan limit reached: your plan allows up to {limit} project(s). Please upgrade your plan.",
    "plan.report_per_project_limit": "Plan limit reached: your plan allows up to {limit} report(s) per project. Please upgrade your plan.",
    "plan.report_monthly_limit": "Plan limit reached: your plan allows up to {limit} report(s) per month. Please upgrade your plan.",
}
