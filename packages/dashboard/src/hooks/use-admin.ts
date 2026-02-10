import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type {
  AdminUser,
  BugReport,
  PaginatedResponse,
  PlatformStats,
} from "@/types";

interface AdminUsersParams {
  search?: string;
  role?: string;
  plan?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminUsers(params: AdminUsersParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<AdminUser>>(
        "/admin/users",
        { params },
      );
      return response.data;
    },
  });
}

export function usePlatformStats() {
  return useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: async () => {
      const response = await apiClient.get<PlatformStats>("/admin/stats");
      return response.data;
    },
  });
}

interface UpdateUserPayload {
  role?: string;
  plan?: string;
  is_active?: boolean;
}

interface AdminReportsParams {
  search?: string;
  severity?: string;
  status?: string;
  projectId?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminReports(params: AdminReportsParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.admin.reports, params],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {};
      if (params.search) queryParams.search = params.search;
      if (params.severity) queryParams.severity = params.severity;
      if (params.status) queryParams.status = params.status;
      if (params.projectId) queryParams.project_id = params.projectId;
      if (params.page) queryParams.page = params.page;
      if (params.pageSize) queryParams.page_size = params.pageSize;

      const response = await apiClient.get<PaginatedResponse<BugReport>>(
        "/admin/reports",
        { params: queryParams },
      );
      return response.data;
    },
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateUserPayload;
    }) => {
      const response = await apiClient.patch<AdminUser>(
        `/admin/users/${userId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
}
