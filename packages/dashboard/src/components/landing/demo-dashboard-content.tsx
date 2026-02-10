"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Bug } from "lucide-react";
import { DemoScreenshotThumbnail } from "@/components/landing/demo-screenshot-thumbnail";

export type DashboardPhase = "appear" | "triage" | "assign" | "resolve" | "reset";

interface DemoDashboardContentProps {
  phase: DashboardPhase;
}

interface StatusConfig {
  label: string;
  className: string;
}

function getStatusConfig(phase: DashboardPhase): StatusConfig {
  switch (phase) {
    case "appear":
      return {
        label: "New",
        className: "bg-status-new/20 text-status-new",
      };
    case "triage":
      return {
        label: "Triaging",
        className: "bg-status-triaging/20 text-status-triaging",
      };
    case "assign":
      return {
        label: "Triaging",
        className: "bg-status-triaging/20 text-status-triaging",
      };
    case "resolve":
    case "reset":
      return {
        label: "Resolved",
        className: "bg-status-resolved/20 text-status-resolved",
      };
  }
}

interface ActivityEntry {
  text: string;
  minPhase: DashboardPhase;
}

const PHASE_ORDER: DashboardPhase[] = ["appear", "triage", "assign", "resolve", "reset"];

function isPhaseReached(current: DashboardPhase, target: DashboardPhase): boolean {
  return PHASE_ORDER.indexOf(current) >= PHASE_ORDER.indexOf(target);
}

export function DemoDashboardContent({ phase }: DemoDashboardContentProps) {
  const t = useTranslations("landing");
  const isResetting = phase === "reset";
  const status = getStatusConfig(phase);
  const showAssignee = isPhaseReached(phase, "assign");

  const activityLog: ActivityEntry[] = [
    { text: t("demoDashActivity1"), minPhase: "appear" },
    { text: t("demoDashActivity2"), minPhase: "triage" },
    { text: t("demoDashActivity3"), minPhase: "assign" },
    { text: t("demoDashActivity4"), minPhase: "resolve" },
  ];

  return (
    <div
      className={cn(
        "relative bg-gray-100 dark:bg-navy-950 h-72 sm:h-96 overflow-hidden",
        "transition-opacity duration-700",
        isResetting && "animate-[demo-fade-out_0.8s_ease-in_forwards]",
      )}
    >
      {/* Dashboard top bar */}
      <div className="bg-white dark:bg-navy-800 border-b border-gray-200 dark:border-white/[0.08] px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2">
        <Bug className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
        <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">
          {t("demoDashTopBar")}
        </span>
      </div>

      {/* Bug report card */}
      <div className="p-3 sm:p-4">
        <div
          className={cn(
            "bg-white dark:bg-navy-800 rounded-lg border shadow-sm p-3 sm:p-4",
            "border-gray-200 dark:border-white/[0.08]",
            phase === "appear" && "animate-[demo-card-enter_0.5s_ease-out_forwards]",
            phase === "resolve" && "animate-[demo-resolved-glow_1.5s_ease-in-out]",
          )}
        >
          {/* Header: tracking ID + severity */}
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] sm:text-xs text-accent font-medium">
              BSK-1042
            </span>
            <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full bg-severity-high/20 text-severity-high font-medium">
              High
            </span>
          </div>

          {/* Title */}
          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {t("demoTypedTitle")}
          </h4>

          {/* Screenshot thumbnail */}
          <DemoScreenshotThumbnail className="mb-2" />

          {/* Status badge */}
          <div className="mb-3">
            <span
              key={status.label}
              className={cn(
                "inline-block text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-medium",
                status.className,
                (phase === "triage" || phase === "resolve") &&
                  "animate-[demo-badge-pop_0.4s_ease-out]",
              )}
            >
              {status.label}
            </span>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9px] sm:text-[10px] mb-3">
            <div>
              <span className="text-gray-400 dark:text-gray-500">{t("demoDashReporter")}</span>
              <span className="ml-1 text-gray-700 dark:text-gray-300">jane@acme.co</span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-gray-500">{t("demoDashCreated")}</span>
              <span className="ml-1 text-gray-700 dark:text-gray-300">2 min ago</span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-gray-500">{t("demoDashCategory")}</span>
              <span className="ml-1 text-gray-700 dark:text-gray-300">UI</span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-gray-500">{t("demoDashAssignee")}</span>
              <span
                className={cn(
                  "ml-1 text-gray-700 dark:text-gray-300 inline-block",
                  showAssignee
                    ? "animate-[demo-assignee-enter_0.4s_ease-out_forwards]"
                    : "opacity-0",
                )}
              >
                Alex K.
              </span>
            </div>
          </div>

          {/* Activity log */}
          <div className="border-t border-gray-100 dark:border-white/[0.06] pt-2">
            <span className="text-[8px] sm:text-[9px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              {t("demoDashActivity")}
            </span>
            <div className="mt-1.5 space-y-1">
              {activityLog.map((entry, i) => {
                const isVisible = isPhaseReached(phase, entry.minPhase);
                return (
                  <div
                    key={i}
                    className={cn(
                      "text-[8px] sm:text-[9px] text-gray-500 dark:text-gray-400",
                      "transition-all duration-500",
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                    )}
                  >
                    <span className="text-gray-300 dark:text-gray-600 mr-1">•</span>
                    {entry.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
