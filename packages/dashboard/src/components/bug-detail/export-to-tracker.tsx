"use client";

import { useState } from "react";
import { Github, ExternalLink, Check, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useExportToTracker } from "@/hooks/use-integrations";

interface ExportToTrackerProps {
  reportId: string;
  projectId: string;
}

export function ExportToTracker({ reportId }: ExportToTrackerProps) {
  const t = useTranslations("bugs");
  const tCommon = useTranslations("common");
  const exportMutation = useExportToTracker();
  const [issueUrl, setIssueUrl] = useState<string | null>(null);

  function handleExport() {
    exportMutation.mutate(
      { reportId, provider: "github" },
      {
        onSuccess: (data) => {
          setIssueUrl(data.issueUrl);
        },
      },
    );
  }

  if (issueUrl) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Check className="w-4 h-4 text-green-500" />
        <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline flex items-center gap-1"
        >
          {t("viewOnGithub")}
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
        <button
          onClick={handleExport}
          className="text-xs text-accent hover:underline"
        >
          {tCommon("retry")}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={exportMutation.isPending}
      className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
    >
      <Github className="w-4 h-4" />
      {exportMutation.isPending ? t("exporting") : t("exportToGithub")}
    </button>
  );
}
