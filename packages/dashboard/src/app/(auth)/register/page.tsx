"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";

export default function RegisterPage() {
  const { register } = useAuth();
  const t = useTranslations("auth");
  const [name, setName] = useState("");
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
      await register(name, email, password);
    } catch {
      setError(t("registrationFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm border border-gray-200 dark:border-navy-700 p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {t("createAccount")}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("name")}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
              placeholder={t("namePlaceholder")}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
              placeholder={t("emailPlaceholder")}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("password")}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                placeholder={t("passwordHint")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? t("creatingAccount") : t("createAccount")}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-accent hover:underline font-medium">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
