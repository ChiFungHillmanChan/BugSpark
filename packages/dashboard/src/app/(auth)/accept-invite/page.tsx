"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { useAcceptInvite } from "@/hooks/use-team";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AcceptInvitePage() {
  const t = useTranslations("acceptInvite");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const acceptInviteMutation = useAcceptInvite();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "login-required">("loading");
  const hasAttempted = useRef(false);

  const token = searchParams.get("token");

  const handleAccept = useCallback(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    if (!user) {
      setStatus("login-required");
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    acceptInviteMutation.mutate(token, {
      onSuccess: (member) => {
        setStatus("success");
        setTimeout(() => {
          router.push(`/projects/${member.projectId}`);
        }, 2000);
      },
      onError: () => {
        setStatus("error");
      },
    });
  }, [token, user, acceptInviteMutation, router]);

  useEffect(() => {
    handleAccept();
  }, [handleAccept]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-navy-950 px-4">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t("title")}
        </h1>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("accepting")}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <p className="text-sm text-green-600 dark:text-green-400">
              {t("accepted")}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("failed")}
            </p>
          </div>
        )}

        {status === "login-required" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("loginRequired")}
            </p>
            <a
              href={`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              Log in
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
