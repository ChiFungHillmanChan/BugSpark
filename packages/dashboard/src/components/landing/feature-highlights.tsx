"use client";

import { useTranslations } from "next-intl";
import {
  Camera,
  Terminal,
  Globe,
  MonitorPlay,
  Smartphone,
  Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";

interface Feature {
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
}

const FEATURES: Feature[] = [
  {
    titleKey: "featureScreenshot",
    descKey: "featureScreenshotDesc",
    icon: Camera,
  },
  {
    titleKey: "featureConsole",
    descKey: "featureConsoleDesc",
    icon: Terminal,
  },
  {
    titleKey: "featureNetwork",
    descKey: "featureNetworkDesc",
    icon: Globe,
  },
  {
    titleKey: "featureSession",
    descKey: "featureSessionDesc",
    icon: MonitorPlay,
  },
  {
    titleKey: "featureDevice",
    descKey: "featureDeviceDesc",
    icon: Smartphone,
  },
  {
    titleKey: "featureWebhooks",
    descKey: "featureWebhooksDesc",
    icon: Webhook,
  },
];

export function FeatureHighlights() {
  const t = useTranslations("landing");

  return (
    <section id="features" className="py-20 sm:py-28 bg-white dark:bg-navy-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeader pill="Features" title={t("features")} subtitle={t("featuresSubtitle")} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.titleKey}
              className="group p-6 rounded-2xl border border-gray-200 dark:border-white/[0.08] dark:bg-navy-800/50 dark:backdrop-blur-sm hover:border-accent/30 dark:hover:border-white/[0.15] hover:shadow-lg dark:hover:shadow-accent/5 hover:-translate-y-0.5 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                {t(feature.titleKey)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
