"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorPageProps) {
  const t = useTranslations("common");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <AlertTriangle className="w-12 h-12 text-accent" />
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {t("error")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          {t("errorDescription")}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors"
      >
        {t("retry")}
      </button>
    </div>
  );
}
