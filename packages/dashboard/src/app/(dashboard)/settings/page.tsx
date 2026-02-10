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
  Monitor,
  LogOut,
} from "lucide-react";
import { PlanBadge } from "@/components/shared/plan-badge";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
};

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; key: string }[] = [
  { value: "light", icon: Sun, key: "light" },
  { value: "dark", icon: Moon, key: "dark" },
  { value: "system", icon: Monitor, key: "system" },
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
        </div>
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
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t("logOut")}
        </button>
      </section>
    </div>
  );
}
