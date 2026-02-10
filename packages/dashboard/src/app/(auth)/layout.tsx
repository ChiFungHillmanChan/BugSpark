import { Bug } from "lucide-react";
import type { ReactNode } from "react";
import { CosmicBackground } from "@/components/shared/cosmic-background";
import { ShootingStars } from "@/components/landing/shooting-stars";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-50 dark:bg-navy-950 dark:cosmic-bg relative px-4 py-8 sm:px-6 sm:py-12">
      <CosmicBackground variant="full" />
      <ShootingStars />

      <div className="mb-6 sm:mb-10 flex items-center gap-2.5 sm:gap-3 relative z-10">
        <Bug className="w-8 h-8 sm:w-10 sm:h-10 text-accent dark:drop-shadow-[0_0_12px_var(--color-accent-glow)]" />
        <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">BugSpark</span>
      </div>
      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </div>
  );
}
