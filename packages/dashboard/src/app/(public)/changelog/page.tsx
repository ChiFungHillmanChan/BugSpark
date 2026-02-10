"use client";

import { useTranslations } from "next-intl";
import { CosmicBackground } from "@/components/shared/cosmic-background";
import { ShootingStars } from "@/components/landing/shooting-stars";

interface Release {
  versionKey: string;
  dateKey: string;
  titleKey: string;
  descKey: string;
  tag: "tagNew" | "tagImproved" | "tagFixed";
}

const RELEASES: Release[] = [
  {
    versionKey: "v030",
    dateKey: "v030Date",
    titleKey: "v030Title",
    descKey: "v030Desc",
    tag: "tagNew",
  },
  {
    versionKey: "v020",
    dateKey: "v020Date",
    titleKey: "v020Title",
    descKey: "v020Desc",
    tag: "tagNew",
  },
  {
    versionKey: "v010",
    dateKey: "v010Date",
    titleKey: "v010Title",
    descKey: "v010Desc",
    tag: "tagNew",
  },
];

const TAG_STYLES: Record<string, string> = {
  tagNew: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  tagImproved: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  tagFixed: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

export default function ChangelogPage() {
  const t = useTranslations("changelogPage");

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

      {/* Timeline */}
      <section className="py-20 sm:py-28 bg-white dark:bg-navy-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-gray-200 dark:bg-white/[0.08]" />

            <div className="space-y-12">
              {RELEASES.map((release) => (
                <div key={release.versionKey} className="relative pl-12 sm:pl-16">
                  {/* Dot on timeline */}
                  <div className="absolute left-2.5 sm:left-4.5 top-1.5 w-3 h-3 rounded-full bg-accent ring-4 ring-white dark:ring-navy-950" />

                  <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] dark:bg-navy-800/50 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        {t(release.versionKey)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TAG_STYLES[release.tag]}`}
                      >
                        {t(release.tag)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {t(release.dateKey)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t(release.titleKey)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {t(release.descKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
