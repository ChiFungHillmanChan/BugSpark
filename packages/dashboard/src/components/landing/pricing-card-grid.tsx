"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import Link from "next/link";
import { PRICING_TIERS } from "./pricing-data";
import type { PricingTier, HighlightItem } from "./pricing-data";

function PricingCard({ tier }: { tier: PricingTier }) {
  const t = useTranslations("landing");

  return (
    <div
      className={`relative flex flex-col p-6 rounded-xl border [will-change:transform] ${
        tier.isPopular
          ? "border-accent dark:border-accent/30 shadow-lg dark:shadow-accent/10 ring-2 ring-accent/20"
          : "border-gray-200 dark:border-white/[0.08] hover:border-accent/30 dark:hover:border-white/[0.15] hover:shadow-lg"
      } bg-white dark:bg-navy-800/50 dark:backdrop-blur-sm transition-all`}
    >
      {tier.isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-white">
          {t("pricingPopular")}
        </span>
      )}

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {t(tier.nameKey)}
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t(tier.descriptionKey)}</p>

      <div className="mt-6 mb-6">
        {tier.monthlyPriceHkd !== null ? (
          <>
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {t(tier.currencyKey)}{tier.monthlyPriceHkd}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              {t("pricingPerMonth")}
            </span>
          </>
        ) : (
          <span className="text-4xl font-bold text-gray-900 dark:text-white">
            {t("pricingFreeLabel")}
          </span>
        )}
      </div>

      <Link
        href={tier.ctaHref}
        className={`block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${
          tier.isPopular
            ? "bg-accent text-white hover:bg-accent/90 dark:gradient-btn dark:rounded-full"
            : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white/[0.06] dark:border dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.1]"
        }`}
      >
        {t(tier.ctaKey)}
      </Link>

      <ul className="mt-6 space-y-3 flex-1">
        {tier.highlightKeys.map((item: HighlightItem) => {
          const key = typeof item === "string" ? item : item.key;
          const isComingSoon = typeof item === "string" ? false : item.comingSoon;
          return (
            <li key={key} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <span>
                {t(key)}
                {isComingSoon && (
                  <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {t("comingSoon")}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PricingCardGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
      {PRICING_TIERS.map((tier) => (
        <PricingCard key={tier.id} tier={tier} />
      ))}
    </div>
  );
}
