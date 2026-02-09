"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSimilarBugs } from "@/hooks/use-similar-bugs";
import type { SimilarBug } from "@/types";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  triaging: "bg-purple-100 text-purple-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function SimilarBugRow({ bug }: { bug: SimilarBug }) {
  const t = useTranslations("bugs");
  const matchPercent = Math.round(bug.similarityScore * 100);

  return (
    <Link
      href={`/bugs/${bug.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">
            {bug.trackingId}
          </span>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_COLORS[bug.severity] ?? "bg-gray-100 text-gray-800"}`}
          >
            {bug.severity}
          </span>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[bug.status] ?? "bg-gray-100 text-gray-800"}`}
          >
            {formatStatus(bug.status)}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-medium text-gray-900">
          {bug.title}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-lg font-semibold text-indigo-600">
          {matchPercent}%
        </span>
        <p className="text-xs text-gray-400">{t("match")}</p>
      </div>
    </Link>
  );
}

interface SimilarBugsPanelProps {
  reportId: string;
}

export function SimilarBugsPanel({ reportId }: SimilarBugsPanelProps) {
  const t = useTranslations("bugs");
  const { data, isLoading, isError } = useSimilarBugs(reportId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">
        {t("failedLoadSimilar")}
      </p>
    );
  }

  if (!data?.items.length) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">
        {t("noSimilarBugs")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {data.items.map((bug) => (
        <SimilarBugRow key={bug.id} bug={bug} />
      ))}
    </div>
  );
}
