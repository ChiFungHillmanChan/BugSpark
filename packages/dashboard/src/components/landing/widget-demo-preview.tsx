"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bug, X, Camera, Send } from "lucide-react";
import { CosmicBackground } from "@/components/shared/cosmic-background";
import { SectionHeader } from "@/components/shared/section-header";

export function WidgetDemoPreview() {
  const t = useTranslations("landing");
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  return (
    <section className="py-20 sm:py-28 bg-gray-50 dark:bg-navy-950 relative">
      <CosmicBackground variant="top-only" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeader pill="Demo" title={t("widgetDemo")} subtitle={t("widgetDemoSubtitle")} />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Browser mockup */}
          <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/[0.08]">
            {/* Browser chrome */}
            <div className="bg-gray-100 dark:bg-navy-800 border-b border-gray-200 dark:border-navy-700 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white dark:bg-navy-900 rounded-md px-3 py-1 text-xs text-gray-400 dark:text-gray-500 font-mono">
                https://your-app.com
              </div>
            </div>

            {/* Browser content */}
            <div className="relative bg-white dark:bg-navy-900 h-80 sm:h-96">
              {/* Simulated page content */}
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-100 dark:bg-navy-800 rounded w-48" />
                <div className="h-4 bg-gray-50 dark:bg-navy-800/50 rounded w-full" />
                <div className="h-4 bg-gray-50 dark:bg-navy-800/50 rounded w-5/6" />
                <div className="h-4 bg-gray-50 dark:bg-navy-800/50 rounded w-4/6" />
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="h-24 bg-gray-50 dark:bg-navy-800/50 rounded-lg" />
                  <div className="h-24 bg-gray-50 dark:bg-navy-800/50 rounded-lg" />
                  <div className="h-24 bg-gray-50 dark:bg-navy-800/50 rounded-lg" />
                </div>
              </div>

              {/* Widget modal */}
              {isWidgetOpen && (
                <div className="absolute bottom-16 right-4 w-72 bg-white dark:bg-navy-800 rounded-xl shadow-2xl border border-gray-200 dark:border-white/[0.08] overflow-hidden">
                  <div className="bg-accent px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      {t("widgetReportBug")}
                    </span>
                    <button
                      onClick={() => setIsWidgetOpen(false)}
                      className="text-white/80 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {t("widgetTitle")}
                      </label>
                      <div className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-white/[0.08] rounded text-xs text-gray-400 dark:text-gray-500">
                        {t("widgetTitlePlaceholder")}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {t("widgetDescription")}
                      </label>
                      <div className="w-full px-2.5 py-3 border border-gray-200 dark:border-white/[0.08] rounded text-xs text-gray-400 dark:text-gray-500">
                        {t("widgetDescPlaceholder")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded text-xs text-gray-500 hover:bg-gray-50">
                        <Camera className="w-3 h-3" />
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded text-xs font-medium">
                        <Send className="w-3 h-3" />
                        {t("widgetSubmit")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating widget button */}
              <button
                onClick={() => setIsWidgetOpen(!isWidgetOpen)}
                className="absolute bottom-4 right-4 w-12 h-12 bg-accent hover:bg-accent-hover rounded-full shadow-lg shadow-[0_0_20px_var(--color-accent-glow)] flex items-center justify-center transition-transform hover:scale-105"
              >
                <Bug className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
