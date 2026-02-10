"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";
import { SeverityBadge } from "@/components/bugs/severity-badge";
import { StatusBadge } from "@/components/bugs/status-badge";
import { SkeletonTableRow } from "@/components/shared/skeleton-loader";
import type { BugReport } from "@/types";

interface RecentBugsProps {
  bugs: BugReport[] | undefined;
  isLoading: boolean;
}

export function RecentBugs({ bugs, isLoading }: RecentBugsProps) {
  const t = useTranslations("dashboard");
  const tBugs = useTranslations("bugs");

  return (
    <div className="bg-white dark:bg-navy-800/50 rounded-xl border border-gray-200 dark:border-white/[0.06] shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/[0.04]">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t("recentBugs")}</h3>
        <Link
          href="/bugs"
          className="text-xs text-accent hover:underline font-medium"
        >
          {t("viewAll")}
        </Link>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/[0.04]">
            <th className="px-4 py-3 font-medium">{tBugs("id")}</th>
            <th className="px-4 py-3 font-medium">{tBugs("bugTitle")}</th>
            <th className="px-4 py-3 font-medium">{tBugs("severity")}</th>
            <th className="px-4 py-3 font-medium">{tBugs("status")}</th>
            <th className="px-4 py-3 font-medium">{tBugs("created")}</th>
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, index) => (
              <SkeletonTableRow key={index} />
            ))}
          {bugs?.slice(0, 5).map((bug) => (
            <tr
              key={bug.id}
              className="border-b border-gray-50 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.02]"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/bugs/${bug.id}`}
                  className="text-xs font-mono text-accent hover:underline"
                >
                  {bug.trackingId}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200 truncate max-w-[200px]">
                {bug.title}
              </td>
              <td className="px-4 py-3">
                <SeverityBadge severity={bug.severity} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={bug.status} />
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
