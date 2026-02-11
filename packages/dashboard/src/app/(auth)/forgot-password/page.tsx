"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import apiClient from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setIsSuccess(true);
    } catch {
      setError(t("forgotPasswordError"));
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
            {t("checkYourEmail")}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-sm mx-auto">
            {t("checkYourEmailDesc")}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 py-3 sm:py-3.5 px-8 bg-accent hover:bg-accent-hover dark:gradient-btn text-white rounded-xl text-sm sm:text-base font-semibold transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
          >
            {t("backToLogin")}
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
            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t("forgotPassword")}
          </h2>
        </div>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8">
          {t("forgotPasswordDesc")}
        </p>

        {error && (
          <div className="mb-5 sm:mb-6 p-3 sm:p-4 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm sm:text-base border-l-4 border-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 border border-gray-300 dark:border-white/[0.1] rounded-xl text-sm sm:text-base bg-white dark:bg-navy-900/60 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent dark:focus:border-accent/50 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-shadow"
              placeholder={t("emailPlaceholder")}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 sm:py-3.5 px-6 bg-accent hover:bg-accent-hover dark:gradient-btn text-white rounded-xl text-sm sm:text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-2.5 transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />}
            {isSubmitting ? t("sendingResetLink") : t("sendResetLink")}
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
