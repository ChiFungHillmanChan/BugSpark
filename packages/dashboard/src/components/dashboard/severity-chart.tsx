"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";
import { useTranslations } from "next-intl";
import { useTheme } from "@/providers/theme-provider";
import type { Severity } from "@/types";
import { SkeletonChart } from "@/components/shared/skeleton-loader";

interface SeverityChartProps {
  data: { severity: Severity; count: number }[] | undefined;
  isLoading: boolean;
  noProjectSelected?: boolean;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
};

export function SeverityChart({
  data,
  isLoading,
  noProjectSelected,
}: SeverityChartProps) {
  const t = useTranslations("dashboard");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (isLoading) return <SkeletonChart />;

  if (noProjectSelected) {
    return (
      <div className="bg-white dark:bg-navy-800/50 rounded-xl border border-gray-200 dark:border-white/[0.06] p-6 shadow-sm">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
          {t("severityBreakdown")}
        </h3>
        <div className="h-64 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          {t("selectProjectForCharts")}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-800/50 rounded-xl border border-gray-200 dark:border-white/[0.06] p-6 shadow-sm">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
          {t("severityBreakdown")}
        </h3>
        <div className="h-64 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          {t("noDataYet")}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-800/50 rounded-xl border border-gray-200 dark:border-white/[0.06] p-6 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        {t("severityBreakdown")}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="severity"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
          >
            {data.map((entry) => (
              <Cell
                key={entry.severity}
                fill={SEVERITY_COLORS[entry.severity]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
              backgroundColor: isDark ? "rgba(30,41,59,0.9)" : "#fff",
              color: isDark ? "#fff" : "#000",
            }}
          />
          <Legend
            formatter={(value: string) =>
              value.charAt(0).toUpperCase() + value.slice(1)
            }
            wrapperStyle={{ color: isDark ? "rgba(255,255,255,0.6)" : undefined }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
