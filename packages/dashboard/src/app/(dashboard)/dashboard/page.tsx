"use client";

import { Bug, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { BugTrendChart } from "@/components/dashboard/bug-trend-chart";
import { SeverityChart } from "@/components/dashboard/severity-chart";
import { RecentBugs } from "@/components/dashboard/recent-bugs";
import { SkeletonCard } from "@/components/shared/skeleton-loader";
import { useDashboardStats, useBugTrends } from "@/hooks/use-stats";
import { useBugs } from "@/hooks/use-bugs";
import { useProjects } from "@/hooks/use-projects";
import { useProjectContext } from "@/providers/project-provider";
import type { Severity } from "@/types";
import { useMemo } from "react";

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function severityChartData(
  bugsBySeverity: Record<string, number> | undefined,
): { severity: Severity; count: number }[] | undefined {
  if (!bugsBySeverity) return undefined;
  const order: Severity[] = ["critical", "high", "medium", "low"];
  return order
    .filter((s) => (bugsBySeverity[s] ?? 0) > 0)
    .map((severity) => ({ severity, count: bugsBySeverity[severity] ?? 0 }));
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { selectedProjectId } = useProjectContext();
  const { data: projects } = useProjects();
  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    projects?.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [projects]);
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats(
    selectedProjectId,
  );
  const { data: projectStats, isLoading: isProjectStatsLoading } = useBugTrends(
    selectedProjectId ?? "",
  );
  const { data: bugsData, isLoading: isBugsLoading } = useBugs({
    projectId: selectedProjectId,
    pageSize: 5,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const chartsLoading = selectedProjectId
    ? isProjectStatsLoading
    : false;
  const trendData = selectedProjectId ? projectStats?.bugsByDay : undefined;
  const severityData = selectedProjectId
    ? severityChartData(projectStats?.bugsBySeverity)
    : undefined;

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
        <BugTrendChart
          data={trendData}
          isLoading={chartsLoading}
          noProjectSelected={!selectedProjectId}
        />
        <SeverityChart
          data={severityData}
          isLoading={chartsLoading}
          noProjectSelected={!selectedProjectId}
        />
      </div>

      <RecentBugs
        bugs={bugsData?.items}
        isLoading={isBugsLoading}
        projectMap={projectMap}
        showProject={!selectedProjectId}
      />
    </div>
  );
}
