"use client";

import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import {
  useSubscription,
  useInvoices,
  useCancelSubscription,
  useReactivateSubscription,
  useCreateCheckoutSession,
  useChangePlan,
} from "@/hooks/use-billing";
import { SubscriptionCard } from "../billing/components/subscription-card";
import { BillingAlerts } from "../billing/components/billing-alerts";
import { PlanSelector } from "../billing/components/plan-selector";
import { InvoiceTable } from "../billing/components/invoice-table";
import { CancelDialog } from "../billing/components/cancel-dialog";
import type { UserPlan } from "@/types";

export function BillingTab() {
  const { user, refreshUser } = useAuth();
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription();
  const { data: invoices, isLoading: isLoadingInvoices } = useInvoices();
  const cancelMutation = useCancelSubscription();
  const reactivateMutation = useReactivateSubscription();
  const checkoutMutation = useCreateCheckoutSession();
  const changePlanMutation = useChangePlan();

  const currentPlan: UserPlan = (user?.plan as UserPlan) ?? "free";
  const isFreePlan = currentPlan === "free";

  function handleChangePlan(plan: string, billingInterval: string) {
    if (isFreePlan) {
      // Free → paid: redirect to Stripe Checkout
      checkoutMutation.mutate(
        { plan, billingInterval },
        {
          onSuccess: (data) => {
            window.location.assign(data.checkoutUrl);
          },
        },
      );
    } else {
      // Paid → different plan: upgrade/downgrade inline via API
      changePlanMutation.mutate({ newPlan: plan, billingInterval }, { onSuccess: refreshUser });
    }
  }

  function handleCancelSubscription() {
    cancelMutation.mutate(undefined, { onSuccess: refreshUser });
  }

  function handleReactivateSubscription() {
    reactivateMutation.mutate(undefined, { onSuccess: refreshUser });
  }

  if (isLoadingSubscription) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {subscription && <SubscriptionCard subscription={subscription} />}

      {subscription && (
        <BillingAlerts
          subscription={subscription}
          isReactivating={reactivateMutation.isPending}
          onReactivate={handleReactivateSubscription}
        />
      )}

      <PlanSelector
        currentPlan={currentPlan}
        isChanging={checkoutMutation.isPending || changePlanMutation.isPending}
        onChangePlan={handleChangePlan}
        pendingDowngradePlan={subscription?.pendingDowngradePlan}
      />

      <InvoiceTable
        invoices={invoices ?? []}
        isLoading={isLoadingInvoices}
      />

      {!isFreePlan && subscription && !subscription.cancelAtPeriodEnd && (
        <div className="border-t border-gray-200 dark:border-navy-700 pt-6">
          <CancelDialog
            isCanceling={cancelMutation.isPending}
            onCancel={handleCancelSubscription}
          />
        </div>
      )}
    </div>
  );
}
