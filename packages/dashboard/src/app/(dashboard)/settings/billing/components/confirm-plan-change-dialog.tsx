"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, Loader2, TrendingUp, TrendingDown } from "lucide-react";

const PLAN_PRICING: Record<string, { monthly: number; yearly: number; name: string }> = {
  starter: { monthly: 199, yearly: 1990, name: "Starter" },
  team: { monthly: 799, yearly: 7990, name: "Team" },
};

interface ConfirmPlanChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  currentPlan: string;
  newPlan: string;
  billingInterval: string;
  isUpgrade: boolean;
}

function getPlanDisplayName(plan: string, t: ReturnType<typeof useTranslations>): string {
  const pricing = PLAN_PRICING[plan];
  if (pricing) return pricing.name;
  if (plan === "free") return t("planFree");
  return t("planEnterprise");
}

function getPlanPrice(plan: string, interval: string, currency: string): string {
  if (plan === "free") return `${currency}0`;
  const pricing = PLAN_PRICING[plan];
  if (!pricing) return "--";
  const amount = interval === "year" ? pricing.yearly : pricing.monthly;
  return `${currency}${amount}`;
}

export function ConfirmPlanChangeDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  currentPlan,
  newPlan,
  billingInterval,
  isUpgrade,
}: ConfirmPlanChangeDialogProps) {
  const t = useTranslations("billing");

  if (!isOpen) return null;

  const currency = t("currency");
  const intervalLabel = billingInterval === "year" ? t("perYear") : t("perMonth");
  const currentPrice = getPlanPrice(currentPlan, billingInterval, currency);
  const newPrice = getPlanPrice(newPlan, billingInterval, currency);
  const Icon = isUpgrade ? TrendingUp : TrendingDown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />
      <div className="relative bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isUpgrade
              ? "bg-accent/10"
              : "bg-amber-100 dark:bg-amber-900/30"
          }`}>
            <Icon className={`w-5 h-5 ${
              isUpgrade ? "text-accent" : "text-amber-600 dark:text-amber-400"
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("confirmPlanChange")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isUpgrade ? t("upgradeSubtitle") : t("downgradeSubtitle")}
            </p>
          </div>
        </div>

        {/* Plan comparison cards */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-5">
          {/* Current plan mini card */}
          <div className="flex-1 rounded-lg border border-gray-200 dark:border-navy-700 p-4 bg-gray-50 dark:bg-navy-900/50">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
              {t("dialogCurrentPlan")}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {getPlanDisplayName(currentPlan, t)}
            </p>
            <p className="text-lg font-bold text-gray-600 dark:text-gray-400 mt-1">
              {currentPrice}
              <span className="text-xs font-normal ml-0.5">{intervalLabel}</span>
            </p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center sm:justify-start">
            <ArrowRight className="w-5 h-5 text-gray-400 rotate-90 sm:rotate-0" />
          </div>

          {/* New plan mini card */}
          <div className={`flex-1 rounded-lg border-2 p-4 ${
            isUpgrade
              ? "border-accent/50 bg-accent/5 dark:bg-accent/10"
              : "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
          }`}>
            <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${
              isUpgrade ? "text-accent" : "text-amber-600 dark:text-amber-400"
            }`}>
              {t("dialogNewPlan")}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {getPlanDisplayName(newPlan, t)}
            </p>
            <p className={`text-lg font-bold mt-1 ${
              isUpgrade ? "text-accent" : "text-amber-600 dark:text-amber-400"
            }`}>
              {newPrice}
              <span className="text-xs font-normal ml-0.5">{intervalLabel}</span>
            </p>
          </div>
        </div>

        {/* Info note */}
        <div className={`rounded-lg p-3 mb-5 text-sm ${
          isUpgrade
            ? "bg-accent/5 dark:bg-accent/10 text-accent/80 dark:text-accent/70"
            : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
        }`}>
          {isUpgrade ? t("proratedUpgradeNote") : t("deferredDowngradeNote")}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
          >
            {t("cancelChange")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2 ${
              isUpgrade
                ? "bg-accent hover:bg-accent/90"
                : "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isUpgrade ? t("confirmUpgrade") : t("confirmDowngrade")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
