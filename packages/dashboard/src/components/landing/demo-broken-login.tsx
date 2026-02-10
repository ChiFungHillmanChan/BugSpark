"use client";

import { cn } from "@/lib/utils";

interface DemoBrokenLoginProps {
  className?: string;
}

export function DemoBrokenLogin({ className }: DemoBrokenLoginProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center h-full bg-gray-50 dark:bg-navy-950 p-4",
        className,
      )}
    >
      <div className="w-full max-w-[220px] sm:max-w-[260px]">
        {/* App header */}
        <div className="text-center mb-3 sm:mb-4">
          <div className="inline-flex items-center gap-1.5 mb-1">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-blue-500" />
            <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200">
              Acme App
            </span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500">
            Sign in to your account
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-white/[0.08] p-3 sm:p-4 shadow-sm">
          {/* Email field */}
          <div className="mb-2">
            <label className="block text-[9px] sm:text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">
              Email
            </label>
            <div className="w-full px-2 py-1 sm:py-1.5 border border-gray-200 dark:border-white/[0.08] rounded text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-navy-900">
              user@example.com
            </div>
          </div>

          {/* Password field */}
          <div className="mb-3">
            <label className="block text-[9px] sm:text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">
              Password
            </label>
            <div className="w-full px-2 py-1 sm:py-1.5 border border-gray-200 dark:border-white/[0.08] rounded text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-navy-900">
              ••••••••
            </div>
          </div>

          {/* Broken button area */}
          <div className="relative">
            {/* Container with clipped height — the "CSS bug" */}
            <div className="h-5 sm:h-6 overflow-hidden relative">
              <button
                tabIndex={-1}
                className="w-full h-8 sm:h-9 bg-blue-500 text-white text-[10px] sm:text-xs font-medium rounded cursor-default"
              >
                Sign in
              </button>
            </div>

            {/* Stray overlapping element — simulates z-index bug */}
            <div className="absolute top-0 right-0 w-10 sm:w-12 h-5 sm:h-6 bg-white/80 dark:bg-navy-800/80 rounded-bl" />

            {/* "Forgot password" clipping into button */}
            <div className="relative -mt-1.5 sm:-mt-2">
              <span className="text-[8px] sm:text-[9px] text-blue-500 dark:text-blue-400">
                Forgot password?
              </span>
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-center gap-1.5 mt-2 sm:mt-3">
            <div className="w-3 h-3 border border-gray-300 dark:border-gray-600 rounded-sm" />
            <span className="text-[8px] sm:text-[9px] text-gray-400 dark:text-gray-500">
              Remember me
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
