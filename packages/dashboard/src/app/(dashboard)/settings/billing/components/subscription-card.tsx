"use client";

import { useTranslations } from "next-intl";
import type { SubscriptionInfo } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  canceled: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  past_due: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  trialing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const STATUS_KEY_MAP: Record<string, string> = {
  active: "statusActive",
  canceled: "statusCanceled",
  past_due: "statusPastDue",
  trialing: "statusTrialing",
};

const PLAN_KEY_MAP: Record<string, string> = {
  free: "planFree",
  starter: "planStarter",
  team: "planTeam",
  enterprise: "planEnterprise",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString();
}

function formatAmount(amount: number | null): string {
  if (amount === null) return "HK$0";
  return `HK$${(amount / 100).toFixed(0)}`;
}

interface SubscriptionCardProps {
  subscription: SubscriptionInfo;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const t = useTranslations("billing");
  const statusStyle = STATUS_STYLES[subscription.status ?? ""] ?? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  const statusKey = STATUS_KEY_MAP[subscription.status ?? "active"];
  const planKey = PLAN_KEY_MAP[subscription.plan] ?? "planFree";

  return (
    <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("currentPlan")}</h2>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}>
          {t(statusKey)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("plan")}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t(planKey)}</p>
        </div>
        {subscription.billingInterval && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("billingInterval")}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {subscription.billingInterval === "yearly" ? t("yearly") : t("monthly")}
            </p>
          </div>
        )}
        {subscription.amount !== null && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("amount")}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatAmount(subscription.amount)}/{subscription.billingInterval === "yearly" ? t("yearly_short") : t("monthly_short")}
            </p>
          </div>
        )}
        {subscription.planExpiresAt && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("planDueDate")}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(subscription.planExpiresAt)}
            </p>
          </div>
        )}
        {subscription.currentPeriodEnd && !subscription.planExpiresAt && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("nextBillingDate")}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
