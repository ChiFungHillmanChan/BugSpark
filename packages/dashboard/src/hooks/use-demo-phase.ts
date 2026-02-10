"use client";

import { useState, useEffect, useCallback } from "react";

export interface PhaseConfig<T extends string> {
  phase: T;
  duration: number;
}

interface UseDemoPhaseOptions<T extends string> {
  phases: PhaseConfig<T>[];
  reducedMotionFreezeIndex: number;
}

export function useDemoPhase<T extends string>({
  phases,
  reducedMotionFreezeIndex,
}: UseDemoPhaseOptions<T>): T {
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
    setPhaseIndex((prev) => (prev + 1) % phases.length);
  }, [phases.length]);

  useEffect(() => {
    if (reducedMotion) {
      setPhaseIndex(reducedMotionFreezeIndex);
      return;
    }

    const timer = setTimeout(advancePhase, phases[phaseIndex].duration);
    return () => clearTimeout(timer);
  }, [phaseIndex, reducedMotion, advancePhase, phases, reducedMotionFreezeIndex]);

  return phases[phaseIndex].phase;
}
