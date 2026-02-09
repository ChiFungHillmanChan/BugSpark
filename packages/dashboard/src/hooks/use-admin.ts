import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type {
  AdminUser,
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
