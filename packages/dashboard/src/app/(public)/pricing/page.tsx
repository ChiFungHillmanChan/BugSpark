"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PricingCardGrid } from "@/components/landing/pricing-card-grid";
import { PricingComparison } from "@/components/landing/pricing-comparison";
import { ENTERPRISE_FEATURE_KEYS } from "@/components/landing/pricing-data";
import { CosmicBackground } from "@/components/shared/cosmic-background";
import { ShootingStars } from "@/components/landing/shooting-stars";

const FAQ_KEYS = ["faqQ1", "faqQ2", "faqQ3", "faqQ4", "faqQ5"] as const;

export default function PricingPage() {
  const t = useTranslations("pricingPage");
  const tLanding = useTranslations("landing");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 to-navy-800 dark:from-navy-950 dark:to-navy-900 dark:cosmic-bg text-white">
        <CosmicBackground variant="full" />
        <ShootingStars />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] dark:gradient-text">
            {t("title")}
          </h1>
          <p className="mt-6 text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-20 sm:py-28 bg-gray-50 dark:bg-navy-950 relative">
        <CosmicBackground variant="top-only" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <PricingCardGrid />

          {/* Enterprise block */}
          <div className="mt-12 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-navy-800/80 dark:via-navy-900/60 dark:to-navy-800/80 dark:glass-card p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.1),transparent_50%)]" />
            <div className="relative z-10">
              <h3 className="text-xl font-semibold text-white">
                {tLanding("pricingEnterpriseName")}
              </h3>
              <p className="mt-2 text-sm text-gray-300 dark:text-gray-400 max-w-xl mx-auto">
                {tLanding("pricingEnterpriseDesc")}
              </p>
              <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-300 dark:text-gray-400">
                {ENTERPRISE_FEATURE_KEYS.map((item) => (
                  <li key={item.key} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/70" />
                    {tLanding(item.key)}
                    {item.comingSoon && (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {tLanding("comingSoon")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <Link
                href="mailto:sales@bugspark.dev"
                className="mt-6 inline-block rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-all dark:gradient-btn dark:border-0"
              >
                {tLanding("pricingEnterpriseCta")}
              </Link>
            </div>
          </div>

          <PricingComparison />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 bg-white dark:bg-navy-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {t("faqTitle")}
          </h2>
          <div className="space-y-6">
            {FAQ_KEYS.map((qKey) => {
              const aKey = qKey.replace("Q", "A") as `faqA${1 | 2 | 3 | 4 | 5}`;
              return (
                <div
                  key={qKey}
                  className="rounded-xl border border-gray-200 dark:border-white/[0.08] dark:bg-navy-800/50 p-6"
                >
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {t(qKey)}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {t(aKey)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-navy-900 dark:bg-navy-950 dark:cosmic-bg relative overflow-hidden text-white">
        <CosmicBackground variant="full" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold dark:gradient-text">
            {tLanding("cta")}
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
            {tLanding("ctaSubtitle")}
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-4 gradient-btn rounded-full text-sm font-medium transition-all group"
            >
              {tLanding("ctaButton")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
