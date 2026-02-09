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
    <section id="features" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {t("features")}
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            {t("featuresSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.titleKey}
              className="group p-6 rounded-xl border border-gray-200 hover:border-accent/30 hover:shadow-lg transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                {t(feature.titleKey)}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
