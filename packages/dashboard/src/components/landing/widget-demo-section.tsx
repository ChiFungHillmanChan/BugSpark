"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const CosmicBackground = dynamic(
  () =>
    import("@/components/shared/cosmic-background").then((m) => ({
      default: m.CosmicBackground,
    })),
  { ssr: false, loading: () => <div className="absolute inset-0" /> }
);
import { SectionHeader } from "@/components/shared/section-header";
import { DemoStepNarration } from "@/components/landing/demo-step-narration";
import type { StepConfig } from "@/components/landing/demo-step-narration";
import { DemoAnimation } from "@/components/landing/demo-animation";
import { DemoTabSwitcher } from "@/components/landing/demo-tab-switcher";
import type { DemoTab } from "@/components/landing/demo-tab-switcher";
import { DemoBrowserContent } from "@/components/landing/demo-browser-content";
import type { ReportPhase } from "@/components/landing/demo-browser-content";
import { DemoDashboardContent } from "@/components/landing/demo-dashboard-content";
import type { DashboardPhase } from "@/components/landing/demo-dashboard-content";
import { useDemoPhase } from "@/hooks/use-demo-phase";
import type { PhaseConfig } from "@/hooks/use-demo-phase";

const REPORT_PHASES: PhaseConfig<ReportPhase>[] = [
  { phase: "idle", duration: 1500 },
  { phase: "click", duration: 500 },
  { phase: "modal", duration: 1500 },
  { phase: "capture", duration: 1200 },
  { phase: "annotate", duration: 2500 },
  { phase: "fill", duration: 4000 },
  { phase: "submit", duration: 2000 },
  { phase: "toast", duration: 1500 },
  { phase: "reset", duration: 1500 },
];

const DASHBOARD_PHASES: PhaseConfig<DashboardPhase>[] = [
  { phase: "appear", duration: 1500 },
  { phase: "triage", duration: 2500 },
  { phase: "assign", duration: 2000 },
  { phase: "resolve", duration: 2500 },
  { phase: "reset", duration: 1500 },
];

const REPORT_STEPS: StepConfig<ReportPhase>[] = [
  {
    titleKey: "demoStep1Title",
    descKey: "demoStep1Desc",
    activePhases: ["idle", "click"],
  },
  {
    titleKey: "demoStep2Title",
    descKey: "demoStep2Desc",
    activePhases: ["modal", "capture"],
  },
  {
    titleKey: "demoStep3Title",
    descKey: "demoStep3Desc",
    activePhases: ["annotate"],
  },
  {
    titleKey: "demoStep4Title",
    descKey: "demoStep4Desc",
    activePhases: ["fill", "submit"],
  },
  {
    titleKey: "demoStep5Title",
    descKey: "demoStep5Desc",
    activePhases: ["toast", "reset"],
  },
];

const DASHBOARD_STEPS: StepConfig<DashboardPhase>[] = [
  {
    titleKey: "demoDashStep1Title",
    descKey: "demoDashStep1Desc",
    activePhases: ["appear"],
  },
  {
    titleKey: "demoDashStep2Title",
    descKey: "demoDashStep2Desc",
    activePhases: ["triage"],
  },
  {
    titleKey: "demoDashStep3Title",
    descKey: "demoDashStep3Desc",
    activePhases: ["assign"],
  },
  {
    titleKey: "demoDashStep4Title",
    descKey: "demoDashStep4Desc",
    activePhases: ["resolve", "reset"],
  },
];

function ReportDemo() {
  const phase = useDemoPhase({
    phases: REPORT_PHASES,
    reducedMotionFreezeIndex: 5,
  });

  return (
    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      <DemoStepNarration
        phase={phase}
        steps={REPORT_STEPS}
        className="order-2 lg:order-1"
      />
      <DemoAnimation variant="browser" className="order-1 lg:order-2">
        <DemoBrowserContent phase={phase} />
      </DemoAnimation>
    </div>
  );
}

function DashboardDemo() {
  const phase = useDemoPhase({
    phases: DASHBOARD_PHASES,
    reducedMotionFreezeIndex: 3,
  });

  return (
    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      <DemoStepNarration
        phase={phase}
        steps={DASHBOARD_STEPS}
        className="order-2 lg:order-1"
      />
      <DemoAnimation variant="dashboard" className="order-1 lg:order-2">
        <DemoDashboardContent phase={phase} />
      </DemoAnimation>
    </div>
  );
}

export function WidgetDemoSection() {
  const t = useTranslations("landing");
  const [activeTab, setActiveTab] = useState<DemoTab>("report");

  return (
    <section className="py-20 sm:py-28 bg-gray-50 dark:bg-navy-950 relative cv-auto">
      <CosmicBackground variant="top-only" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeader
          pill={t("demoPill")}
          title={t("demoTitle")}
          subtitle={t("demoSubtitle")}
        />

        <DemoTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Key forces remount on tab switch, resetting animation */}
        {activeTab === "report" ? (
          <ReportDemo key="report" />
        ) : (
          <DashboardDemo key="track" />
        )}
      </div>
    </section>
  );
}
