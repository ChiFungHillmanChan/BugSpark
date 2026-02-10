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
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "@/providers/theme-provider";
import type { BugTrend } from "@/types";
import { SkeletonChart } from "@/components/shared/skeleton-loader";

interface BugTrendChartProps {
  data: BugTrend[] | undefined;
  isLoading: boolean;
}

export function BugTrendChart({ data, isLoading }: BugTrendChartProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (isLoading) return <SkeletonChart />;

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        {t("noDataYet")}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-800/50 rounded-xl border border-gray-200 dark:border-white/[0.06] p-6 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">{t("bugTrend")}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.04)" : "#f0f0f0"} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString(locale, {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis tick={{ fontSize: 12, fill: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }} />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              backgroundColor: isDark ? "rgba(30,41,59,0.9)" : "#fff",
              color: isDark ? "#fff" : "#000",
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
