import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type {
  AdminUser,
  BugReport,
  PaginatedResponse,
  PlatformStats,
  BetaUser,
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
  plan_expires_at?: string | null;
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

// ── App settings ──────────────────────────────────────────────────────────

interface AppSettingsData {
  betaModeEnabled: boolean;
}

export function useAdminSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings,
    queryFn: async () => {
      const response = await apiClient.get<AppSettingsData>("/admin/settings");
      return response.data;
    },
  });
}

export function useAdminUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { betaModeEnabled: boolean }) => {
      const response = await apiClient.patch<AppSettingsData>(
        "/admin/settings",
        { beta_mode_enabled: data.betaModeEnabled },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings });
    },
  });
}

// ── Beta user management ──────────────────────────────────────────────────

interface AdminBetaUsersParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminBetaUsers(params: AdminBetaUsersParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.betaUsers(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {};
      if (params.search) queryParams.search = params.search;
      if (params.status) queryParams.status = params.status;
      if (params.page) queryParams.page = params.page;
      if (params.pageSize) queryParams.page_size = params.pageSize;

      const response = await apiClient.get<PaginatedResponse<BetaUser>>(
        "/admin/beta-users",
        { params: queryParams },
      );
      return response.data;
    },
  });
}

export function useAdminApproveBeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post<BetaUser>(
        `/admin/beta-users/${userId}/approve`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "beta-users"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
}

export function useAdminRejectBeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post<BetaUser>(
        `/admin/beta-users/${userId}/reject`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "beta-users"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
}
