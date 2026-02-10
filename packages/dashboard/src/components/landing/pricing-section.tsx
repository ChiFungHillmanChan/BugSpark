"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { PricingCardGrid } from "./pricing-card-grid";
import { PricingComparison } from "./pricing-comparison";
import { ENTERPRISE_FEATURE_KEYS } from "./pricing-data";
import { CosmicBackground } from "@/components/shared/cosmic-background";
import { SectionHeader } from "@/components/shared/section-header";

export function PricingSection() {
  const t = useTranslations("landing");

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-gray-50 dark:bg-navy-950 relative">
      <CosmicBackground variant="top-only" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <SectionHeader pill="Pricing" title={t("pricingTitle")} subtitle={t("pricingSubtitle")} />

        <PricingCardGrid />

        <div className="mt-12 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:glass-card p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("pricingEnterpriseName")}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            {t("pricingEnterpriseDesc")}
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
            {ENTERPRISE_FEATURE_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
          <Link
            href="mailto:sales@bugspark.dev"
            className="mt-6 inline-block rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors dark:gradient-btn dark:rounded-full dark:border-0"
          >
            {t("pricingEnterpriseCta")}
          </Link>
        </div>

        <PricingComparison />
      </div>
    </section>
  );
}
