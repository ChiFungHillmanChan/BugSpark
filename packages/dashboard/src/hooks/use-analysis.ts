import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { AnalysisResponse } from "@/types";

export function useAnalyzeReport() {
  return useMutation({
    mutationFn: async (reportId: string): Promise<AnalysisResponse> => {
      const response = await apiClient.post<AnalysisResponse>(
        `/reports/${reportId}/analyze`,
      );
      return response.data;
    },
  });
}
