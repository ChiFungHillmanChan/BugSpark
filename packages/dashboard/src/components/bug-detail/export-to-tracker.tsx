"use client";

import { useState } from "react";
import { Github, ExternalLink, Check, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useExportToTracker } from "@/hooks/use-integrations";
import { LinearIcon } from "@/components/shared/linear-icon";

interface ExportToTrackerProps {
  reportId: string;
}

type ExportState = {
  provider: "github" | "linear";
  issueUrl: string;
  issueIdentifier: string | null;
};

export function ExportToTracker({ reportId }: ExportToTrackerProps) {
  const t = useTranslations("bugs");
  const tCommon = useTranslations("common");
  const exportMutation = useExportToTracker();
  const [exportResult, setExportResult] = useState<ExportState | null>(null);
  const [activeProvider, setActiveProvider] = useState<"github" | "linear" | null>(null);

  function handleExport(provider: "github" | "linear") {
    setActiveProvider(provider);
    exportMutation.mutate(
      { reportId, provider },
      {
        onSuccess: (data) => {
          setExportResult({
            provider,
            issueUrl: data.issueUrl,
            issueIdentifier: data.issueIdentifier,
          });
          setActiveProvider(null);
        },
        onError: () => {
          setActiveProvider(null);
        },
      },
    );
  }

  if (exportResult) {
    const isLinear = exportResult.provider === "linear";
    const linkLabel = isLinear ? t("viewOnLinear") : t("viewOnGithub");
    const displayText = isLinear && exportResult.issueIdentifier
      ? `${exportResult.issueIdentifier} — ${linkLabel}`
      : linkLabel;

    return (
      <div className="flex items-center gap-2 text-sm">
        <Check className="w-4 h-4 text-green-500" />
        <a
          href={exportResult.issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline flex items-center gap-1"
        >
          {displayText}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  if (exportMutation.isError) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{t("exportFailed")}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("github")}
            className="text-xs text-accent hover:underline"
          >
            {tCommon("retry")} (GitHub)
          </button>
          <button
            onClick={() => handleExport("linear")}
            className="text-xs text-accent hover:underline"
          >
            {tCommon("retry")} (Linear)
          </button>
        </div>
      </div>
    );
  }

  const isPending = exportMutation.isPending;

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport("github")}
        disabled={isPending}
        className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
      >
        <Github className="w-4 h-4" />
        {isPending && activeProvider === "github"
          ? t("exporting")
          : t("exportToGithub")}
      </button>
      <button
        onClick={() => handleExport("linear")}
        disabled={isPending}
        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
      >
        <LinearIcon className="w-4 h-4" />
        {isPending && activeProvider === "linear"
          ? t("exporting")
          : t("exportToLinear")}
      </button>
    </div>
  );
}
