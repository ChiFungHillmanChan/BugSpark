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

        <div className="mt-12 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-navy-800/80 dark:via-navy-900/60 dark:to-navy-800/80 dark:glass-card p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.1),transparent_50%)]" />
          <div className="relative z-10">
            <h3 className="text-xl font-semibold text-white">
              {t("pricingEnterpriseName")}
            </h3>
            <p className="mt-2 text-sm text-gray-300 dark:text-gray-400 max-w-xl mx-auto">
              {t("pricingEnterpriseDesc")}
            </p>
            <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-300 dark:text-gray-400">
              {ENTERPRISE_FEATURE_KEYS.map((key) => (
                <li key={key} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/70" />
                  {t(key)}
                </li>
              ))}
            </ul>
            <Link
              href="mailto:sales@bugspark.dev"
              className="mt-6 inline-block rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-all dark:gradient-btn dark:border-0"
            >
              {t("pricingEnterpriseCta")}
            </Link>
          </div>
        </div>

        <PricingComparison />
      </div>
    </section>
  );
}
