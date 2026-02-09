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
import type { Severity } from "@/types";
import { SkeletonChart } from "@/components/shared/skeleton-loader";

interface SeverityChartProps {
  data: { severity: Severity; count: number }[] | undefined;
  isLoading: boolean;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
};

export function SeverityChart({ data, isLoading }: SeverityChartProps) {
  const t = useTranslations("dashboard");

  if (isLoading) return <SkeletonChart />;

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        {t("noDataYet")}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 p-6 shadow-sm">
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
              border: "1px solid #e5e7eb",
            }}
          />
          <Legend
            formatter={(value: string) =>
              value.charAt(0).toUpperCase() + value.slice(1)
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
