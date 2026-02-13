"use client";

import { Loader2, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { isAxiosError } from "axios";
import { cn } from "@/lib/utils";
import { useAnalyzeReport } from "@/hooks/use-analysis";
import type { AnalysisResponse } from "@/types";

interface AiAnalysisPanelProps {
  reportId: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  bug: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  ui: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  performance: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
  crash: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  other: "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  high: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  medium: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
  low: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
};

function Badge({ label, value, styles }: {
  label: string;
  value: string;
  styles: Record<string, string>;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={cn(
          "inline-block px-2 py-0.5 rounded text-xs font-medium capitalize",
          styles[value] ?? "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
      {children}
    </h4>
  );
}

function AnalysisResult({ data }: { data: AnalysisResponse }) {
  const t = useTranslations("bugs");

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Summary */}
      <div>
        <SectionLabel>{t("aiSummary")}</SectionLabel>
        <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
          {data.summary}
        </p>
      </div>

      {/* Category & Severity */}
      <div className="flex flex-wrap gap-4">
        <Badge
          label={t("aiCategory")}
          value={data.suggestedCategory}
          styles={CATEGORY_STYLES}
        />
        <Badge
          label={t("severity")}
          value={data.suggestedSeverity}
          styles={SEVERITY_STYLES}
        />
      </div>

      {/* Reproduction Steps */}
      {data.reproductionSteps.length > 0 && (
        <div>
          <SectionLabel>{t("reproductionSteps")}</SectionLabel>
          <ol className="space-y-1.5 text-sm text-gray-900 dark:text-gray-100">
            {data.reproductionSteps.map((step, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-gray-400 dark:text-gray-500 font-mono text-xs mt-0.5 shrink-0">
                  {index + 1}.
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Root Cause */}
      {data.rootCause && (
        <div>
          <SectionLabel>{t("aiRootCause")}</SectionLabel>
          <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
            {data.rootCause}
          </p>
        </div>
      )}

      {/* Affected Area */}
      {data.affectedArea && (
        <div>
          <SectionLabel>{t("aiAffectedArea")}</SectionLabel>
          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {data.affectedArea}
          </span>
        </div>
      )}

      {/* Fix Suggestions */}
      {data.fixSuggestions?.length > 0 && (
        <div>
          <SectionLabel>{t("aiFixSuggestions")}</SectionLabel>
          <ol className="space-y-1.5 text-sm text-gray-900 dark:text-gray-100">
            {data.fixSuggestions.map((suggestion, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-gray-400 dark:text-gray-500 font-mono text-xs mt-0.5 shrink-0">
                  {index + 1}.
                </span>
                <span className="leading-relaxed">{suggestion}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export function AiAnalysisPanel({ reportId }: AiAnalysisPanelProps) {
  const t = useTranslations("bugs");
  const { mutate, data, isPending, isError, error } =
    useAnalyzeReport();

  function handleAnalyze() {
    mutate(reportId);
  }

  const isApiKeyError =
    isError &&
    ((error instanceof Error && error.message.includes("ANTHROPIC_API_KEY")) ||
      (isAxiosError<{ detail?: string }>(error) &&
        error.response?.data?.detail?.includes("ANTHROPIC_API_KEY")));

  return (
    <div>
      {!data && !isPending && (
        <div className="text-center py-4">
          <button
            onClick={handleAnalyze}
            disabled={isPending}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium",
              "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900",
              "hover:bg-gray-800 dark:hover:bg-gray-200",
              "transition-colors duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {t("analyzeWithAi")}
          </button>
          {isApiKeyError && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-500">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t("aiKeyRequired")}</span>
            </div>
          )}
          {isError && !isApiKeyError && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-500">
              {t("analysisFailed")}
            </p>
          )}
        </div>
      )}

      {isPending && (
        <div className="flex items-center gap-2 py-4 justify-center">
          <Loader2 className="w-4 h-4 text-gray-500 dark:text-gray-400 animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("analyzingReport")}</p>
        </div>
      )}

      {data && <AnalysisResult data={data} />}
    </div>
  );
}
