"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Camera,
  Terminal,
  Globe,
  MonitorPlay,
  Smartphone,
  Webhook,
  Sparkles,
  Palette,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CosmicBackground } from "@/components/shared/cosmic-background";
import { ShootingStars } from "@/components/landing/shooting-stars";

interface FeatureDetail {
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
}

const FEATURES: FeatureDetail[] = [
  { titleKey: "screenshotTitle", descKey: "screenshotDesc", icon: Camera },
  { titleKey: "consoleTitle", descKey: "consoleDesc", icon: Terminal },
  { titleKey: "networkTitle", descKey: "networkDesc", icon: Globe },
  { titleKey: "sessionTitle", descKey: "sessionDesc", icon: MonitorPlay },
  { titleKey: "deviceTitle", descKey: "deviceDesc", icon: Smartphone },
  { titleKey: "webhooksTitle", descKey: "webhooksDesc", icon: Webhook },
  { titleKey: "aiTitle", descKey: "aiDesc", icon: Sparkles },
  { titleKey: "brandingTitle", descKey: "brandingDesc", icon: Palette },
];

export default function FeaturesContent() {
  const t = useTranslations("featuresPage");
  const tLanding = useTranslations("landing");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 to-navy-800 dark:from-navy-950 dark:to-navy-900 dark:cosmic-bg text-white">
        <CosmicBackground variant="full" />
        <ShootingStars />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
          <span className="section-pill mb-4">Features</span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] dark:gradient-text mt-4">
            {t("title")}
          </h1>
          <p className="mt-6 text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-20 sm:py-28 bg-white dark:bg-navy-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.titleKey}
                className="group relative p-8 rounded-2xl border border-gray-200 dark:border-white/[0.08] dark:bg-navy-800/50 dark:backdrop-blur-sm hover:border-accent/30 dark:hover:border-white/[0.15] hover:shadow-lg dark:hover:shadow-accent/5 hover:-translate-y-0.5 transition-all"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-5 group-hover:from-accent/30 group-hover:to-accent/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-navy-900 dark:bg-navy-950 dark:cosmic-bg relative overflow-hidden text-white">
        <CosmicBackground variant="full" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold dark:gradient-text">
            {t("ctaTitle")}
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
            {t("ctaSubtitle")}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register/beta"
              className="inline-flex items-center gap-2 px-10 py-4 gradient-btn rounded-full text-sm font-medium transition-all group"
            >
              {tLanding("getStarted")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 hover:text-white rounded-full text-sm font-medium transition-all"
            >
              {tLanding("pricing")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
