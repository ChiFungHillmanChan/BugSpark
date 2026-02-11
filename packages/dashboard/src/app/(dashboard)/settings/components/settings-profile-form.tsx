"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { PlanBadge } from "@/components/shared/plan-badge";
import apiClient from "@/lib/api-client";

export function SettingsProfileForm() {
  const t = useTranslations("settings");
  const { user } = useAuth();
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

  return (
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
  );
}
