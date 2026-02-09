"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { BugTrend } from "@/types";
import { SkeletonChart } from "@/components/shared/skeleton-loader";

interface BugTrendChartProps {
  data: BugTrend[] | undefined;
  isLoading: boolean;
}

export function BugTrendChart({ data, isLoading }: BugTrendChartProps) {
  if (isLoading) return <SkeletonChart />;

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400">
        No trend data available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Bug Trend (30d)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          />
          <defs>
            <linearGradient id="bugTrendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e94560" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#e94560" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Line
            type="monotone"
            dataKey="count"
            stroke="#e94560"
            strokeWidth={2}
            dot={false}
            fill="url(#bugTrendGradient)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
