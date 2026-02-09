"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { PricingCardGrid } from "./pricing-card-grid";
import { PricingComparison } from "./pricing-comparison";

export function PricingSection() {
  const t = useTranslations("landing");

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {t("pricingTitle")}
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            {t("pricingSubtitle")}
          </p>
        </div>

        <PricingCardGrid />

        <div className="mt-12 rounded-xl border border-gray-200 bg-white p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900">
            {t("pricingEnterpriseName")}
          </h3>
          <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">
            {t("pricingEnterpriseDesc")}
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <li>{t("pricingEnterpriseFeature1")}</li>
            <li>{t("pricingEnterpriseFeature2")}</li>
            <li>{t("pricingEnterpriseFeature3")}</li>
            <li>{t("pricingEnterpriseFeature4")}</li>
          </ul>
          <Link
            href="mailto:sales@bugspark.dev"
            className="mt-6 inline-block rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {t("pricingEnterpriseCta")}
          </Link>
        </div>

        <PricingComparison />
      </div>
    </section>
  );
}
