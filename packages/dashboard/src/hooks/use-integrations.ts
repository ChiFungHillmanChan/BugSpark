import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Integration, ExportResult } from "@/types";

export function useIntegrations(projectId: string) {
  return useQuery({
    queryKey: queryKeys.integrations.list(projectId),
    queryFn: async (): Promise<Integration[]> => {
      const response = await apiClient.get<Integration[]>(
        `/projects/${projectId}/integrations`,
      );
      return response.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string;
      data: { provider: string; config: Record<string, string> };
    }): Promise<Integration> => {
      const response = await apiClient.post<Integration>(
        `/projects/${projectId}/integrations`,
        data,
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.list(variables.projectId),
      });
    },
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      integrationId,
      projectId,
      data,
    }: {
      integrationId: string;
      projectId: string;
      data: { config?: Record<string, string>; isActive?: boolean };
    }): Promise<Integration> => {
      const response = await apiClient.patch<Integration>(
        `/integrations/${integrationId}`,
        data,
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.list(variables.projectId),
      });
    },
  });
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      integrationId,
    }: {
      integrationId: string;
      projectId: string;
    }): Promise<void> => {
      await apiClient.delete(`/integrations/${integrationId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.list(variables.projectId),
      });
    },
  });
}

export function useExportToTracker() {
  return useMutation({
    mutationFn: async ({
      reportId,
      provider,
    }: {
      reportId: string;
      provider: string;
    }): Promise<ExportResult> => {
      const response = await apiClient.post<ExportResult>(
        `/reports/${reportId}/export/${provider}`,
      );
      return response.data;
    },
  });
}
