"use client";

import { useEffect, useState } from "react";

/**
 * AuthFlowDiagram
 *
 * A visual, animated diagram showing how CLI PAT authentication works.
 * Replaces the ASCII art in the CLI authentication docs.
 */
export function AuthFlowDiagram() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="my-8 select-none">
      <div className="relative rounded-xl border border-gray-200/60 dark:border-white/[0.06] bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-navy-900 dark:via-navy-950 dark:to-navy-900 p-6 sm:p-8 overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-accent/[0.04] dark:bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />

        {/* Flow nodes */}
        <div
          className="relative flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: "opacity 0.6s ease-out",
          }}
        >
          {/* Node: BugSpark CLI */}
          <FlowNode
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                <path d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="BugSpark CLI"
            subtitle="Terminal"
            color="blue"
            delay={0}
            isVisible={isVisible}
          />

          {/* Arrow 1 */}
          <FlowArrow label="bsk_pat_..." sublabel="Bearer token" delay={200} isVisible={isVisible} />

          {/* Node: BugSpark API */}
          <FlowNode
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                <path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="BugSpark API"
            subtitle="Server"
            color="accent"
            delay={400}
            isVisible={isVisible}
          />

          {/* Arrow 2 */}
          <FlowArrow label="SHA-256" sublabel="Hash match" delay={600} isVisible={isVisible} />

          {/* Node: Database */}
          <FlowNode
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
              </svg>
            }
            title="Database"
            subtitle="Storage"
            color="green"
            delay={800}
            isVisible={isVisible}
          />
        </div>

        {/* Step labels at bottom */}
        <div
          className="relative mt-6 pt-5 border-t border-gray-200/50 dark:border-white/[0.04]"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(8px)",
            transition: "all 0.5s ease-out 1s",
          }}
        >
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
              Token sent via header
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
              Hashed &amp; verified
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
              Only hash stored
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowNode({
  icon,
  title,
  subtitle,
  color,
  delay,
  isVisible,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: "blue" | "accent" | "green";
  delay: number;
  isVisible: boolean;
}) {
  const colorMap = {
    blue: {
      ring: "ring-blue-200/50 dark:ring-blue-500/20",
      bg: "bg-blue-50 dark:bg-blue-500/[0.08]",
      icon: "text-blue-500 dark:text-blue-400",
      glow: "bg-blue-400/10 dark:bg-blue-400/5",
    },
    accent: {
      ring: "ring-accent/20 dark:ring-accent/20",
      bg: "bg-red-50 dark:bg-accent/[0.08]",
      icon: "text-accent dark:text-accent",
      glow: "bg-accent/10 dark:bg-accent/5",
    },
    green: {
      ring: "ring-emerald-200/50 dark:ring-emerald-500/20",
      bg: "bg-emerald-50 dark:bg-emerald-500/[0.08]",
      icon: "text-emerald-500 dark:text-emerald-400",
      glow: "bg-emerald-400/10 dark:bg-emerald-400/5",
    },
  };

  const c = colorMap[color];

  return (
    <div
      className="flex flex-col items-center gap-2.5 shrink-0"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.95)",
        transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      <div className={`relative p-4 rounded-2xl ring-1 ${c.ring} ${c.bg}`}>
        {/* Subtle glow behind icon */}
        <div className={`absolute inset-0 rounded-2xl ${c.glow} blur-xl`} />
        <div className={`relative ${c.icon}`}>{icon}</div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
          {title}
        </div>
        <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function FlowArrow({
  label,
  sublabel,
  delay,
  isVisible,
}: {
  label: string;
  sublabel: string;
  delay: number;
  isVisible: boolean;
}) {
  return (
    <div
      className="flex flex-col sm:flex-row items-center mx-2 sm:mx-4 shrink-0"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: `opacity 0.4s ease-out ${delay}ms`,
      }}
    >
      {/* Vertical arrow for mobile */}
      <div className="flex sm:hidden flex-col items-center gap-1 my-1">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono font-medium text-accent/80 dark:text-accent/70 tracking-tight">
            {label}
          </span>
          <span className="text-[9px] text-gray-400 dark:text-gray-500">
            {sublabel}
          </span>
        </div>
        <svg width="12" height="24" viewBox="0 0 12 24" className="text-gray-300 dark:text-gray-600">
          <line x1="6" y1="0" x2="6" y2="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M2 16l4 6 4-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Horizontal arrow for desktop */}
      <div className="hidden sm:flex flex-col items-center gap-1">
        <div className="flex flex-col items-center mb-1">
          <span className="text-[10px] font-mono font-medium text-accent/80 dark:text-accent/70 tracking-tight whitespace-nowrap">
            {label}
          </span>
          <span className="text-[9px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {sublabel}
          </span>
        </div>
        <svg width="80" height="12" viewBox="0 0 80 12" className="text-gray-300 dark:text-gray-600">
          <line x1="0" y1="6" x2="68" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M66 2l8 4-8 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
