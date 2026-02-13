import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { SeverityBadge } from "./severity-badge";
import type { BugListItem } from "@/types";

interface BugCardProps {
  bug: BugListItem;
  onDragStart: (event: React.DragEvent, bugId: string) => void;
}

export function BugCard({ bug, onDragStart }: BugCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, bug.id)}
      className="bg-white dark:bg-navy-800/50 rounded-xl border border-gray-200 dark:border-white/[0.06] p-3 shadow-sm hover:shadow-md dark:hover:border-white/[0.12] transition-shadow cursor-grab active:cursor-grabbing"
    >
      <Link href={`/bugs/${bug.id}`} className="block">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
            {bug.trackingId}
          </span>
          <SeverityBadge severity={bug.severity} />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
          {bug.title}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{bug.reporterIdentifier ?? "Anonymous"}</span>
          <span>{formatDate(bug.createdAt)}</span>
        </div>
      </Link>
    </div>
  );
}
