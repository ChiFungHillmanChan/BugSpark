"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2, FolderKanban, FileText, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/providers/auth-provider";
import {
  useSubscription,
  useInvoices,
  useCancelSubscription,
  useReactivateSubscription,
  useCreateCheckoutSession,
  useChangePlan,
} from "@/hooks/use-billing";
import { useUsage } from "@/hooks/use-usage";
import { UsageCard } from "@/components/usage/usage-card";
import { SubscriptionCard } from "./components/subscription-card";
import { BillingAlerts } from "./components/billing-alerts";
import { PlanSelector } from "./components/plan-selector";
import { InvoiceTable } from "./components/invoice-table";
import { CancelDialog } from "./components/cancel-dialog";
import type { UserPlan } from "@/types";

export default function BillingPage() {
  const t = useTranslations("billing");
  const tu = useTranslations("usage");
  const { user, refreshUser } = useAuth();
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription();
  const { data: invoices, isLoading: isLoadingInvoices } = useInvoices();
  const { data: usage, isLoading: isLoadingUsage } = useUsage();
  const cancelMutation = useCancelSubscription();
  const reactivateMutation = useReactivateSubscription();
  const checkoutMutation = useCreateCheckoutSession();
  const changePlanMutation = useChangePlan();

  const currentPlan: UserPlan = (user?.plan as UserPlan) ?? "free";
  const isFreePlan = currentPlan === "free";

  function handleChangePlan(plan: string, billingInterval: string) {
    if (isFreePlan) {
      checkoutMutation.mutate(
        { plan, billingInterval },
        {
          onSuccess: (data) => {
            window.location.assign(data.checkoutUrl);
          },
        },
      );
    } else {
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
      <div className="w-full">
        <PageHeader title={t("title")} />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToSettings")}
        </Link>
      </div>

      <PageHeader title={t("title")} />

      <div className="space-y-6">
        {subscription && <SubscriptionCard subscription={subscription} />}

        {subscription && (
          <BillingAlerts
            subscription={subscription}
            isReactivating={reactivateMutation.isPending}
            onReactivate={handleReactivateSubscription}
          />
        )}

        {isLoadingUsage ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-navy-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : usage ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UsageCard
              label={tu("projects")}
              quota={usage.projects}
              icon={FolderKanban}
              unlimitedLabel={tu("unlimited")}
            />
            <UsageCard
              label={tu("reportsThisMonth")}
              quota={usage.reportsPerMonth}
              icon={FileText}
              unlimitedLabel={tu("unlimited")}
            />
            <UsageCard
              label={tu("teamMembers")}
              quota={usage.teamMembersPerProject[0] ? {
                current: usage.teamMembersPerProject.reduce((sum, p) => sum + p.memberCount, 0),
                limit: usage.teamMembersPerProject[0]?.memberLimit,
              } : { current: 0, limit: null }}
              icon={Users}
              unlimitedLabel={tu("unlimited")}
            />
          </div>
        ) : null}

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
    </div>
  );
}
