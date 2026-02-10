"use client";

import { cn } from "@/lib/utils";

interface DemoScreenshotThumbnailProps {
  className?: string;
}

export function DemoScreenshotThumbnail({ className }: DemoScreenshotThumbnailProps) {
  return (
    <div
      className={cn(
        "relative w-full h-10 sm:h-14 rounded border border-gray-200 dark:border-white/[0.08]",
        "bg-gray-50 dark:bg-navy-900 overflow-hidden",
        className,
      )}
    >
      {/* Mini representation of the broken login page */}
      <div className="absolute inset-0 flex items-center justify-center scale-[0.3] origin-center">
        <div className="w-[220px] space-y-1">
          <div className="h-3 bg-gray-200 dark:bg-navy-700 rounded w-24 mx-auto" />
          <div className="h-4 bg-gray-100 dark:bg-navy-800 rounded" />
          <div className="h-4 bg-gray-100 dark:bg-navy-800 rounded" />
          <div className="h-3 bg-blue-400 rounded" />
        </div>
      </div>

      {/* Red annotation circle overlay on button area */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 60"
        preserveAspectRatio="xMidYMid meet"
      >
        <ellipse
          cx="50"
          cy="44"
          rx="22"
          ry="8"
          fill="none"
          stroke="#e94560"
          strokeWidth="1.5"
        />
      </svg>

      {/* "Screenshot" label */}
      <div className="absolute bottom-0.5 right-1 text-[7px] sm:text-[8px] text-gray-400 dark:text-gray-500">
        screenshot.png
      </div>
    </div>
  );
}
