"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, XCircle } from "lucide-react";
import type { SubscriptionInfo } from "@/types";

interface BillingAlertsProps {
  subscription: SubscriptionInfo;
  isReactivating: boolean;
  onReactivate: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString();
}

export function BillingAlerts({ subscription, isReactivating, onReactivate }: BillingAlertsProps) {
  const t = useTranslations("billing");

  if (subscription.cancelAtPeriodEnd) {
    return (
      <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            {t("subscriptionCanceled")}
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
            {t("subscriptionCanceledDesc", { date: formatDate(subscription.currentPeriodEnd) })}
          </p>
          <button
            type="button"
            onClick={onReactivate}
            disabled={isReactivating}
            className="mt-2 text-sm font-medium text-yellow-800 dark:text-yellow-300 hover:underline disabled:opacity-50"
          >
            {isReactivating ? t("reactivating") : t("reactivateSubscription")}
          </button>
        </div>
      </div>
    );
  }

  if (subscription.status === "past_due") {
    return (
      <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            {t("paymentFailed")}
          </p>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            {t("paymentFailedDesc")}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
