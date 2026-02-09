"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsoleLogEntry } from "@/types";

interface ConsoleLogViewerProps {
  logs: ConsoleLogEntry[] | null;
}

const LEVEL_STYLES: Record<ConsoleLogEntry["level"], string> = {
  error: "text-red-600 bg-red-50 border-red-200",
  warn: "text-yellow-700 bg-yellow-50 border-yellow-200",
  info: "text-blue-600 bg-blue-50 border-blue-200",
  log: "text-gray-600 bg-gray-50 border-gray-200",
  debug: "text-purple-600 bg-purple-50 border-purple-200",
};

const LEVEL_LABELS: Record<ConsoleLogEntry["level"], string> = {
  error: "ERR",
  warn: "WRN",
  info: "INF",
  log: "LOG",
  debug: "DBG",
};

type LogLevel = ConsoleLogEntry["level"];

export function ConsoleLogViewer({ logs }: ConsoleLogViewerProps) {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [activeFilters, setActiveFilters] = useState<Set<LogLevel>>(
    new Set(["error", "warn", "info", "log", "debug"]),
  );

  function toggleExpanded(index: number) {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleFilter(level: LogLevel) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  const filteredLogs = (logs ?? []).filter((log) => activeFilters.has(log.level));

  return (
    <div>
      <div className="flex gap-1 mb-3">
        {(Object.keys(LEVEL_LABELS) as LogLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => toggleFilter(level)}
            className={cn(
              "px-2 py-0.5 rounded text-xs font-medium border transition-colors",
              activeFilters.has(level)
                ? LEVEL_STYLES[level]
                : "text-gray-400 bg-gray-100 border-gray-200",
            )}
          >
            {LEVEL_LABELS[level]}
          </button>
        ))}
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
        {filteredLogs.length === 0 && (
          <p className="text-gray-400 text-sm py-4 text-center">
            No logs to display
          </p>
        )}
        {filteredLogs.map((log, index) => (
          <div
            key={index}
            className={cn("rounded border px-3 py-2", LEVEL_STYLES[log.level])}
          >
            <div className="flex items-start gap-2">
              {log.stack && (
                <button
                  onClick={() => toggleExpanded(index)}
                  className="mt-0.5 shrink-0"
                >
                  {expandedIndices.has(index) ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              )}
              <span className="font-bold shrink-0 w-8">
                {LEVEL_LABELS[log.level]}
              </span>
              <span className="flex-1 break-all">{log.message}</span>
              <span className="shrink-0 text-gray-400 text-[10px]">
                {log.timestamp}
              </span>
            </div>
            {log.stack && expandedIndices.has(index) && (
              <pre className="mt-2 pl-12 text-[10px] whitespace-pre-wrap opacity-75">
                {log.stack}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
