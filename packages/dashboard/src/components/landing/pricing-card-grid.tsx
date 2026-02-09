"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import Link from "next/link";
import { PRICING_TIERS } from "./pricing-data";
import type { PricingTier } from "./pricing-data";

function PricingCard({ tier }: { tier: PricingTier }) {
  const t = useTranslations("landing");

  return (
    <div
      className={`relative flex flex-col p-6 rounded-xl border ${
        tier.isPopular
          ? "border-accent shadow-lg ring-2 ring-accent/20"
          : "border-gray-200 hover:border-accent/30 hover:shadow-lg"
      } bg-white transition-all`}
    >
      {tier.isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-white">
          {t("pricingPopular")}
        </span>
      )}

      <h3 className="text-lg font-semibold text-gray-900">
        {t(tier.nameKey)}
      </h3>
      <p className="mt-1 text-sm text-gray-500">{t(tier.descriptionKey)}</p>

      <div className="mt-6 mb-6">
        {tier.monthlyPriceHkd !== null ? (
          <>
            <span className="text-4xl font-bold text-gray-900">
              {t(tier.currencyKey)}{tier.monthlyPriceHkd}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              {t("pricingPerMonth")}
            </span>
          </>
        ) : (
          <span className="text-4xl font-bold text-gray-900">
            {t("pricingFreeLabel")}
          </span>
        )}
      </div>

      <Link
        href={tier.ctaHref}
        className={`block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
          tier.isPopular
            ? "bg-accent text-white hover:bg-accent/90"
            : "bg-gray-900 text-white hover:bg-gray-800"
        }`}
      >
        {t(tier.ctaKey)}
      </Link>

      <ul className="mt-6 space-y-3 flex-1">
        {tier.highlightKeys.map((key) => (
          <li key={key} className="flex items-start gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <span>{t(key)}</span>
          </li>
        ))}
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
