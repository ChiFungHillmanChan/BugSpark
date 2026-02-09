import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { SimilarBugsResponse } from "@/types";

export function useSimilarBugs(reportId: string) {
  return useQuery({
    queryKey: queryKeys.similarBugs.list(reportId),
    queryFn: async (): Promise<SimilarBugsResponse> => {
      const response = await apiClient.get<SimilarBugsResponse>(
        `/reports/${reportId}/similar`,
      );
      return response.data;
    },
    enabled: !!reportId,
  });
}
