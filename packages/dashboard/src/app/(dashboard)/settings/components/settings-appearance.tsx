"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { useTheme, type Theme } from "@/providers/theme-provider";
import { locales, LOCALE_COOKIE_NAME } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
};

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; key: string }[] = [
  { value: "light", icon: Sun, key: "light" },
  { value: "dark", icon: Moon, key: "dark" },
];

export function SettingsAppearance() {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();

  function handleLocaleChange(newLocale: Locale) {
    document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  }

  return (
    <>
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
    </>
  );
}
