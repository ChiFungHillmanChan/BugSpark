"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import type { UserPlan } from "@/types";

const PLAN_PRICING = {
  starter: { monthly: 199, yearly: 1990, name: "Starter" },
  team: { monthly: 799, yearly: 7990, name: "Team" },
} as const;

const PLAN_ORDER: UserPlan[] = ["free", "starter", "team", "enterprise"];

interface PlanSelectorProps {
  currentPlan: UserPlan;
  isChanging: boolean;
  onChangePlan: (plan: string, billingInterval: string) => void;
}

export function PlanSelector({ currentPlan, isChanging, onChangePlan }: PlanSelectorProps) {
  const t = useTranslations("billing");
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);

  return (
    <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t("changePlan")}</h2>
      <div className="space-y-3">
        {PLAN_ORDER.map((plan, index) => {
          const isCurrent = plan === currentPlan;
          const isEnterprise = plan === "enterprise";
          const pricing = PLAN_PRICING[plan as keyof typeof PLAN_PRICING];

          if (isCurrent) {
            return (
              <div
                key={plan}
                className="flex items-center justify-between px-4 py-3 border-2 border-accent/50 rounded-lg bg-accent/5"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {pricing?.name ?? (plan === "free" ? t("planFree") : t("planEnterprise"))}
                  </p>
                  {pricing && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("currency")}{pricing.monthly}/{t("monthly_short")} or {t("currency")}{pricing.yearly}/{t("yearly_short")}
                    </p>
                  )}
                </div>
                <span className="text-xs font-medium text-accent">{t("currentPlanLabel")}</span>
              </div>
            );
          }

          if (isEnterprise) {
            return (
              <a
                key={plan}
                href="mailto:sales@bugspark.dev"
                className="flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-navy-700 rounded-lg hover:border-gray-300 dark:hover:border-navy-600 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t("planEnterprise")}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("customPricing")}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400" />
              </a>
            );
          }

          if (plan === "free") {
            return null;
          }

          const isUpgrade = index > currentPlanIndex;

          return (
            <div
              key={plan}
              className="flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-navy-700 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{pricing?.name}</p>
                {pricing && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("currency")}{pricing.monthly}/{t("monthly_short")} or {t("currency")}{pricing.yearly}/{t("yearly_short")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onChangePlan(plan, "month")}
                  disabled={isChanging}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  {isUpgrade ? t("upgrade") : t("switch")} ({t("monthly")})
                </button>
                <button
                  type="button"
                  onClick={() => onChangePlan(plan, "year")}
                  disabled={isChanging}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-accent text-accent hover:bg-accent/10 disabled:opacity-50 transition-colors"
                >
                  {isUpgrade ? t("upgrade") : t("switch")} ({t("yearly")})
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
