"use client";

import { useTranslations } from "next-intl";
import { Bug, X, Send, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type DemoPhase = "idle" | "click" | "modal" | "fill" | "submit" | "toast" | "reset";

interface DemoBrowserContentProps {
  phase: DemoPhase;
}

const SEVERITY_OPTIONS = ["Low", "Medium", "High", "Critical"] as const;

function SkeletonPage() {
  return (
    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
      <div className="h-5 sm:h-6 bg-gray-100 dark:bg-navy-800 rounded w-40 sm:w-48" />
      <div className="h-3 sm:h-4 bg-gray-50 dark:bg-navy-800/50 rounded w-full" />
      <div className="h-3 sm:h-4 bg-gray-50 dark:bg-navy-800/50 rounded w-5/6" />
      <div className="h-3 sm:h-4 bg-gray-50 dark:bg-navy-800/50 rounded w-4/6" />
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
        <div className="h-16 sm:h-24 bg-gray-50 dark:bg-navy-800/50 rounded-lg" />
        <div className="h-16 sm:h-24 bg-gray-50 dark:bg-navy-800/50 rounded-lg" />
        <div className="h-16 sm:h-24 bg-gray-50 dark:bg-navy-800/50 rounded-lg" />
      </div>
    </div>
  );
}

function TypewriterText({ text, isVisible }: { text: string; isVisible: boolean }) {
  return (
    <span
      className={cn(
        "inline-block overflow-hidden whitespace-nowrap transition-all duration-[2000ms] ease-out",
        isVisible ? "max-w-[999px]" : "max-w-0",
      )}
    >
      {text}
    </span>
  );
}

function WidgetModal({ phase }: { phase: DemoPhase }) {
  const t = useTranslations("landing");
  const showModal = phase === "modal" || phase === "fill" || phase === "submit";
  const isFilling = phase === "fill" || phase === "submit";
  const isSubmitting = phase === "submit";

  if (!showModal) return null;

  return (
    <div
      className={cn(
        "absolute bottom-14 sm:bottom-16 right-3 sm:right-4 w-56 sm:w-72 max-w-[calc(100%-24px)]",
        "bg-white dark:bg-navy-800 rounded-xl shadow-2xl",
        "border border-gray-200 dark:border-white/[0.08] overflow-hidden",
        phase === "modal" && "animate-[demo-modal-enter_0.4s_ease-out_forwards]",
      )}
    >
      {/* Header */}
      <div className="bg-accent px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        <span className="text-xs sm:text-sm font-medium text-white">
          {t("widgetReportBug")}
        </span>
        <X className="w-3 h-3 sm:w-4 sm:h-4 text-white/80" aria-hidden="true" />
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Title field */}
        <div>
          <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("widgetTitle")}
          </label>
          <div className="w-full px-2 sm:px-2.5 py-1 sm:py-1.5 border border-gray-200 dark:border-white/[0.08] rounded text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 min-h-[24px] sm:min-h-[28px]">
            <TypewriterText text={t("demoTypedTitle")} isVisible={isFilling} />
          </div>
        </div>

        {/* Description field */}
        <div>
          <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("widgetDescription")}
          </label>
          <div className="w-full px-2 sm:px-2.5 py-1.5 sm:py-2 border border-gray-200 dark:border-white/[0.08] rounded text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 min-h-[32px] sm:min-h-[40px]">
            <TypewriterText text={t("demoTypedDesc")} isVisible={isFilling} />
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Severity
          </label>
          <div className="flex gap-1 sm:gap-1.5">
            {SEVERITY_OPTIONS.map((level) => (
              <span
                key={level}
                className={cn(
                  "px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium transition-all duration-500",
                  level === "High" && isFilling
                    ? "bg-severity-high/20 text-severity-high ring-1 ring-severity-high/40"
                    : "bg-gray-100 dark:bg-navy-900 text-gray-400 dark:text-gray-500",
                )}
              >
                {level}
              </span>
            ))}
          </div>
        </div>

        {/* Submit row */}
        <div className="flex items-center gap-2 pt-1">
          <button
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5",
              "bg-accent text-white rounded text-[10px] sm:text-xs font-medium",
              "transition-all duration-300",
              isSubmitting && "animate-[demo-submit-glow_1s_ease-in-out_infinite]",
            )}
            tabIndex={-1}
          >
            {isSubmitting ? (
              <>
                <Check className="w-3 h-3 animate-[demo-check-pop_0.4s_ease-out_forwards]" />
                <span>Sent!</span>
              </>
            ) : (
              <>
                <Send className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {t("widgetSubmit")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function FloatingButton({ phase }: { phase: DemoPhase }) {
  const isIdle = phase === "idle";
  const isPressed = phase === "click";

  return (
    <div
      className={cn(
        "absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-10 h-10 sm:w-12 sm:h-12",
        "bg-accent rounded-full shadow-lg flex items-center justify-center",
        "transition-transform duration-200",
        isIdle && "shadow-[0_0_20px_var(--color-accent-glow)] animate-[demo-button-press_2s_ease-in-out_infinite]",
        isPressed && "animate-[demo-button-press_0.3s_ease-in-out]",
      )}
    >
      <Bug className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
    </div>
  );
}

function CursorPointer({ phase }: { phase: DemoPhase }) {
  const isVisible = phase === "click";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute bottom-12 sm:bottom-16 right-10 sm:right-14 z-20",
        "transition-all duration-500",
        isVisible ? "opacity-100 translate-x-2 translate-y-2 sm:translate-x-4 sm:translate-y-4" : "opacity-0",
      )}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
        <path
          d="M5 3l14 8-6.5 2L9 19.5z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function SuccessToast({ phase }: { phase: DemoPhase }) {
  const t = useTranslations("landing");
  const isVisible = phase === "toast";

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4",
        "bg-green-500 text-white text-[10px] sm:text-xs font-medium",
        "px-3 py-1.5 sm:py-2 rounded-lg shadow-lg text-center",
        "animate-[demo-toast-enter_0.4s_ease-out_forwards]",
      )}
    >
      {t("demoToastSuccess")}
    </div>
  );
}

export function DemoBrowserContent({ phase }: DemoBrowserContentProps) {
  const isResetting = phase === "reset";

  return (
    <div
      className={cn(
        "relative bg-white dark:bg-navy-900 h-72 sm:h-96 overflow-hidden",
        "transition-opacity duration-700",
        isResetting && "animate-[demo-fade-out_0.8s_ease-in_forwards]",
      )}
    >
      <SkeletonPage />
      <WidgetModal phase={phase} />
      <FloatingButton phase={phase} />
      <CursorPointer phase={phase} />
      <SuccessToast phase={phase} />
    </div>
  );
}
