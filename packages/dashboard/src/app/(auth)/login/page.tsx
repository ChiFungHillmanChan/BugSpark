"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Clock, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { isAxiosError } from "axios";
import { useAuth } from "@/providers/auth-provider";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

type BetaState = "none" | "waiting_list" | "rejected";

export default function LoginPage() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tBeta = useTranslations("beta");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [betaState, setBetaState] = useState<BetaState>("none");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "google_denied") {
      setError(t("googleDenied"));
    } else if (errorParam === "google_failed") {
      setError(t("googleFailed"));
    } else if (errorParam === "account_deactivated") {
      setError(t("accountDeactivated"));
    } else if (errorParam === "beta.waiting_list") {
      setBetaState("waiting_list");
    } else if (errorParam === "beta.rejected") {
      setBetaState("rejected");
    }
  }, [searchParams, t]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBetaState("none");
    setIsSubmitting(true);

    try {
      const redirectTo = searchParams.get("redirect") ?? undefined;
      await login(email, password, redirectTo);
    } catch (err: unknown) {
      if (isAxiosError<{ code?: string }>(err)) {
        const code = err.response?.data?.code;

        if (err.response?.status === 403 && code === "beta.waiting_list") {
          setBetaState("waiting_list");
        } else if (err.response?.status === 403 && code === "beta.rejected") {
          setBetaState("rejected");
        } else {
          setError(t("invalidCredentials"));
        }
      } else {
        setError(t("invalidCredentials"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Waiting list UI
  if (betaState === "waiting_list") {
    return (
      <div className="w-full">
        <div className="bg-white dark:bg-navy-800/60 dark:backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-lg dark:shadow-2xl dark:shadow-accent/5 border border-gray-200 dark:border-white/[0.08] p-6 sm:p-10 md:p-12 text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
            {tBeta("waitingListTitle")}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-sm mx-auto">
            {tBeta("waitingListMessage")}
          </p>
          <button
            onClick={() => setBetaState("none")}
            className="inline-flex items-center gap-2 py-3 sm:py-3.5 px-8 bg-accent hover:bg-accent-hover dark:gradient-btn text-white rounded-xl text-sm sm:text-base font-semibold transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
          >
            {tBeta("backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  // Rejected UI
  if (betaState === "rejected") {
    return (
      <div className="w-full">
        <div className="bg-white dark:bg-navy-800/60 dark:backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-lg dark:shadow-2xl dark:shadow-accent/5 border border-gray-200 dark:border-white/[0.08] p-6 sm:p-10 md:p-12 text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
            {tBeta("rejectedTitle")}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-sm mx-auto">
            {tBeta("rejectedMessage")}
          </p>
          <button
            onClick={() => setBetaState("none")}
            className="inline-flex items-center gap-2 py-3 sm:py-3.5 px-8 bg-accent hover:bg-accent-hover dark:gradient-btn text-white rounded-xl text-sm sm:text-base font-semibold transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
          >
            {tBeta("backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-navy-800/60 dark:backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-lg dark:shadow-2xl dark:shadow-accent/5 border border-gray-200 dark:border-white/[0.08] p-6 sm:p-10 md:p-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
          {t("signIn")}
        </h2>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8">
          {t("noAccount")}{" "}
          <Link
            href="/register/beta"
            className="text-accent hover:underline font-medium"
          >
            {t("createOne")}
          </Link>
        </p>

        <GoogleSignInButton redirect={searchParams.get("redirect") ?? undefined} />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-white/[0.08]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-navy-800/60 px-4 text-gray-500 dark:text-gray-400">
              {t("orContinueWith")}
            </span>
          </div>
        </div>

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

          <div>
            <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              {t("password")}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 pr-11 sm:pr-12 border border-gray-300 dark:border-white/[0.1] rounded-xl text-sm sm:text-base bg-white dark:bg-navy-900/60 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent dark:focus:border-accent/50 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-shadow"
                placeholder={t("passwordPlaceholder")}
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
            <div className="mt-1.5 text-right">
              <Link href="/forgot-password" className="text-sm text-accent hover:underline font-medium">
                {t("forgotPasswordLink")}
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 sm:py-3.5 px-6 bg-accent hover:bg-accent-hover dark:gradient-btn text-white rounded-xl text-sm sm:text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-2.5 transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />}
            {isSubmitting ? t("signingIn") : t("signIn")}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/[0.08] text-center">
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            {t("orJoinBeta")}{" "}
            <Link href="/register/beta" className="text-accent hover:underline font-medium">
              {t("joinBeta")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
