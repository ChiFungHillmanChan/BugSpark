"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { locales, LOCALE_COOKIE_NAME } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-HK": "廣東話",
};

interface LocaleSwitcherProps {
  dropdownDirection?: "up" | "down";
}

export function LocaleSwitcher({ dropdownDirection = "down" }: LocaleSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("settings");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLocaleChange(newLocale: Locale) {
    document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    setIsOpen(false);
    router.refresh();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
        aria-label={t("switchLanguage")}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">
          {LOCALE_LABELS[locale as Locale] ?? locale}
        </span>
      </button>

      {isOpen && (
        <div className={`absolute right-0 w-40 rounded-lg bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 shadow-lg py-1 z-50 ${dropdownDirection === "up" ? "bottom-full mb-1" : "mt-1"}`}>
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                loc === locale
                  ? "bg-gray-50 dark:bg-navy-700 text-accent font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
