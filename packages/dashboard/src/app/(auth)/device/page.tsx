"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Terminal, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import apiClient from "@/lib/api-client";

type DeviceStatus = "loading" | "login_required" | "confirm" | "approving" | "approved" | "error";

export default function DeviceApprovePage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const { user } = useAuth();
  const t = useTranslations("device");

  const [status, setStatus] = useState<DeviceStatus>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!code) {
      setStatus("error");
      setErrorMsg(t("noCode"));
      return;
    }

    if (!user) {
      setStatus("login_required");
      return;
    }

    setStatus("confirm");
  }, [code, user, t]);

  async function handleApprove() {
    setStatus("approving");
    try {
      await apiClient.post("/auth/device/approve", { user_code: code });
      setStatus("approved");
    } catch (err: unknown) {
      setStatus("error");
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      setErrorMsg(msg ?? t("approvalFailed"));
    }
  }

  function handleLogin() {
    // Redirect to login, then come back here
    const returnUrl = `/device?code=${code}`;
    window.location.href = `/login?redirect=${encodeURIComponent(returnUrl)}`;
  }

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-navy-800/60 dark:backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-lg dark:shadow-2xl dark:shadow-accent/5 border border-gray-200 dark:border-white/[0.08] p-6 sm:p-10 md:p-12 text-center">
        <Terminal className="w-10 h-10 sm:w-12 sm:h-12 text-accent mx-auto mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t("title")}
        </h2>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6">
          {t("subtitle")}
        </p>

        {/* Device code display */}
        {code && status !== "error" && (
          <div className="mb-6 inline-flex items-center gap-2 bg-gray-100 dark:bg-navy-900/60 border border-gray-200 dark:border-white/[0.08] rounded-xl px-5 py-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              {t("codeLabel")}
            </span>
            <span className="text-lg sm:text-xl font-mono font-bold text-gray-900 dark:text-white tracking-widest">
              {code}
            </span>
          </div>
        )}

        {/* Loading state */}
        {status === "loading" && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        )}

        {/* Login required */}
        {status === "login_required" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("loginRequired")}
            </p>
            <button
              onClick={handleLogin}
              className="w-full py-3 sm:py-3.5 px-6 bg-accent hover:bg-accent-hover dark:gradient-btn text-white rounded-xl text-sm sm:text-base font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
            >
              {t("signInToApprove")}
            </button>
          </div>
        )}

        {/* Confirmation state */}
        {status === "confirm" && user && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("confirmMessage", { name: user.name, email: user.email })}
            </p>
            <button
              onClick={handleApprove}
              className="w-full py-3 sm:py-3.5 px-6 bg-accent hover:bg-accent-hover dark:gradient-btn text-white rounded-xl text-sm sm:text-base font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
            >
              {t("approveButton")}
            </button>
          </div>
        )}

        {/* Approving state */}
        {status === "approving" && (
          <div className="flex items-center justify-center gap-2 py-4 text-accent">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">{t("approving")}</span>
          </div>
        )}

        {/* Approved state */}
        {status === "approved" && (
          <div className="space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {t("approved")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("approvedHint")}
            </p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="space-y-3">
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {errorMsg || t("genericError")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
