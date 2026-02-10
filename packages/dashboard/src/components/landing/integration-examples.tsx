"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/shared/section-header";

const CODE_EXAMPLES = {
  script: `<script
  src="https://cdn.bugspark.dev/widget.js"
  data-project="YOUR_PROJECT_KEY"
  data-position="bottom-right"
  async
></script>`,
  npm: `import { BugSpark } from '@bugspark/widget';

BugSpark.init({
  projectKey: 'YOUR_PROJECT_KEY',
  position: 'bottom-right',
  // Optional: customize theme
  theme: { accent: '#e94560' },
});`,
  vue: `<script setup>
import { onMounted } from 'vue';
import { BugSpark } from '@bugspark/widget';

onMounted(() => {
  BugSpark.init({
    projectKey: 'YOUR_PROJECT_KEY',
    position: 'bottom-right',
  });
});
</script>`,
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
    <section className="py-20 sm:py-28 bg-white dark:bg-navy-950">
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
