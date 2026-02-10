"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const { login } = useAuth();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-navy-800/60 dark:backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-lg dark:shadow-2xl dark:shadow-accent/5 border border-gray-200 dark:border-white/[0.08] p-6 sm:p-10 md:p-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
          {t("signIn")}
        </h2>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-accent hover:underline font-medium">
            {t("createOne")}
          </Link>
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
      </div>
    </div>
  );
}
