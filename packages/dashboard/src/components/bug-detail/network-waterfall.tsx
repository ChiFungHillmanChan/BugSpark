"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import type { NetworkRequest } from "@/types";

interface NetworkWaterfallProps {
  requests: NetworkRequest[] | null;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-yellow-100 text-yellow-700",
  PATCH: "bg-orange-100 text-orange-700",
  DELETE: "bg-red-100 text-red-700",
};

function statusCodeColor(code: number): string {
  if (code >= 200 && code < 300) return "text-green-600";
  if (code >= 400 && code < 500) return "text-yellow-600";
  if (code >= 500) return "text-red-600";
  return "text-gray-600";
}

export function NetworkWaterfall({ requests }: NetworkWaterfallProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!requests || requests.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-4 text-center">
        No network requests captured
      </p>
    );
  }

  return (
    <div className="space-y-1 max-h-96 overflow-y-auto">
      {requests.map((request, index) => {
        const isExpanded = expandedIndex === index;
        const methodColor =
          METHOD_COLORS[request.method] ?? "bg-gray-100 text-gray-700";

        return (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 shrink-0 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 shrink-0 text-gray-400" />
              )}
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  methodColor,
                )}
              >
                {request.method}
              </span>
              <span className="text-xs text-gray-700 truncate flex-1 font-mono">
                {request.url}
              </span>
              <span
                className={cn(
                  "text-xs font-medium shrink-0",
                  statusCodeColor(request.status),
                )}
              >
                {request.status}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {formatDuration(request.duration)}
              </span>
            </button>

            {isExpanded && (
              <NetworkRequestDetail request={request} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function NetworkRequestDetail({ request }: { request: NetworkRequest }) {
  return (
    <div className="border-t border-gray-100 px-3 py-2 bg-gray-50 text-xs">
      <div className="mb-3">
        <h4 className="font-medium text-gray-700 mb-1">Request Headers</h4>
        <div className="space-y-0.5 font-mono">
          {Object.entries(request.requestHeaders ?? {}).map(([key, value]) => (
            <div key={key}>
              <span className="text-gray-500">{key}:</span>{" "}
              <span className="text-gray-700">{value}</span>
            </div>
          ))}
          {Object.keys(request.requestHeaders ?? {}).length === 0 && (
            <span className="text-gray-400">No headers</span>
          )}
        </div>
      </div>
      <div>
        <h4 className="font-medium text-gray-700 mb-1">Response Headers</h4>
        <div className="space-y-0.5 font-mono">
          {Object.entries(request.responseHeaders ?? {}).map(([key, value]) => (
            <div key={key}>
              <span className="text-gray-500">{key}:</span>{" "}
              <span className="text-gray-700">{value}</span>
            </div>
          ))}
          {Object.keys(request.responseHeaders ?? {}).length === 0 && (
            <span className="text-gray-400">No headers</span>
          )}
        </div>
      </div>
    </div>
  );
}
