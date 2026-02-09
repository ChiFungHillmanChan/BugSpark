"use client";

import { Bug, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { BugTrendChart } from "@/components/dashboard/bug-trend-chart";
import { SeverityChart } from "@/components/dashboard/severity-chart";
import { RecentBugs } from "@/components/dashboard/recent-bugs";
import { SkeletonCard } from "@/components/shared/skeleton-loader";
import { useDashboardStats } from "@/hooks/use-stats";
import { useBugs } from "@/hooks/use-bugs";

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats();
  const { data: bugsData, isLoading: isBugsLoading } = useBugs({
    pageSize: 5,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  return (
    <div>
      <PageHeader title={t("title")} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isStatsLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : (
          <>
            <StatCard
              label={t("totalBugs")}
              value={stats?.totalBugs ?? 0}
              icon={Bug}
            />
            <StatCard
              label={t("openBugs")}
              value={stats?.openBugs ?? 0}
              icon={AlertCircle}
            />
            <StatCard
              label={t("resolvedToday")}
              value={stats?.resolvedToday ?? 0}
              icon={CheckCircle2}
            />
            <StatCard
              label={t("avgResolution")}
              value={formatHours(stats?.avgResolutionHours ?? 0)}
              icon={Clock}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <BugTrendChart data={undefined} isLoading={isStatsLoading} />
        <SeverityChart data={undefined} isLoading={isStatsLoading} />
      </div>

      <RecentBugs bugs={bugsData?.items} isLoading={isBugsLoading} />
    </div>
  );
}
