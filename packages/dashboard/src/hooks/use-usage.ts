import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { UsageResponse } from "@/types";

export function useUsage() {
  return useQuery({
    queryKey: queryKeys.usage.current,
    queryFn: async () => {
      const { data } = await apiClient.get<UsageResponse>("/usage");
      return data;
    },
  });
}

export function calculateUsagePercent(current: number, limit: number | null): number {
  if (limit === null) return 0;
  return Math.round((current / limit) * 100);
}

export function isUsageWarning(current: number, limit: number | null): boolean {
  if (limit === null) return false;
  const percent = calculateUsagePercent(current, limit);
  return percent >= 80;
}

export function isAtLimit(current: number, limit: number | null): boolean {
  if (limit === null) return false;
  return current >= limit;
}
