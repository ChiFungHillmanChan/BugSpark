"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/shared/section-header";
import {
  LANDING_SCRIPT_TAG,
  LANDING_NPM_INIT,
  LANDING_VUE_INIT,
} from "@/lib/doc-snippets";

const CODE_EXAMPLES = {
  script: LANDING_SCRIPT_TAG,
  npm: LANDING_NPM_INIT,
  vue: LANDING_VUE_INIT,
};

type Tab = "script" | "npm" | "vue";

export function IntegrationExamples() {
  const t = useTranslations("landing");
  const [activeTab, setActiveTab] = useState<Tab>("script");

  const tabs: { key: Tab; label: string }[] = [
    { key: "script", label: t("integrationScript") },
    { key: "npm", label: t("integrationNpm") },
    { key: "vue", label: t("integrationVue") },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-navy-950 cv-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeader title={t("integration")} subtitle={t("integrationSubtitle")} />

        <div className="max-w-2xl mx-auto">
          <div className="flex gap-1 mb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2 rounded-t-lg text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-navy-900 text-white"
                    : "bg-gray-100 dark:bg-navy-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-navy-700",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="bg-navy-900 rounded-b-xl rounded-tr-xl p-6 overflow-x-auto dark:border dark:border-white/[0.08]">
            <pre className="text-sm text-gray-300 font-mono leading-relaxed">
              <code>{CODE_EXAMPLES[activeTab]}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
