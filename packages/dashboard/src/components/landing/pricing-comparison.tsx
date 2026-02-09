"use client";

import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { COMPARISON_FEATURES, PRICING_TIERS } from "./pricing-data";

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="w-4 h-4 text-accent mx-auto" />;
  }
  if (value === false) {
    return <X className="w-4 h-4 text-gray-300 mx-auto" />;
  }
  return <span>{value}</span>;
}

export function PricingComparison() {
  const t = useTranslations("landing");

  return (
    <div className="mt-16">
      <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
        {t("pricingCompareTitle")}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 text-left font-semibold text-gray-900">
                {t("pricingFeature")}
              </th>
              {PRICING_TIERS.map((tier) => (
                <th
                  key={tier.id}
                  className="py-3 px-4 text-center font-semibold text-gray-900"
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
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4 text-gray-600">
                  {t(feature.labelKey)}
                </td>
                <td className="py-3 px-4 text-center text-gray-600">
                  <CellValue value={feature.free} />
                </td>
                <td className="py-3 px-4 text-center text-gray-600">
                  <CellValue value={feature.starter} />
                </td>
                <td className="py-3 px-4 text-center text-gray-600">
                  <CellValue value={feature.team} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
