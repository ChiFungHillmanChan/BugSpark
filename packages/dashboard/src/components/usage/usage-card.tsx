"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateUsagePercent, isUsageWarning, isAtLimit } from "@/hooks/use-usage";
import type { UsageQuota } from "@/types";

interface UsageCardProps {
  label: string;
  quota: UsageQuota;
  icon: LucideIcon;
  unlimitedLabel?: string;
}

export function UsageCard({
  label,
  quota,
  icon: Icon,
  unlimitedLabel,
}: UsageCardProps) {
  const percent = calculateUsagePercent(quota.current, quota.limit);
  const isWarning = isUsageWarning(quota.current, quota.limit);
  const isLimited = isAtLimit(quota.current, quota.limit);
  const isUnlimited = quota.limit === null;

  let progressColor = "bg-green-500";
  let textColor = "text-green-900 dark:text-green-200";

  if (isWarning && !isLimited) {
    progressColor = "bg-amber-500";
    textColor = "text-amber-900 dark:text-amber-200";
  } else if (isLimited) {
    progressColor = "bg-red-500";
    textColor = "text-red-900 dark:text-red-200";
  }

  return (
    <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-navy-700">
            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</h3>
        </div>
        {isUnlimited && unlimitedLabel && (
          <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
            {unlimitedLabel}
          </span>
        )}
      </div>

      {!isUnlimited && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {quota.current} / {quota.limit}
              </span>
              <span className={cn("text-sm font-semibold", textColor)}>
                {percent}%
              </span>
            </div>

            <div className="w-full h-2 bg-gray-200 dark:bg-navy-700 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-300", progressColor)}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
          </div>
        </>
      )}

      {isUnlimited && (
        <div className="py-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {quota.current} used
          </span>
        </div>
      )}
    </div>
  );
}
