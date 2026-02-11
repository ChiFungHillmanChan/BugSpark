"use client";

import { useTranslations } from "next-intl";
import type { PerformanceMetrics } from "../../types";

type Rating = "good" | "needs-improvement" | "poor";

interface MetricConfig {
  key: keyof PerformanceMetrics;
  label: string;
  unit: string;
  goodThreshold: number;
  needsImprovementThreshold: number;
}

const METRIC_CONFIGS: MetricConfig[] = [
  { key: "lcp", label: "LCP", unit: "ms", goodThreshold: 2500, needsImprovementThreshold: 4000 },
  { key: "fid", label: "FID", unit: "ms", goodThreshold: 100, needsImprovementThreshold: 300 },
  { key: "cls", label: "CLS", unit: "", goodThreshold: 0.1, needsImprovementThreshold: 0.25 },
  { key: "ttfb", label: "TTFB", unit: "ms", goodThreshold: 800, needsImprovementThreshold: 1800 },
  { key: "inp", label: "INP", unit: "ms", goodThreshold: 200, needsImprovementThreshold: 500 },
];

const RATING_COLORS: Record<Rating, { bg: string; text: string; dot: string }> = {
  "good": { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  "needs-improvement": { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  "poor": { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
};

const RATING_LABEL_KEYS: Record<Rating, string> = {
  "good": "ratingGood",
  "needs-improvement": "ratingNeedsImprovement",
  "poor": "ratingPoor",
};

function getRating(value: number, config: MetricConfig): Rating {
  if (value <= config.goodThreshold) return "good";
  if (value <= config.needsImprovementThreshold) return "needs-improvement";
  return "poor";
}

function formatValue(value: number, unit: string): string {
  if (unit === "ms") {
    return value >= 1000
      ? `${(value / 1000).toFixed(2)}s`
      : `${Math.round(value)}ms`;
  }
  return value.toFixed(3);
}

interface PerformanceMetricsPanelProps {
  performance: PerformanceMetrics | undefined;
}

export function PerformanceMetricsPanel({ performance }: PerformanceMetricsPanelProps) {
  const t = useTranslations("bugs");

  if (!performance) {
    return (
      <p className="text-gray-400 text-sm py-4 text-center">
        {t("noPerformanceData")}
      </p>
    );
  }

  const availableMetrics = METRIC_CONFIGS.filter(
    (config) => performance[config.key] !== undefined,
  );

  if (availableMetrics.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-4 text-center">
        {t("noPerformanceData")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {availableMetrics.map((config) => {
        const value = performance[config.key]!;
        const rating = getRating(value, config);
        const colors = RATING_COLORS[rating];

        return (
          <div
            key={config.key}
            className={`flex items-center justify-between px-3 py-2 rounded-lg ${colors.bg}`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${colors.text}`}>
                {formatValue(value, config.unit)}
              </span>
              <span className={`text-xs ${colors.text}`}>
                {t(RATING_LABEL_KEYS[rating])}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
