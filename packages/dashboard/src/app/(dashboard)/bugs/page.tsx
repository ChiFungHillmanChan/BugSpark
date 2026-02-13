"use client";

import { useState } from "react";
import { LayoutList, Columns3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { BugFiltersBar } from "@/components/bugs/bug-filters";
import { BugTable } from "@/components/bugs/bug-table";
import { KanbanBoard } from "@/components/bugs/kanban-board";
import { useBugs } from "@/hooks/use-bugs";
import { useProjectContext } from "@/providers/project-provider";
import { cn } from "@/lib/utils";
import type { BugFilters } from "@/types";

type ViewMode = "table" | "kanban";

export default function BugsPage() {
  const t = useTranslations("bugs");
  const { selectedProjectId } = useProjectContext();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [filters, setFilters] = useState<BugFilters>({
    page: 1,
    pageSize: 10,
    dateRange: "today",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data, isLoading } = useBugs({
    ...filters,
    projectId: selectedProjectId,
  });

  return (
    <div>
      <PageHeader
        title={t("title")}
        actions={
          <div className="flex items-center border border-gray-300 dark:border-navy-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium",
                viewMode === "table"
                  ? "bg-accent text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-navy-800 dark:text-gray-300 dark:hover:bg-navy-700",
              )}
            >
              <LayoutList className="w-4 h-4" />
              {t("table")}
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium",
                viewMode === "kanban"
                  ? "bg-accent text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-navy-800 dark:text-gray-300 dark:hover:bg-navy-700",
              )}
            >
              <Columns3 className="w-4 h-4" />
              {t("kanban")}
            </button>
          </div>
        }
      />

      <BugFiltersBar filters={filters} onFiltersChange={setFilters} />

      {viewMode === "table" ? (
        <BugTable bugs={data?.items} isLoading={isLoading} />
      ) : (
        <KanbanBoard bugs={data?.items} isLoading={isLoading} />
      )}

      {data && Math.ceil(data.total / (data.pageSize || 20)) > 1 && (() => {
        const totalPages = Math.ceil(data.total / (data.pageSize || 20));
        return (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() =>
                setFilters({ ...filters, page: (filters.page ?? 1) - 1 })
              }
              disabled={(filters.page ?? 1) <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-navy-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-navy-700"
            >
              {t("previous")}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t("pageOf", { page: filters.page ?? 1, total: totalPages })}
            </span>
            <button
              onClick={() =>
                setFilters({ ...filters, page: (filters.page ?? 1) + 1 })
              }
              disabled={(filters.page ?? 1) >= totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-navy-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-navy-700"
            >
              {t("next")}
            </button>
          </div>
        );
      })()}
    </div>
  );
}
