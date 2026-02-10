"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";
import { SeverityBadge } from "./severity-badge";
import { StatusBadge } from "./status-badge";
import { SkeletonTableRow } from "@/components/shared/skeleton-loader";
import { EmptyState } from "@/components/shared/empty-state";
import { Bug } from "lucide-react";
import type { BugReport } from "@/types";

interface BugTableProps {
  bugs: BugReport[] | undefined;
  isLoading: boolean;
}

export function BugTable({ bugs, isLoading }: BugTableProps) {
  const t = useTranslations("bugs");

  if (!isLoading && (!bugs || bugs.length === 0)) {
    return (
      <EmptyState
        title={t("noBugs")}
        description={t("noBugsTableDescription")}
        icon={<Bug />}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-navy-800/50 rounded-xl border border-gray-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/[0.04] bg-gray-50 dark:bg-white/[0.02]">
            <th className="px-4 py-3 font-medium">{t("trackingId")}</th>
            <th className="px-4 py-3 font-medium">{t("bugTitle")}</th>
            <th className="px-4 py-3 font-medium">{t("severity")}</th>
            <th className="px-4 py-3 font-medium">{t("status")}</th>
            <th className="px-4 py-3 font-medium">{t("assignee")}</th>
            <th className="px-4 py-3 font-medium">{t("created")}</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 10 }).map((_, index) => (
                <SkeletonTableRow key={index} />
              ))
            : bugs?.map((bug) => (
                <tr
                  key={bug.id}
                  className="border-b border-gray-50 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/bugs/${bug.id}`}
                      className="text-xs font-mono text-accent hover:underline"
                    >
                      {bug.trackingId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-[300px] truncate">
                    <Link href={`/bugs/${bug.id}`} className="hover:underline">
                      {bug.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={bug.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={bug.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {bug.assigneeId ? t("assigned") : t("unassigned")}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(bug.createdAt)}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
