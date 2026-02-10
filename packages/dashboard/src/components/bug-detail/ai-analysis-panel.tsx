"use client";

import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAnalyzeReport } from "@/hooks/use-analysis";
import type { AnalysisResponse } from "@/types";

interface AiAnalysisPanelProps {
  reportId: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  bug: "bg-red-100 text-red-700",
  ui: "bg-blue-100 text-blue-700",
  performance: "bg-yellow-100 text-yellow-700",
  crash: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-700",
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

function Badge({ label, value, styles }: {
  label: string;
  value: string;
  styles: Record<string, string>;
}) {
  return (
    <div>
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span
        className={cn(
          "ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium capitalize",
          styles[value] ?? "bg-gray-100 text-gray-700",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function AnalysisResult({ data }: { data: AnalysisResponse }) {
  const t = useTranslations("bugs");

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs text-gray-400 font-medium mb-1">{t("aiSummary")}</h4>
        <p className="text-sm text-gray-900">{data.summary}</p>
      </div>

      <div className="flex gap-4">
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

      {data.reproductionSteps.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-400 font-medium mb-1">
            {t("reproductionSteps")}
          </h4>
          <ol className="list-decimal list-inside space-y-1">
            {data.reproductionSteps.map((step, index) => (
              <li key={index} className="text-sm text-gray-900">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {data.rootCause && (
        <div>
          <h4 className="text-xs text-gray-400 font-medium mb-1">
            {t("aiRootCause")}
          </h4>
          <p className="text-sm text-gray-900">{data.rootCause}</p>
        </div>
      )}

      {data.affectedArea && (
        <div>
          <h4 className="text-xs text-gray-400 font-medium mb-1">
            {t("aiAffectedArea")}
          </h4>
          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
            {data.affectedArea}
          </span>
        </div>
      )}

      {data.fixSuggestions?.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-400 font-medium mb-1">
            {t("aiFixSuggestions")}
          </h4>
          <ol className="list-decimal list-inside space-y-1">
            {data.fixSuggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-gray-900">
                {suggestion}
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
    error instanceof Error &&
    (error.message.includes("ANTHROPIC_API_KEY") ||
      (error as { response?: { data?: { detail?: string } } }).response?.data
        ?.detail?.includes("ANTHROPIC_API_KEY"));

  return (
    <div>
      {!data && !isPending && (
        <div className="text-center py-4">
          <button
            onClick={handleAnalyze}
            disabled={isPending}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
              "bg-indigo-600 text-white hover:bg-indigo-700 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <Sparkles className="w-4 h-4" />
            {t("analyzeWithAi")}
          </button>
          {isApiKeyError && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              {t("aiKeyRequired")}
            </div>
          )}
          {isError && !isApiKeyError && (
            <p className="mt-3 text-sm text-red-600">
              {t("analysisFailed")}
            </p>
          )}
        </div>
      )}

      {isPending && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("analyzingReport")}
        </div>
      )}

      {data && <AnalysisResult data={data} />}
    </div>
  );
}
