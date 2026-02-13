"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { SeverityBadge } from "./severity-badge";
import { StatusBadge } from "./status-badge";
import { SkeletonTableRow } from "@/components/shared/skeleton-loader";
import { EmptyState } from "@/components/shared/empty-state";
import { Bug } from "lucide-react";
import { useDeleteBug } from "@/hooks/use-bugs";
import type { BugListItem } from "@/types";

interface BugTableProps {
  bugs: BugListItem[] | undefined;
  isLoading: boolean;
}

export function BugTable({ bugs, isLoading }: BugTableProps) {
  const t = useTranslations("bugs");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const deleteBug = useDeleteBug();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleDelete(id: string) {
    deleteBug.mutate(id, {
      onSettled: () => setConfirmDeleteId(null),
    });
  }

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
    <>
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
              <th className="px-4 py-3 font-medium w-10" />
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
                    onClick={() => router.push(`/bugs/${bug.id}`)}
                    className="border-b border-gray-50 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-accent">
                        {bug.trackingId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-[300px] truncate">
                      {bug.title}
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
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(bug.id);
                        }}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title={t("deleteBug")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700 p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold dark:text-white mb-2">
              {t("deleteBug")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t("deleteBugConfirm")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-700"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleteBug.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteBug.isPending ? tCommon("loading") : tCommon("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
