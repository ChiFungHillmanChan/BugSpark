import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { AnalysisResponse } from "@/types";

export function useAnalysis(reportId: string) {
  return useQuery({
    queryKey: ["analysis", reportId],
    queryFn: async (): Promise<AnalysisResponse | null> => {
      try {
        const response = await apiClient.get<AnalysisResponse>(
          `/reports/${reportId}/analyze`,
        );
        return response.data;
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "status" in error.response &&
          error.response.status === 404
        ) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: Infinity, // Analysis doesn't change unless regenerated
  });
}

export function useAnalyzeReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string): Promise<AnalysisResponse> => {
      const response = await apiClient.post<AnalysisResponse>(
        `/reports/${reportId}/analyze`,
      );
      return response.data;
    },
    onSuccess: (data, reportId) => {
      queryClient.setQueryData(["analysis", reportId], data);
      queryClient.invalidateQueries({
        queryKey: queryKeys.bugs.detail(reportId),
      });
    },
  });
}
