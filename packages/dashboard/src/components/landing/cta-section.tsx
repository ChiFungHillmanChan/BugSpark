"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { CosmicBackground } from "@/components/shared/cosmic-background";

export function CtaSection() {
  const t = useTranslations("landing");

  return (
    <section className="py-20 sm:py-28 bg-navy-900 dark:bg-navy-950 dark:cosmic-bg relative overflow-hidden text-white cv-auto">
      <CosmicBackground variant="full" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <h2 className="text-4xl sm:text-5xl font-bold dark:gradient-text">{t("cta")}</h2>
        <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
          {t("ctaSubtitle")}
        </p>
        <div className="mt-10">
          <Link
            href="/register/beta"
            className="inline-flex items-center gap-2 px-10 py-4 gradient-btn rounded-full text-sm font-medium transition-all group"
          >
            {t("ctaButton")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
