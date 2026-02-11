"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/providers/auth-provider";
import { useTheme, type Theme } from "@/providers/theme-provider";
import { locales, LOCALE_COOKIE_NAME } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import apiClient from "@/lib/api-client";
import {
  Github,
  Key,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Download,
  Trash2,
  Loader2,
  Users,
} from "lucide-react";
import { PlanBadge } from "@/components/shared/plan-badge";
import { NotificationSettings } from "@/components/settings/notification-settings";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
};

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; key: string }[] = [
  { value: "light", icon: Sun, key: "light" },
  { value: "dark", icon: Moon, key: "dark" },
];

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Data export / account deletion state
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (user?.name !== undefined) setName(user.name);
  }, [user?.name]);

  async function handleSaveName(event: FormEvent) {
    event.preventDefault();
    setSaveError("");
    setIsSaving(true);
    try {
      await apiClient.patch("/auth/me", { name });
    } catch {
      setSaveError(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwordMismatch"));
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.put("/auth/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess(t("passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError(t("passwordChangeFailed"));
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleExportData() {
    setIsExporting(true);
    try {
      const response = await apiClient.get("/auth/me/export");
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "bugspark-data-export.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Export failed silently
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      await apiClient.delete("/auth/me");
      await logout();
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  function handleLocaleChange(newLocale: Locale) {
    document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="max-w-xl">
      <PageHeader title={t("title")} />

      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">{t("profile")}</h2>
          {user && <PlanBadge plan={user.plan} role={user.role} />}
        </div>
        {saveError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm">
            {saveError}
          </div>
        )}
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label htmlFor="settings-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("name")}
            </label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("email")}
            </label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="w-full px-3 py-2 border border-gray-200 dark:border-navy-700 rounded-lg text-sm bg-gray-50 dark:bg-navy-800 text-gray-500 dark:text-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? t("saving") : t("save")}
          </button>
        </form>
      </section>

      <section className="border-t border-gray-200 dark:border-navy-700 pt-8 mb-8">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{t("password")}</h2>
        {passwordError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 text-sm">
            {passwordSuccess}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("currentPassword")}
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("newPassword")}
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("confirmPassword")}
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isChangingPassword ? t("updatingPassword") : t("updatePassword")}
          </button>
        </form>
      </section>

      <section className="border-t border-gray-200 dark:border-navy-700 pt-8 mb-8">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{t("integrations")}</h2>
        <div className="space-y-3">
          <Link
            href="/settings/integrations"
            className="flex items-center justify-between px-4 py-3 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg hover:border-gray-300 dark:hover:border-navy-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t("issueTrackers")}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("issueTrackersDesc")}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
          <Link
            href="/settings/tokens"
            className="flex items-center justify-between px-4 py-3 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg hover:border-gray-300 dark:hover:border-navy-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t("personalAccessTokens")}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("personalAccessTokensDesc")}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
          <Link
            href="/settings/team"
            className="flex items-center justify-between px-4 py-3 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg hover:border-gray-300 dark:hover:border-navy-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t("teamMembers")}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("teamMembersDesc")}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>
      </section>

      <section className="border-t border-gray-200 dark:border-navy-700 pt-8 mb-8">
        <NotificationSettings />
      </section>

      <section className="border-t border-gray-200 dark:border-navy-700 pt-8 mb-8">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{t("appearance")}</h2>
        <div className="flex gap-3">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  theme === option.value
                    ? "bg-accent text-white border-accent"
                    : "bg-white dark:bg-navy-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-navy-700 hover:border-gray-400 dark:hover:border-navy-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(option.key)}
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-t border-gray-200 dark:border-navy-700 pt-8 mb-8">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{t("language")}</h2>
        <div className="flex gap-3">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                loc === locale
                  ? "bg-accent text-white border-accent"
                  : "bg-white dark:bg-navy-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-navy-700 hover:border-gray-400 dark:hover:border-navy-700"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-200 dark:border-navy-700 pt-8">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{t("account")}</h2>
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? "Exporting..." : "Export Data"}
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t("logOut")}
          </button>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                Are you sure you want to delete your account? This action will deactivate your account and you will be logged out.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isDeleting ? "Deleting..." : "Yes, delete my account"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
