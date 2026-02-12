"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/providers/auth-provider";
import {
  useSubscription,
  useInvoices,
  useCancelSubscription,
  useReactivateSubscription,
  useCreateCheckoutSession,
} from "@/hooks/use-billing";
import { SubscriptionCard } from "./components/subscription-card";
import { BillingAlerts } from "./components/billing-alerts";
import { PlanSelector } from "./components/plan-selector";
import { InvoiceTable } from "./components/invoice-table";
import { CancelDialog } from "./components/cancel-dialog";
import type { UserPlan } from "@/types";

export default function BillingPage() {
  const { user } = useAuth();
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription();
  const { data: invoices, isLoading: isLoadingInvoices } = useInvoices();
  const cancelMutation = useCancelSubscription();
  const reactivateMutation = useReactivateSubscription();
  const checkoutMutation = useCreateCheckoutSession();

  const currentPlan: UserPlan = (user?.plan as UserPlan) ?? "free";
  const isFreePlan = currentPlan === "free";

  function handleChangePlan(plan: string, billingInterval: string) {
    if (isFreePlan) {
      checkoutMutation.mutate({ plan, billingInterval });
    }
  }

  function handleCancelSubscription() {
    cancelMutation.mutate();
  }

  function handleReactivateSubscription() {
    reactivateMutation.mutate();
  }

  if (isLoadingSubscription) {
    return (
      <div className="max-w-xl">
        <PageHeader title="Billing" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
      </div>

      <PageHeader title="Billing" />

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
          isChanging={checkoutMutation.isPending}
          onChangePlan={handleChangePlan}
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
    </div>
  );
}
