import { useQuery, keepPreviousData } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { OverviewStats, ProjectStats } from "@/types";

export function useDashboardStats(projectId?: string | null) {
  return useQuery({
    queryKey: [...queryKeys.stats.overview, projectId ?? "all"],
    queryFn: async (): Promise<OverviewStats> => {
      const params = projectId ? `?project_id=${projectId}` : "";
      const response = await apiClient.get<OverviewStats>(
        `/stats/overview${params}`,
      );
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useBugTrends(projectId: string) {
  return useQuery({
    queryKey: queryKeys.stats.project(projectId),
    queryFn: async (): Promise<ProjectStats> => {
      const response = await apiClient.get<ProjectStats>(
        `/stats/projects/${projectId}`,
      );
      return response.data;
    },
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });
}

export function useAggregatedStats() {
  return useQuery({
    queryKey: [...queryKeys.stats.overview, "aggregated"],
    queryFn: async (): Promise<ProjectStats> => {
      const response = await apiClient.get<ProjectStats>("/stats/aggregated");
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}
