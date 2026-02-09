"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/providers/auth-provider";
import apiClient from "@/lib/api-client";
import { Github, ChevronRight } from "lucide-react";

type Theme = "light" | "dark" | "system";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("bugspark_theme") as Theme) ?? "system";
  });

  async function handleSaveName(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.patch("/auth/me", { name });
    } finally {
      setIsSaving(false);
    }
  }

  function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    localStorage.setItem("bugspark_theme", newTheme);
  }

  return (
    <div className="max-w-xl">
      <PageHeader title={t("title")} />

      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-900 mb-4">{t("profile")}</h2>
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("email")}
            </label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
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

      <section className="border-t border-gray-200 pt-8 mb-8">
        <h2 className="text-sm font-medium text-gray-900 mb-4">{t("integrations")}</h2>
        <Link
          href="/settings/integrations"
          className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Github className="w-5 h-5 text-gray-700" />
            <div>
              <p className="text-sm font-medium text-gray-900">{t("issueTrackers")}</p>
              <p className="text-xs text-gray-500">{t("issueTrackersDesc")}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
      </section>

      <section className="border-t border-gray-200 pt-8">
        <h2 className="text-sm font-medium text-gray-900 mb-4">{t("appearance")}</h2>
        <div className="flex gap-3">
          {(["light", "dark", "system"] as Theme[]).map((option) => {
            const themeKeyMap: Record<Theme, string> = {
              light: "light",
              dark: "dark",
              system: "system",
            };
            return (
              <button
                key={option}
                onClick={() => handleThemeChange(option)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  theme === option
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
              >
                {t(themeKeyMap[option])}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
