"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type DemoTab = "report" | "track";

interface DemoTabSwitcherProps {
  activeTab: DemoTab;
  onTabChange: (tab: DemoTab) => void;
}

export function DemoTabSwitcher({ activeTab, onTabChange }: DemoTabSwitcherProps) {
  const t = useTranslations("landing");

  const tabs: { key: DemoTab; label: string }[] = [
    { key: "report", label: t("demoTabReport") },
    { key: "track", label: t("demoTabTrack") },
  ];

  return (
    <div className="flex justify-center gap-2 mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === tab.key
              ? "bg-accent text-white"
              : "bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-navy-700",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
