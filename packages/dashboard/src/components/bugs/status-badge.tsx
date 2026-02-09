"use client";

import { useTranslations } from "next-intl";
import { cn, statusColor } from "@/lib/utils";
import type { Status } from "@/types";

interface StatusBadgeProps {
  status: Status;
}

const STATUS_KEY_MAP: Record<Status, string> = {
  new: "statusNew",
  triaging: "statusTriaging",
  in_progress: "statusInProgress",
  resolved: "statusResolved",
  closed: "statusClosed",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations("bugs");

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        statusColor(status),
      )}
    >
      {t(STATUS_KEY_MAP[status])}
    </span>
  );
}
