import { cn, severityColor } from "@/lib/utils";
import type { Severity } from "@/types";

interface SeverityBadgeProps {
  severity: Severity;
}

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        severityColor(severity),
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
