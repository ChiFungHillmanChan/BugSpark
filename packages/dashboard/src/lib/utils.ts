import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Severity, Status } from "@/types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string, locale = "en"): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffSeconds < 60) return rtf.format(0, "second"); // "now" / "剛才"
  if (diffMinutes < 60) return rtf.format(-diffMinutes, "minute");
  if (diffHours < 24) return rtf.format(-diffHours, "hour");
  if (diffDays < 30) return rtf.format(-diffDays, "day");
  return then.toLocaleDateString(locale);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function severityColor(severity: Severity): string {
  const colors: Record<Severity, string> = {
    critical: "text-severity-critical bg-severity-critical/10",
    high: "text-severity-high bg-severity-high/10",
    medium: "text-severity-medium bg-severity-medium/10",
    low: "text-severity-low bg-severity-low/10",
  };
  return colors[severity];
}

export function statusColor(status: Status): string {
  const colors: Record<Status, string> = {
    new: "text-status-new bg-status-new/10",
    triaging: "text-status-triaging bg-status-triaging/10",
    in_progress: "text-status-in-progress bg-status-in-progress/10",
    resolved: "text-status-resolved bg-status-resolved/10",
    closed: "text-status-closed bg-status-closed/10",
  };
  return colors[status];
}
