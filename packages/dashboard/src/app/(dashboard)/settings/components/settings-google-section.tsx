"use client";

import { useState, useEffect } from "react";
import { Loader2, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { getGoogleAuthStatus, getGoogleLoginUrl, unlinkGoogleAccount } from "@/lib/auth";

export function SettingsGoogleSection() {
  const t = useTranslations("settings");
  const { user, refreshUser } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getGoogleAuthStatus().then((enabled) => {
      setIsEnabled(enabled);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !isEnabled) return null;

  async function handleUnlink() {
    setError("");
    setSuccess("");
    setIsUnlinking(true);
    try {
      await unlinkGoogleAccount();
      setSuccess(t("googleUnlinked"));
      refreshUser();
    } catch {
      setError(t("googleUnlinkFailed"));
    } finally {
      setIsUnlinking(false);
    }
  }

  function handleLink() {
    window.location.href = getGoogleLoginUrl("/settings", "link");
  }

  const isLinked = user?.hasGoogleLinked;
  const hasPassword = user?.hasPassword !== false;

  return (
    <section className="border-t border-gray-200 dark:border-navy-700 pt-8 mb-8">
      <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{t("googleAccount")}</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 text-sm">
          {success}
        </div>
      )}

      {isLinked ? (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t("googleLinked")}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("googleLinkedDesc")}</p>
          </div>
          <div className="relative group">
            <button
              onClick={handleUnlink}
              disabled={isUnlinking || !hasPassword}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUnlinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
              {t("googleUnlink")}
            </button>
            {!hasPassword && (
              <div className="absolute right-0 top-full mt-1 w-56 p-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {t("googleUnlinkNeedsPassword")}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t("googleLink")}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("googleLinkDesc")}</p>
          </div>
          <button
            onClick={handleLink}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-navy-700 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
          >
            {t("googleLink")}
          </button>
        </div>
      )}
    </section>
  );
}
