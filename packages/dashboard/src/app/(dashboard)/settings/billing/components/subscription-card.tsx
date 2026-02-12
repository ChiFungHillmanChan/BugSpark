"use client";

import type { SubscriptionInfo } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  canceled: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  past_due: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  trialing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

function formatStatusLabel(status: string | null): string {
  if (!status) return "Free";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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
  const statusStyle = STATUS_STYLES[subscription.status ?? ""] ?? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  const planLabel = subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1);

  return (
    <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Plan</h2>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}>
          {formatStatusLabel(subscription.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{planLabel}</p>
        </div>
        {subscription.billingInterval && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Billing Interval</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {subscription.billingInterval}
            </p>
          </div>
        )}
        {subscription.amount !== null && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatAmount(subscription.amount)}/{subscription.billingInterval === "yearly" ? "yr" : "mo"}
            </p>
          </div>
        )}
        {subscription.currentPeriodEnd && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Next Billing Date</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
