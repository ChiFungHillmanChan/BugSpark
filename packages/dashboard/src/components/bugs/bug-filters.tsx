"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
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
const DATE_OPTIONS = [
  { label: "Last 7 days", value: "7d" as const },
  { label: "Last 30 days", value: "30d" as const },
  { label: "Last 90 days", value: "90d" as const },
  { label: "All time", value: "all" as const },
];

export function BugFiltersBar({ filters, onFiltersChange }: BugFiltersBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchInput || undefined });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleArrayFilter<T>(array: T[] | undefined, value: T): T[] {
    const current = array ?? [];
    return current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
  }

  const hasActiveFilters =
    filters.search ||
    filters.severity?.length ||
    filters.status?.length ||
    (filters.dateRange && filters.dateRange !== "all");

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search bugs..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {STATUS_OPTIONS.map((status) => (
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
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {status.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {SEVERITY_OPTIONS.map((severity) => (
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
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {severity}
          </button>
        ))}
      </div>

      <select
        value={filters.dateRange ?? "all"}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            dateRange: e.target.value as BugFilters["dateRange"],
          })
        }
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
      >
        {DATE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={() =>
            onFiltersChange({ page: 1, pageSize: filters.pageSize })
          }
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
