"use client";

import { useState } from "react";
import { LayoutList, Columns3 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { BugFiltersBar } from "@/components/bugs/bug-filters";
import { BugTable } from "@/components/bugs/bug-table";
import { KanbanBoard } from "@/components/bugs/kanban-board";
import { useBugs } from "@/hooks/use-bugs";
import { cn } from "@/lib/utils";
import type { BugFilters } from "@/types";

type ViewMode = "table" | "kanban";

export default function BugsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [filters, setFilters] = useState<BugFilters>({
    page: 1,
    pageSize: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data, isLoading } = useBugs(filters);

  return (
    <div>
      <PageHeader
        title="Bugs"
        actions={
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium",
                viewMode === "table"
                  ? "bg-accent text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50",
              )}
            >
              <LayoutList className="w-4 h-4" />
              Table
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium",
                viewMode === "kanban"
                  ? "bg-accent text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50",
              )}
            >
              <Columns3 className="w-4 h-4" />
              Kanban
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
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {filters.page ?? 1} of {totalPages}
            </span>
            <button
              onClick={() =>
                setFilters({ ...filters, page: (filters.page ?? 1) + 1 })
              }
              disabled={(filters.page ?? 1) >= totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        );
      })()}
    </div>
  );
}
