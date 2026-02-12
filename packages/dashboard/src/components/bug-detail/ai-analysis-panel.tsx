"use client";

import { Loader2, Sparkles, AlertTriangle, Target, MapPin, Lightbulb, ListOrdered } from "lucide-react";
import { useTranslations } from "next-intl";
import { isAxiosError } from "axios";
import { cn } from "@/lib/utils";
import { useAnalyzeReport } from "@/hooks/use-analysis";
import type { AnalysisResponse } from "@/types";

interface AiAnalysisPanelProps {
  reportId: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  bug: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  ui: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  performance: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
  crash: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
};

function Badge({ label, value, styles }: {
  label: string;
  value: string;
  styles: Record<string, string>;
}) {
  return (
    <div>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">{label}</span>
      <span
        className={cn(
          "ml-2 inline-block px-3 py-1.5 rounded-md text-xs font-semibold capitalize shadow-sm",
          styles[value] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-lg p-4">
        <div className="flex items-start gap-3 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
          <h4 className="text-xs text-indigo-900 dark:text-indigo-200 font-semibold uppercase tracking-wide">{t("aiSummary")}</h4>
        </div>
        <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{data.summary}</p>
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
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <ListOrdered className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <h4 className="text-xs text-indigo-900 dark:text-indigo-200 font-semibold uppercase tracking-wide">
              {t("reproductionSteps")}
            </h4>
          </div>
          <ol className="space-y-2 ml-7">
            {data.reproductionSteps.map((step, index) => (
              <li key={index} className="relative">
                <div className="absolute -left-7 top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {data.rootCause && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-2">
            <Target className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <h4 className="text-xs text-amber-900 dark:text-amber-200 font-semibold uppercase tracking-wide">
              {t("aiRootCause")}
            </h4>
          </div>
          <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{data.rootCause}</p>
        </div>
      )}

      {data.affectedArea && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <h4 className="text-xs text-blue-900 dark:text-blue-200 font-semibold uppercase tracking-wide">
              {t("aiAffectedArea")}
            </h4>
          </div>
          <span className="inline-block px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 shadow-sm">
            {data.affectedArea}
          </span>
        </div>
      )}

      {data.fixSuggestions?.length > 0 && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Lightbulb className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <h4 className="text-xs text-green-900 dark:text-green-200 font-semibold uppercase tracking-wide">
              {t("aiFixSuggestions")}
            </h4>
          </div>
          <ol className="space-y-2 ml-7">
            {data.fixSuggestions.map((suggestion, index) => (
              <li key={index} className="relative">
                <div className="absolute -left-7 top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 pt-0.5">{suggestion}</p>
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
        <div className="text-center py-6">
          <button
            onClick={handleAnalyze}
            disabled={isPending}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold",
              "bg-gradient-to-r from-indigo-600 to-purple-600 text-white",
              "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30",
              "transition-all duration-200 ease-out",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
            )}
          >
            <Sparkles className="w-4 h-4" />
            {t("analyzeWithAi")}
          </button>
          {isApiKeyError && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-500">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{t("aiKeyRequired")}</span>
            </div>
          )}
          {isError && !isApiKeyError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-500">
              {t("analysisFailed")}
            </p>
          )}
        </div>
      )}

      {isPending && (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <div className="relative">
            <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <Sparkles className="absolute inset-0 w-6 h-6 text-indigo-400 dark:text-indigo-300 opacity-50 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("analyzingReport")}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This may take 10-15 seconds</p>
          </div>
        </div>
      )}

      {data && <AnalysisResult data={data} />}
    </div>
  );
}
