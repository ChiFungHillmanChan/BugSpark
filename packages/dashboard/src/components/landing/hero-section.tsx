"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ArrowRight, BookOpen } from "lucide-react";

const CosmicBackground = dynamic(
  () =>
    import("@/components/shared/cosmic-background").then((m) => ({
      default: m.CosmicBackground,
    })),
  { ssr: false }
);
const ShootingStars = dynamic(
  () =>
    import("./shooting-stars").then((m) => ({
      default: m.ShootingStars,
    })),
  { ssr: false }
);

export function HeroSection() {
  const t = useTranslations("landing");

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 to-navy-800 dark:from-navy-950 dark:to-navy-900 dark:cosmic-bg text-white">
      <CosmicBackground variant="full" />
      <ShootingStars />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-32 sm:py-40 lg:py-52">
        <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] dark:gradient-text">
            {t("hero")}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
            {t("heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register/beta"
              className="inline-flex items-center gap-2 px-8 py-3.5 gradient-btn rounded-full text-sm font-medium transition-all"
            >
              {t("getStarted")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-gray-600 dark:border-white/[0.12] dark:bg-white/[0.06] hover:border-gray-400 text-gray-300 hover:text-white rounded-full text-sm font-medium transition-all"
            >
              <BookOpen className="w-4 h-4" />
              {t("viewDocs")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
