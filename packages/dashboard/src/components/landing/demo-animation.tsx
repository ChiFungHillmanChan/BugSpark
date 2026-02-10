"use client";

import { useTranslations } from "next-intl";
import { DemoBrowserContent } from "@/components/landing/demo-browser-content";

type DemoPhase = "idle" | "click" | "modal" | "fill" | "submit" | "toast" | "reset";

interface DemoAnimationProps {
  phase: DemoPhase;
}

export function DemoAnimation({ phase }: DemoAnimationProps) {
  const t = useTranslations("landing");

  return (
    <div
      role="img"
      aria-label={t("demoTitle")}
      className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/[0.08]"
    >
      {/* Browser chrome */}
      <div className="bg-gray-100 dark:bg-navy-800 border-b border-gray-200 dark:border-navy-700 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white dark:bg-navy-900 rounded-md px-2 sm:px-3 py-1 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-mono">
          https://your-app.com
        </div>
      </div>

      {/* Animated browser content */}
      <DemoBrowserContent phase={phase} />
    </div>
  );
}
