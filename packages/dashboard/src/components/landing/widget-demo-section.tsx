"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CosmicBackground } from "@/components/shared/cosmic-background";
import { SectionHeader } from "@/components/shared/section-header";
import { DemoStepNarration } from "@/components/landing/demo-step-narration";
import { DemoAnimation } from "@/components/landing/demo-animation";

type DemoPhase = "idle" | "click" | "modal" | "fill" | "submit" | "toast" | "reset";

interface PhaseConfig {
  phase: DemoPhase;
  duration: number;
}

const PHASE_SEQUENCE: PhaseConfig[] = [
  { phase: "idle", duration: 1500 },
  { phase: "click", duration: 500 },
  { phase: "modal", duration: 1000 },
  { phase: "fill", duration: 4000 },
  { phase: "submit", duration: 2000 },
  { phase: "toast", duration: 1500 },
  { phase: "reset", duration: 1500 },
];

function useDemoPhase(): DemoPhase {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const advancePhase = useCallback(() => {
    setPhaseIndex((prev) => (prev + 1) % PHASE_SEQUENCE.length);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setPhaseIndex(3);
      return;
    }

    const timer = setTimeout(advancePhase, PHASE_SEQUENCE[phaseIndex].duration);
    return () => clearTimeout(timer);
  }, [phaseIndex, reducedMotion, advancePhase]);

  return PHASE_SEQUENCE[phaseIndex].phase;
}

export function WidgetDemoSection() {
  const t = useTranslations("landing");
  const phase = useDemoPhase();

  return (
    <section className="py-20 sm:py-28 bg-gray-50 dark:bg-navy-950 relative">
      <CosmicBackground variant="top-only" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeader
          pill={t("demoPill")}
          title={t("demoTitle")}
          subtitle={t("demoSubtitle")}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Step narration — below animation on mobile, left on desktop */}
          <DemoStepNarration phase={phase} className="order-2 lg:order-1" />

          {/* Animated browser mockup — above narration on mobile, right on desktop */}
          <DemoAnimation phase={phase} className="order-1 lg:order-2" />
        </div>
      </div>
    </section>
  );
}
