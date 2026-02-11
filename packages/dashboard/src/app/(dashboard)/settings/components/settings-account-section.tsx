"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import apiClient from "@/lib/api-client";
import { Download, LogOut, Trash2, Loader2 } from "lucide-react";

export function SettingsAccountSection() {
  const t = useTranslations("settings");
  const { logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleExportData() {
    setIsExporting(true);
    setExportError("");
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
      setExportError(t("exportFailed"));
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setDeleteError("");
    try {
      await apiClient.delete("/auth/me");
      await logout();
    } catch {
      setDeleteError(t("deleteAccountFailed"));
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <section className="border-t border-gray-200 dark:border-navy-700 pt-8">
      <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{t("account")}</h2>
      {exportError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm">
          {exportError}
        </div>
      )}
      {deleteError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm">
          {deleteError}
        </div>
      )}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleExportData}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isExporting ? t("exporting") : t("exportData")}
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
            {t("deleteAccount")}
          </button>
        ) : (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              {t("deleteAccountWarning")}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isDeleting ? t("deleting") : t("deleteAccountConfirm")}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-800"
              >
                {t("deleteCancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
