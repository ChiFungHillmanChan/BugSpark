"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ArrowUpRight, Loader2 } from "lucide-react";
import type { UserPlan } from "@/types";
import { ConfirmPlanChangeDialog } from "./confirm-plan-change-dialog";

export const PLAN_PRICING = {
  starter: { monthly: 199, yearly: 1990, name: "Starter" },
  team: { monthly: 799, yearly: 7990, name: "Team" },
} as const;

type BillingInterval = "month" | "year";

const PLAN_ORDER: UserPlan[] = ["free", "starter", "team"];

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    "planCardFreeReports",
    "planCardFreeProjects",
    "planCardFreeSeats",
    "planCardFreeScreenshot",
    "planCardFreeLogs",
  ],
  starter: [
    "planCardStarterReports",
    "planCardStarterProjects",
    "planCardStarterSeats",
    "planCardStarterIncludes",
    "planCardStarterReplay",
    "planCardStarterGithub",
    "planCardStarterRetention",
  ],
  team: [
    "planCardTeamReports",
    "planCardTeamProjects",
    "planCardTeamSeats",
    "planCardTeamIncludes",
    "planCardTeamAi",
    "planCardTeamLinear",
    "planCardTeamBranding",
    "planCardTeamRetention",
  ],
};

interface PlanSelectorProps {
  currentPlan: UserPlan;
  isChanging: boolean;
  onChangePlan: (plan: string, billingInterval: string) => void;
  pendingDowngradePlan?: string | null;
}

export function PlanSelector({ currentPlan, isChanging, onChangePlan, pendingDowngradePlan }: PlanSelectorProps) {
  const t = useTranslations("billing");
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [pendingChange, setPendingChange] = useState<{ plan: string; billingInterval: string } | null>(null);

  const pendingIsUpgrade = pendingChange
    ? PLAN_ORDER.indexOf(pendingChange.plan as UserPlan) > currentPlanIndex
    : false;

  function handleConfirm() {
    if (!pendingChange) return;
    onChangePlan(pendingChange.plan, pendingChange.billingInterval);
    setPendingChange(null);
  }

  function getPrice(plan: string): string {
    if (plan === "free") return t("planCardFreePrice");
    const pricing = PLAN_PRICING[plan as keyof typeof PLAN_PRICING];
    if (!pricing) return "--";
    const amount = billingInterval === "year" ? pricing.yearly : pricing.monthly;
    return `${t("currency")}${amount}`;
  }

  function getPriceInterval(): string {
    return billingInterval === "year" ? t("perYear") : t("perMonth");
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("changePlan")}</h2>

        {/* Monthly / Yearly toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-navy-700 rounded-full p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setBillingInterval("month")}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
              billingInterval === "month"
                ? "bg-white dark:bg-navy-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t("monthly")}
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("year")}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
              billingInterval === "year"
                ? "bg-white dark:bg-navy-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t("yearly")}
            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
              {t("savePercent")}
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_ORDER.map((plan, index) => {
          const isCurrent = plan === currentPlan;
          const isPendingDowngrade = pendingDowngradePlan === plan;
          const isUpgrade = index > currentPlanIndex;
          const isDowngrade = index < currentPlanIndex;
          const hasDowngradePending = !!pendingDowngradePlan;
          const features = PLAN_FEATURES[plan] ?? [];
          const pricing = PLAN_PRICING[plan as keyof typeof PLAN_PRICING];
          const isPopular = plan === "team";

          return (
            <div
              key={plan}
              className={`relative flex flex-col rounded-xl border-2 p-5 transition-colors ${
                isCurrent
                  ? "border-accent bg-accent/5 dark:bg-accent/10"
                  : isPopular
                    ? "border-accent/30 dark:border-accent/20 bg-white dark:bg-navy-800"
                    : "border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
              }`}
            >
              {/* Popular badge */}
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-accent text-white">
                    {t("popularBadge")}
                  </span>
                </div>
              )}

              {/* Scheduled badge */}
              {isPendingDowngrade && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-blue-500 text-white">
                    {t("scheduledBadge")}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {pricing?.name ?? t("planFree")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t(`planCardDesc_${plan}`)}
                </p>
              </div>

              {/* Price */}
              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {getPrice(plan)}
                  </span>
                  {plan !== "free" && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {getPriceInterval()}
                    </span>
                  )}
                </div>
                {plan !== "free" && billingInterval === "year" && pricing && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {t("billedAnnually", { amount: `${t("currency")}${pricing.yearly}` })}
                  </p>
                )}
              </div>

              {/* CTA button */}
              {isCurrent ? (
                <div className="mb-5">
                  <div className="w-full py-2 text-center text-sm font-medium rounded-lg border-2 border-accent/50 text-accent">
                    {t("currentPlanLabel")}
                  </div>
                </div>
              ) : (
                <div className="mb-5">
                  {plan === "free" ? (
                    <button
                      type="button"
                      onClick={() => setPendingChange({ plan: "free", billingInterval: "month" })}
                      disabled={isChanging || hasDowngradePending}
                      className="w-full py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-navy-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700 disabled:opacity-50 transition-colors"
                    >
                      {isChanging ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t("downgrade")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingChange({ plan, billingInterval })}
                      disabled={isChanging || (isDowngrade && hasDowngradePending)}
                      className={`w-full py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors ${
                        isUpgrade
                          ? "bg-accent text-white hover:bg-accent/90"
                          : "border border-gray-300 dark:border-navy-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700"
                      }`}
                    >
                      {isChanging ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : isUpgrade ? (
                        t("upgrade")
                      ) : (
                        t("downgrade")
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Feature list */}
              <ul className="space-y-2.5 flex-1">
                {features.map((featureKey) => (
                  <li key={featureKey} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {t(featureKey)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Enterprise banner */}
      <a
        href="mailto:sales@bugspark.dev"
        className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border border-gray-200 dark:border-navy-700 rounded-xl bg-white dark:bg-navy-800 hover:border-gray-300 dark:hover:border-navy-600 transition-colors"
      >
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("planEnterprise")}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("enterpriseDesc")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-accent">{t("contactSales")}</span>
          <ArrowUpRight className="w-4 h-4 text-accent" />
        </div>
      </a>

      <ConfirmPlanChangeDialog
        isOpen={pendingChange !== null}
        onClose={() => setPendingChange(null)}
        onConfirm={handleConfirm}
        isLoading={isChanging}
        currentPlan={currentPlan}
        newPlan={pendingChange?.plan ?? ""}
        billingInterval={pendingChange?.billingInterval ?? "month"}
        isUpgrade={pendingIsUpgrade}
      />
    </div>
  );
}
