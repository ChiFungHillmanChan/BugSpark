"use client";

import Link from "next/link";
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
  if (!isLoading && (!bugs || bugs.length === 0)) {
    return (
      <EmptyState
        title="No bugs found"
        description="No bug reports match your current filters. Try adjusting your search criteria."
        icon={<Bug />}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 font-medium">Tracking ID</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
            <th className="px-4 py-3 font-medium">Created</th>
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
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/bugs/${bug.id}`}
                      className="text-xs font-mono text-accent hover:underline"
                    >
                      {bug.trackingId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-[300px] truncate">
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
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {bug.assigneeId ? "Assigned" : "Unassigned"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatDate(bug.createdAt)}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
