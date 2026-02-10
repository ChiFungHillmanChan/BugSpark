"use client";

import { useCallback, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { cn, statusColor } from "@/lib/utils";
import { BugCard } from "./bug-card";
import { useUpdateBug } from "@/hooks/use-bugs";
import { EmptyState } from "@/components/shared/empty-state";
import { Bug } from "lucide-react";
import type { BugReport, Status } from "@/types";

interface KanbanBoardProps {
  bugs: BugReport[] | undefined;
  isLoading: boolean;
}

const KANBAN_COLUMNS: { status: Status; labelKey: string }[] = [
  { status: "new", labelKey: "statusNew" },
  { status: "triaging", labelKey: "statusTriaging" },
  { status: "in_progress", labelKey: "statusInProgress" },
  { status: "resolved", labelKey: "statusResolved" },
];

export function KanbanBoard({ bugs, isLoading }: KanbanBoardProps) {
  const t = useTranslations("bugs");
  const updateBug = useUpdateBug();

  const handleDragStart = useCallback(
    (event: DragEvent, bugId: string) => {
      event.dataTransfer.setData("text/plain", bugId);
    },
    [],
  );

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent, targetStatus: Status) => {
      event.preventDefault();
      const bugId = event.dataTransfer.getData("text/plain");
      if (bugId) {
        updateBug.mutate({ id: bugId, data: { status: targetStatus } });
      }
    },
    [updateBug],
  );

  if (!isLoading && (!bugs || bugs.length === 0)) {
    return (
      <EmptyState
        title={t("noBugs")}
        description={t("noBugsDescription")}
        icon={<Bug />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map((column) => {
        const columnBugs = bugs?.filter(
          (bug) => bug.status === column.status,
        ) ?? [];

        return (
          <div
            key={column.status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
            className="bg-gray-50 dark:bg-navy-800 rounded-lg p-3 min-h-[200px]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    statusColor(column.status),
                  )}
                />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t(column.labelKey)}
                </h3>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                {columnBugs.length}
              </span>
            </div>
            <div className="space-y-2">
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-navy-900 rounded-lg border border-gray-200 dark:border-navy-700 p-3 h-24 animate-pulse"
                    />
                  ))
                : columnBugs.map((bug) => (
                    <BugCard
                      key={bug.id}
                      bug={bug}
                      onDragStart={handleDragStart}
                    />
                  ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
