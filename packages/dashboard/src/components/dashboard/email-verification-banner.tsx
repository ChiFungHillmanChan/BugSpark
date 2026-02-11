"use client";

import { useState } from "react";
import { Mail, Loader2, X } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import apiClient from "@/lib/api-client";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasSent, setHasSent] = useState(false);

  if (!user || user.isEmailVerified || isDismissed) {
    return null;
  }

  async function handleResend() {
    setIsSending(true);
    try {
      await apiClient.post("/auth/resend-verification");
      setHasSent(true);
    } catch {
      // Silently fail — user can retry
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50 px-4 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200 truncate">
            {hasSent
              ? "Verification email sent! Check your inbox."
              : "Please verify your email address to access all features."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!hasSent && (
            <button
              onClick={handleResend}
              disabled={isSending}
              className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSending && <Loader2 className="w-3 h-3 animate-spin" />}
              Resend email
            </button>
          )}
          <button
            onClick={() => setIsDismissed(true)}
            className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
