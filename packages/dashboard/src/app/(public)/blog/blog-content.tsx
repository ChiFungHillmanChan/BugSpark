"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { CosmicBackground } from "@/components/shared/cosmic-background";
import { ShootingStars } from "@/components/landing/shooting-stars";

interface Post {
  titleKey: string;
  excerptKey: string;
  dateKey: string;
  tagKey: string;
  readTime: number;
}

const POSTS: Post[] = [
  {
    titleKey: "post1Title",
    excerptKey: "post1Excerpt",
    dateKey: "post1Date",
    tagKey: "post1Tag",
    readTime: 4,
  },
  {
    titleKey: "post2Title",
    excerptKey: "post2Excerpt",
    dateKey: "post2Date",
    tagKey: "post2Tag",
    readTime: 3,
  },
  {
    titleKey: "post3Title",
    excerptKey: "post3Excerpt",
    dateKey: "post3Date",
    tagKey: "post3Tag",
    readTime: 5,
  },
];

const TAG_STYLES: Record<string, string> = {
  tagGuide: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  tagUpdate: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  tagTip: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

export default function BlogContent() {
  const t = useTranslations("blogPage");
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

      {/* Post grid */}
      <section className="py-20 sm:py-28 bg-white dark:bg-navy-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {POSTS.map((post) => {
              const tagId = t(post.tagKey);
              return (
                <article
                  key={post.titleKey}
                  className="group rounded-2xl border border-gray-200 dark:border-white/[0.08] dark:bg-navy-800/50 overflow-hidden hover:border-accent/30 dark:hover:border-white/[0.15] hover:shadow-lg transition-all"
                >
                  <div className="p-6 sm:p-8 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TAG_STYLES[tagId] ?? ""}`}
                      >
                        {t(tagId)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {t(post.dateKey)}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-accent transition-colors">
                      {t(post.titleKey)}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
                      {t(post.excerptKey)}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {post.readTime} {t("minRead")}
                      </span>
                      <span className="text-sm font-medium text-accent group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                        {t("readMore")}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
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
