import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { OverviewStats, ProjectStats } from "@/types";

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.stats.overview,
    queryFn: async (): Promise<OverviewStats> => {
      const response = await apiClient.get<OverviewStats>("/stats/overview");
      return response.data;
    },
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
  });
}
