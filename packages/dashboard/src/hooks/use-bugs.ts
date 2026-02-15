import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { BugReport, BugListItem, BugFilters, PaginatedResponse } from "@/types";

export function useBugs(filters: BugFilters) {
  return useQuery({
    queryKey: queryKeys.bugs.list(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PaginatedResponse<BugListItem>> => {
      const params = new URLSearchParams();
      if (filters.projectId) params.set("project_id", filters.projectId);
      if (filters.search) params.set("search", filters.search);
      if (filters.status?.length)
        params.set("status", filters.status.join(","));
      if (filters.severity?.length)
        params.set("severity", filters.severity.join(","));
      if (filters.dateRange) params.set("date_range", filters.dateRange);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.pageSize) params.set("page_size", String(filters.pageSize));
      if (filters.sortBy) params.set("sort_by", filters.sortBy);
      if (filters.sortOrder) params.set("sort_order", filters.sortOrder);

      const response = await apiClient.get<PaginatedResponse<BugListItem>>(
        `/reports?${params.toString()}`,
      );
      return response.data;
    },
  });
}

export function useBug(id: string) {
  return useQuery({
    queryKey: queryKeys.bugs.detail(id),
    staleTime: 60_000,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<BugReport> => {
      const response = await apiClient.get<BugReport>(`/reports/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useUpdateBug() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<BugReport>;
    }): Promise<BugReport> => {
      const response = await apiClient.patch<BugReport>(
        `/reports/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bugs.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bugs.detail(variables.id),
      });
    },
  });
}

export function useDeleteBug() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Cancel any in-flight queries for this report before deleting to prevent
      // refetches against the soon-to-be-deleted resource (which would 404 and
      // trigger CORS errors because the error response may lack CORS headers).
      await queryClient.cancelQueries({ queryKey: queryKeys.bugs.detail(id) });
      queryClient.removeQueries({ queryKey: queryKeys.bugs.detail(id) });
      queryClient.removeQueries({ queryKey: ["analysis", id] });

      await apiClient.delete(`/reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bugs.all });
    },
  });
}
