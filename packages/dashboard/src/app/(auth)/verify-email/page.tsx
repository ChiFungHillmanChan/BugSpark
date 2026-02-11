"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import apiClient from "@/lib/api-client";

type VerifyState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<VerifyState>("loading");

  const verifyToken = useCallback(async () => {
    if (!token) {
      setState("error");
      return;
    }

    try {
      await apiClient.post("/auth/verify-email", null, {
        params: { token },
      });
      setState("success");
    } catch {
      setState("error");
    }
  }, [token]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  if (state === "loading") {
    return (
      <div className="w-full">
        <div className="bg-white dark:bg-navy-800/60 dark:backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-lg dark:shadow-2xl dark:shadow-accent/5 border border-gray-200 dark:border-white/[0.08] p-6 sm:p-10 md:p-12 text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <Loader2 className="w-12 h-12 text-accent animate-spin" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
            Verifying your email...
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="w-full">
        <div className="bg-white dark:bg-navy-800/60 dark:backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-lg dark:shadow-2xl dark:shadow-accent/5 border border-gray-200 dark:border-white/[0.08] p-6 sm:p-10 md:p-12 text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
            Email verified
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-sm mx-auto">
            Your email has been verified successfully. You can now use all features of BugSpark.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 py-3 sm:py-3.5 px-8 bg-accent hover:bg-accent-hover dark:gradient-btn text-white rounded-xl text-sm sm:text-base font-semibold transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-navy-800/60 dark:backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-lg dark:shadow-2xl dark:shadow-accent/5 border border-gray-200 dark:border-white/[0.08] p-6 sm:p-10 md:p-12 text-center">
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
          Verification failed
        </h2>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-sm mx-auto">
          The verification link is invalid or has expired. Please request a new verification email from your account settings.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 py-3 sm:py-3.5 px-8 bg-accent hover:bg-accent-hover dark:gradient-btn text-white rounded-xl text-sm sm:text-base font-semibold transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}
