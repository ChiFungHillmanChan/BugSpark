import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Webhook } from "@/types";

export function useWebhooks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.webhooks.list(projectId),
    queryFn: async (): Promise<Webhook[]> => {
      const response = await apiClient.get<Webhook[]>(
        `/webhooks?project_id=${projectId}`,
      );
      return response.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string;
      data: { url: string; events: string[] };
    }): Promise<Webhook> => {
      const response = await apiClient.post<Webhook>(
        `/webhooks?project_id=${projectId}`,
        data,
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.webhooks.list(variables.projectId),
      });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      webhookId,
      data,
    }: {
      webhookId: string;
      projectId: string;
      data: { url?: string; events?: string[]; isActive?: boolean };
    }): Promise<Webhook> => {
      const response = await apiClient.patch<Webhook>(
        `/webhooks/${webhookId}`,
        data,
      );
      return response.data;
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.webhooks.list(projectId),
      });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      webhookId,
    }: {
      webhookId: string;
      projectId: string;
    }): Promise<void> => {
      await apiClient.delete(`/webhooks/${webhookId}`);
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.webhooks.list(projectId),
      });
    },
  });
}
