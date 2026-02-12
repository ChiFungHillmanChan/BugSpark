"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Heart,
  Shield,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { CosmicBackground } from "@/components/shared/cosmic-background";
import { ShootingStars } from "@/components/landing/shooting-stars";

const VALUES = [
  { titleKey: "valueOpenSource", descKey: "valueOpenSourceDesc", icon: Code2 },
  { titleKey: "valueDx", descKey: "valueDxDesc", icon: Heart },
  { titleKey: "valuePrivacy", descKey: "valuePrivacyDesc", icon: Shield },
  { titleKey: "valueSimplicity", descKey: "valueSimplicityDesc", icon: Sparkles },
] as const;

const TECH_STACK = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Prisma",
  "Node.js",
  "next-intl",
  "Lucide Icons",
];

export default function AboutContent() {
  const t = useTranslations("aboutPage");
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

      {/* Mission & Story */}
      <section className="py-20 sm:py-28 bg-white dark:bg-navy-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="space-y-16">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t("missionTitle")}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-lg">
                {t("missionDesc")}
              </p>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t("storyTitle")}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-lg">
                {t("storyDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 sm:py-28 bg-gray-50 dark:bg-navy-950/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {t("valuesTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {VALUES.map((value) => (
              <div
                key={value.titleKey}
                className="p-6 rounded-2xl border border-gray-200 dark:border-white/[0.08] dark:bg-navy-800/50 hover:border-accent/30 dark:hover:border-white/[0.15] hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4">
                  <value.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {t(value.titleKey)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t(value.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer */}
      <section className="py-20 sm:py-28 bg-white dark:bg-navy-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {t("teamTitle")}
          </h2>
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-cosmic-purple flex items-center justify-center text-3xl font-bold text-white mb-6">
              HC
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("developerName")}
            </h3>
            <p className="text-sm text-accent font-medium mt-1">
              {t("developerRole")}
            </p>
            <p className="mt-4 text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg">
              {t("developerBio")}
            </p>
            <a
              href="https://hillmanchan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              {t("developerWebsite")}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-navy-950/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t("techTitle")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {t("techDesc")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {TECH_STACK.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-navy-800/50 border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-navy-900 dark:bg-navy-950 dark:cosmic-bg relative overflow-hidden text-white">
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
              href="/register/beta"
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
