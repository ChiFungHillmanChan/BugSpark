import { cn, statusColor } from "@/lib/utils";
import type { Status } from "@/types";

interface StatusBadgeProps {
  status: Status;
}

const STATUS_LABELS: Record<Status, string> = {
  new: "New",
  triaging: "Triaging",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        statusColor(status),
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
