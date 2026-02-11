import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { AnalysisResponse } from "@/types";

export function useAnalyzeReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string): Promise<AnalysisResponse> => {
      const response = await apiClient.post<AnalysisResponse>(
        `/reports/${reportId}/analyze`,
      );
      return response.data;
    },
    onSuccess: (_data, reportId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bugs.detail(reportId),
      });
    },
  });
}
