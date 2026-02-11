"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import apiClient from "@/lib/api-client";

export function SettingsPasswordForm() {
  const t = useTranslations("settings");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

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

  return (
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
  );
}
