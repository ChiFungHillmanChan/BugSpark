"use client";

import { cn } from "@/lib/utils";
import { Pencil, MoveUpRight, Square, Circle, Type } from "lucide-react";

export type AnnotationPhase = "capture" | "annotate";

interface DemoAnnotationOverlayProps {
  phase: AnnotationPhase | null;
}

const TOOL_ICONS = [
  { Icon: Pencil, label: "pen" },
  { Icon: MoveUpRight, label: "arrow" },
  { Icon: Square, label: "rectangle" },
  { Icon: Circle, label: "circle" },
  { Icon: Type, label: "text" },
] as const;

const COLOR_DOTS = ["#e94560", "#3b82f6", "#22c55e"] as const;

function AnnotationToolbar() {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 right-0 z-20",
        "bg-[#1a1a2e] px-2 sm:px-3 py-1.5 sm:py-2",
        "flex items-center gap-1.5 sm:gap-2",
        "animate-[demo-toolbar-enter_0.3s_ease-out_forwards]",
      )}
    >
      {/* Tool icons */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {TOOL_ICONS.map(({ Icon, label }) => (
          <div
            key={label}
            className={cn(
              "w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded",
              label === "circle"
                ? "bg-accent text-white"
                : "text-gray-400 hover:text-white",
            )}
          >
            <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        ))}
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-white/20" />

      {/* Color dots */}
      <div className="flex items-center gap-1">
        {COLOR_DOTS.map((color, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full",
              i === 0 && "ring-1 ring-white/60 ring-offset-1 ring-offset-[#1a1a2e]",
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Done / Cancel buttons */}
      <div className="flex items-center gap-1">
        <span className="text-[8px] sm:text-[9px] text-gray-400 px-1.5 py-0.5 rounded hover:bg-white/10 cursor-default">
          Cancel
        </span>
        <span className="text-[8px] sm:text-[9px] text-white bg-accent px-1.5 sm:px-2 py-0.5 rounded font-medium cursor-default">
          Done
        </span>
      </div>
    </div>
  );
}

function AnnotationCircle() {
  return (
    <svg
      className="absolute z-10 pointer-events-none"
      style={{
        left: "50%",
        top: "66%",
        transform: "translate(-50%, -50%)",
        width: "140px",
        height: "50px",
      }}
      viewBox="0 0 140 50"
    >
      <ellipse
        cx="70"
        cy="25"
        rx="65"
        ry="20"
        fill="none"
        stroke="#e94560"
        strokeWidth="2.5"
        strokeDasharray="290"
        className="animate-[demo-annotation-draw_1.5s_ease-out_forwards]"
        style={{ strokeDashoffset: 290 }}
      />
    </svg>
  );
}

function CaptureFlash() {
  return (
    <div
      className={cn(
        "absolute inset-0 z-30 bg-white pointer-events-none",
        "animate-[demo-capture-flash_0.8s_ease-out_forwards]",
      )}
    />
  );
}

export function DemoAnnotationOverlay({ phase }: DemoAnnotationOverlayProps) {
  if (!phase) return null;

  return (
    <>
      {phase === "capture" && <CaptureFlash />}
      {phase === "annotate" && (
        <>
          <AnnotationToolbar />
          <AnnotationCircle />
        </>
      )}
    </>
  );
}
