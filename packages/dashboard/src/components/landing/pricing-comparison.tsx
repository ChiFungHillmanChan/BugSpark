"use client";

import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { COMPARISON_FEATURES, PRICING_TIERS } from "./pricing-data";

function CellValue({
  value,
  t,
}: {
  value: string | boolean;
  t: (key: string) => string;
}) {
  if (value === true) {
    return <Check className="w-4 h-4 text-accent mx-auto" />;
  }
  if (value === false) {
    return <X className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto" />;
  }
  return <span>{t(value)}</span>;
}

export function PricingComparison() {
  const t = useTranslations("landing");

  return (
    <div className="mt-16">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
        {t("pricingCompareTitle")}
      </h3>

      <div className="overflow-x-auto dark:glass-card dark:overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/[0.06]">
              <th className="py-3 px-4 text-left font-semibold text-gray-900 dark:text-white">
                {t("pricingFeature")}
              </th>
              {PRICING_TIERS.map((tier) => (
                <th
                  key={tier.id}
                  className="py-3 px-4 text-center font-semibold text-gray-900 dark:text-white"
                >
                  {t(tier.nameKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_FEATURES.map((feature) => (
              <tr
                key={feature.labelKey}
                className="border-b border-gray-100 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {t(feature.labelKey)}
                </td>
                {PRICING_TIERS.map((tier) => (
                  <td
                    key={tier.id}
                    className="py-3 px-4 text-center text-gray-600 dark:text-gray-400"
                  >
                    <CellValue value={feature.values[tier.id]} t={t} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
