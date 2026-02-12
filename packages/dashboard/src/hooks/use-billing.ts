import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { SubscriptionInfo, InvoiceInfo } from "@/types";

export function useSubscription() {
  return useQuery({
    queryKey: queryKeys.billing.subscription,
    queryFn: async () => {
      const { data } = await apiClient.get<SubscriptionInfo>("/billing/subscription");
      return data;
    },
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (params: { plan: string; billingInterval: string }) => {
      const { data } = await apiClient.post<{
        checkoutUrl: string;
        clientSecret: string;
        sessionId: string;
      }>(
        "/billing/create-checkout-session",
        params,
      );
      return data;
    },
  });
}

export function useChangePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { newPlan: string; billingInterval?: string }) => {
      const { data } = await apiClient.post<SubscriptionInfo>("/billing/change-plan", params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.subscription });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ message: string; cancelAt: string | null }>(
        "/billing/cancel-subscription",
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.subscription });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useReactivateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ message: string; plan: string; status: string }>(
        "/billing/reactivate-subscription",
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.subscription });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: queryKeys.billing.invoices,
    queryFn: async () => {
      const { data } = await apiClient.get<InvoiceInfo[]>("/billing/invoices");
      return data;
    },
  });
}
