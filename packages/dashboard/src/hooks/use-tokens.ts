import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface TokenResponse {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface TokenCreateResponse {
  id: string;
  name: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
}

export function useTokens() {
  return useQuery({
    queryKey: queryKeys.tokens.all,
    queryFn: async (): Promise<TokenResponse[]> => {
      const response = await apiClient.get<TokenResponse[]>("/auth/tokens");
      return response.data;
    },
  });
}

export function useCreateToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      expiresInDays?: number;
    }): Promise<TokenCreateResponse> => {
      const response = await apiClient.post<TokenCreateResponse>(
        "/auth/tokens",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tokens.all });
    },
  });
}

export function useDeleteToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/auth/tokens/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tokens.all });
    },
  });
}
