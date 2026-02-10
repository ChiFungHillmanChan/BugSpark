"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface StepConfig<T extends string> {
  titleKey: string;
  descKey: string;
  activePhases: T[];
}

interface DemoStepNarrationProps<T extends string> {
  phase: T;
  steps: StepConfig<T>[];
  className?: string;
}

export function DemoStepNarration<T extends string>({
  phase,
  steps,
  className,
}: DemoStepNarrationProps<T>) {
  const t = useTranslations("landing");

  return (
    <div className={cn("flex flex-col gap-3 sm:gap-4", className)}>
      {steps.map((step, index) => {
        const isActive = step.activePhases.includes(phase);

        return (
          <div
            key={step.titleKey}
            className={cn(
              "flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all duration-500",
              "border-l-[3px]",
              isActive
                ? "border-l-accent bg-accent/5 dark:bg-accent/10"
                : "border-l-transparent bg-transparent",
            )}
          >
            {/* Step number badge */}
            <div
              className={cn(
                "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center",
                "text-xs sm:text-sm font-bold transition-all duration-500",
                isActive
                  ? "bg-accent text-white"
                  : "bg-gray-100 dark:bg-navy-800 text-gray-400 dark:text-gray-500",
              )}
            >
              {index + 1}
            </div>

            {/* Text content */}
            <div className="min-w-0">
              <h3
                className={cn(
                  "text-sm sm:text-base font-semibold transition-colors duration-500",
                  isActive
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-500",
                )}
              >
                {t(step.titleKey)}
              </h3>
              <p
                className={cn(
                  "text-xs sm:text-sm mt-0.5 sm:mt-1 leading-relaxed transition-colors duration-500",
                  isActive
                    ? "text-gray-600 dark:text-gray-300"
                    : "text-gray-300 dark:text-gray-600",
                )}
              >
                {t(step.descKey)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
