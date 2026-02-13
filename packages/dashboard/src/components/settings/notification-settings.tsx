"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Bell, Loader2 } from "lucide-react";
import apiClient from "@/lib/api-client";

interface NotificationPreferences {
  email_on_critical: boolean;
  email_on_high: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_on_critical: true,
  email_on_high: true,
};

export function NotificationSettings() {
  const t = useTranslations("notifications");
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await apiClient.get("/auth/me");
        const prefs = response.data.notificationPreferences;
        if (prefs) {
          setPreferences({
            email_on_critical: prefs.email_on_critical ?? true,
            email_on_high: prefs.email_on_high ?? true,
          });
        }
      } catch {
        // Use defaults on failure
      } finally {
        setIsLoading(false);
      }
    }
    loadPreferences();
  }, []);

  async function handleToggle(key: keyof NotificationPreferences) {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    setIsSaving(true);
    try {
      await apiClient.patch("/auth/me", {
        notification_preferences: updated,
      });
    } catch {
      // Revert on failure
      setPreferences(preferences);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500 dark:text-gray-400">{t("loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t("title")}</h3>
        {isSaving && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
      </div>

      <div className="space-y-3">
        <label className="flex items-center justify-between px-4 py-3 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t("criticalSeverity")}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("criticalSeverityDesc")}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.email_on_critical}
            onClick={() => handleToggle("email_on_critical")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.email_on_critical ? "bg-accent" : "bg-gray-300 dark:bg-navy-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                preferences.email_on_critical ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between px-4 py-3 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t("highSeverity")}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("highSeverityDesc")}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.email_on_high}
            onClick={() => handleToggle("email_on_high")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.email_on_high ? "bg-accent" : "bg-gray-300 dark:bg-navy-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                preferences.email_on_high ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
