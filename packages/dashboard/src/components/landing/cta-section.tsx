"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  const t = useTranslations("landing");

  return (
    <section className="py-20 sm:py-28 bg-navy-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">{t("cta")}</h2>
        <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
          {t("ctaSubtitle")}
        </p>
        <div className="mt-10">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t("ctaButton")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
