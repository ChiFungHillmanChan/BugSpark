"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { useAdminReports } from "@/hooks/use-admin";
import { useProjects } from "@/hooks/use-projects";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { SeverityBadge } from "@/components/bugs/severity-badge";
import { StatusBadge } from "@/components/bugs/status-badge";
import { formatDate } from "@/lib/utils";
import { SkeletonTableRow } from "@/components/shared/skeleton-loader";

export default function AdminReportsPage() {
  const t = useTranslations("admin");
  const tBugs = useTranslations("bugs");
  const { isSuperadmin, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: projects } = useProjects();
  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    projects?.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [projects]);

  const { data, isLoading } = useAdminReports({
    search: search || undefined,
    page,
    pageSize: 20,
  });

  useEffect(() => {
    if (!isAuthLoading && !isSuperadmin) {
      router.replace("/dashboard");
    }
  }, [isAuthLoading, isSuperadmin, router]);

  if (isAuthLoading || !isSuperadmin) {
    return null;
  }

  const totalPages = data ? Math.ceil(data.total / (data.pageSize || 20)) : 0;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">
        {t("bugReports")}
      </h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder={t("searchReports")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-800 dark:text-white text-sm"
        />
      </div>

      <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-900">
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">
                {tBugs("trackingId")}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">
                {t("project")}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">
                {tBugs("bugTitle")}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">
                {tBugs("severity")}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">
                {tBugs("status")}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">
                {tBugs("created")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <SkeletonTableRow key={i} />
              ))
            ) : data?.items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  {t("noReportsFound")}
                </td>
              </tr>
            ) : (
              data?.items.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-gray-50 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/bugs/${report.id}`}
                      className="text-xs font-mono text-accent hover:underline"
                    >
                      {report.trackingId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 truncate max-w-[120px]">
                    {projectMap[report.projectId] ??
                      report.projectId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-[250px] truncate">
                    <Link
                      href={`/bugs/${report.id}`}
                      className="hover:underline"
                    >
                      {report.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={report.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(report.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-navy-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-navy-700"
          >
            {tBugs("previous")}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {tBugs("pageOf", { page, total: totalPages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-navy-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-navy-700"
          >
            {tBugs("next")}
          </button>
        </div>
      )}

      {data && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {t("totalReportsCount", { count: data.total })}
        </p>
      )}
    </div>
  );
}
