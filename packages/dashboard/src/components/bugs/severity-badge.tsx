"use client";

import { useTranslations } from "next-intl";
import { cn, severityColor } from "@/lib/utils";
import type { Severity } from "@/types";

interface SeverityBadgeProps {
  severity: Severity;
}

const SEVERITY_KEY_MAP: Record<Severity, string> = {
  critical: "severityCritical",
  high: "severityHigh",
  medium: "severityMedium",
  low: "severityLow",
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const t = useTranslations("bugs");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        severityColor(severity),
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {t(SEVERITY_KEY_MAP[severity])}
    </span>
  );
}
