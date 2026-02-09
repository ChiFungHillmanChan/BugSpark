import Link from "next/link";
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
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Recent Bugs</h3>
        <Link
          href="/bugs"
          className="text-xs text-accent hover:underline font-medium"
        >
          View all
        </Link>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
            <th className="px-4 py-3 font-medium">ID</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Created</th>
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
              className="border-b border-gray-50 hover:bg-gray-50"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/bugs/${bug.id}`}
                  className="text-xs font-mono text-accent hover:underline"
                >
                  {bug.trackingId}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 truncate max-w-[200px]">
                {bug.title}
              </td>
              <td className="px-4 py-3">
                <SeverityBadge severity={bug.severity} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={bug.status} />
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
