"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import apiClient from "@/lib/api-client";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    if (!token) {
      setError(t("missingResetToken"));
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      setIsSuccess(true);
    } catch {
      setError(t("resetPasswordFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full">
        <div className="bg-white dark:bg-navy-800/60 dark:backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-lg dark:shadow-2xl dark:shadow-accent/5 border border-gray-200 dark:border-white/[0.08] p-6 sm:p-10 md:p-12 text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
            {t("passwordResetSuccess")}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-sm mx-auto">
            {t("passwordResetSuccessDesc")}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 py-3 sm:py-3.5 px-8 bg-accent hover:bg-accent-hover dark:gradient-btn text-white rounded-xl text-sm sm:text-base font-semibold transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
          >
            {t("goToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-navy-800/60 dark:backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-lg dark:shadow-2xl dark:shadow-accent/5 border border-gray-200 dark:border-white/[0.08] p-6 sm:p-10 md:p-12">
        <div className="flex items-center gap-3 mb-1 sm:mb-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent/10 dark:bg-accent/20 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t("resetPassword")}
          </h2>
        </div>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8">
          {t("resetPasswordDesc")}
        </p>

        {error && (
          <div className="mb-5 sm:mb-6 p-3 sm:p-4 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm sm:text-base border-l-4 border-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="new-password" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              {t("newPassword")}
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 pr-11 sm:pr-12 border border-gray-300 dark:border-white/[0.1] rounded-xl text-sm sm:text-base bg-white dark:bg-navy-900/60 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent dark:focus:border-accent/50 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-shadow"
                placeholder={t("newPasswordPlaceholder")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              {t("confirmPassword")}
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border border-gray-300 dark:border-white/[0.1] rounded-xl text-sm sm:text-base bg-white dark:bg-navy-900/60 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent dark:focus:border-accent/50 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-shadow"
              placeholder={t("confirmPasswordPlaceholder")}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newPassword || !confirmPassword}
            className="w-full py-3 sm:py-3.5 px-6 bg-accent hover:bg-accent-hover dark:gradient-btn text-white rounded-xl text-sm sm:text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-2.5 transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />}
            {isSubmitting ? t("resettingPassword") : t("resetPassword")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm sm:text-base text-gray-500 dark:text-gray-400">
          {t("rememberPassword")}{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
