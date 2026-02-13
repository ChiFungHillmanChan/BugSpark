"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BugFilters, Severity, Status } from "@/types";

interface BugFiltersBarProps {
  filters: BugFilters;
  onFiltersChange: (filters: BugFilters) => void;
}

const SEVERITY_OPTIONS: Severity[] = ["critical", "high", "medium", "low"];
const STATUS_OPTIONS: Status[] = [
  "new",
  "triaging",
  "in_progress",
  "resolved",
  "closed",
];
const DATE_OPTION_KEYS = [
  { labelKey: "today", value: "today" as const },
  { labelKey: "last7days", value: "7d" as const },
  { labelKey: "last30days", value: "30d" as const },
  { labelKey: "last90days", value: "90d" as const },
  { labelKey: "allTime", value: "all" as const },
];

const FIXED_STATUSES: Status[] = ["resolved", "closed"];
const NON_FIXED_STATUSES: Status[] = ["new", "triaging", "in_progress"];

export function BugFiltersBar({ filters, onFiltersChange }: BugFiltersBarProps) {
  const t = useTranslations("bugs");
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const filtersRef = useRef(filters);
  const onChangeRef = useRef(onFiltersChange);
  filtersRef.current = filters;
  onChangeRef.current = onFiltersChange;

  // Sync local search input when parent filters change (e.g. on clear)
  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChangeRef.current({ ...filtersRef.current, search: searchInput || undefined });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  function toggleArrayFilter<T>(array: T[] | undefined, value: T): T[] {
    const current = array ?? [];
    return current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
  }

  const isFixed =
    filters.status?.length === FIXED_STATUSES.length &&
    FIXED_STATUSES.every((s) => filters.status?.includes(s));
  const isNonFixed =
    filters.status?.length === NON_FIXED_STATUSES.length &&
    NON_FIXED_STATUSES.every((s) => filters.status?.includes(s));

  const hasActiveFilters =
    filters.search ||
    filters.severity?.length ||
    filters.status?.length ||
    (filters.dateRange && filters.dateRange !== "today");

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-navy-800 dark:text-white"
        />
      </div>

      <div className="flex gap-1">
        <button
          onClick={() =>
            onFiltersChange({
              ...filters,
              status: isFixed ? undefined : FIXED_STATUSES,
            })
          }
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            isFixed
              ? "bg-accent text-white border-accent"
              : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 dark:bg-navy-800 dark:text-gray-300 dark:border-navy-700 dark:hover:border-navy-600"
          }`}
        >
          {t("fixed")}
        </button>
        <button
          onClick={() =>
            onFiltersChange({
              ...filters,
              status: isNonFixed ? undefined : NON_FIXED_STATUSES,
            })
          }
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            isNonFixed
              ? "bg-accent text-white border-accent"
              : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 dark:bg-navy-800 dark:text-gray-300 dark:border-navy-700 dark:hover:border-navy-600"
          }`}
        >
          {t("nonFixed")}
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {STATUS_OPTIONS.map((status) => {
          const statusKeyMap: Record<Status, string> = {
            new: "statusNew",
            triaging: "statusTriaging",
            in_progress: "statusInProgress",
            resolved: "statusResolved",
            closed: "statusClosed",
          };
          return (
            <button
              key={status}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  status: toggleArrayFilter(filters.status, status),
                })
              }
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filters.status?.includes(status)
                  ? "bg-accent text-white border-accent"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 dark:bg-navy-800 dark:text-gray-300 dark:border-navy-700 dark:hover:border-navy-600"
              }`}
            >
              {t(statusKeyMap[status])}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1">
        {SEVERITY_OPTIONS.map((severity) => {
          const severityKeyMap: Record<Severity, string> = {
            critical: "severityCritical",
            high: "severityHigh",
            medium: "severityMedium",
            low: "severityLow",
          };
          return (
            <button
              key={severity}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  severity: toggleArrayFilter(filters.severity, severity),
                })
              }
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filters.severity?.includes(severity)
                  ? "bg-accent text-white border-accent"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 dark:bg-navy-800 dark:text-gray-300 dark:border-navy-700 dark:hover:border-navy-600"
              }`}
            >
              {t(severityKeyMap[severity])}
            </button>
          );
        })}
      </div>

      <select
        value={filters.dateRange ?? "today"}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            dateRange: e.target.value as BugFilters["dateRange"],
          })
        }
        className="px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-800 dark:text-white"
      >
        {DATE_OPTION_KEYS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={() =>
            onFiltersChange({ page: 1, pageSize: 10, dateRange: "today" })
          }
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-3 h-3" />
          {t("clear")}
        </button>
      )}
    </div>
  );
}
