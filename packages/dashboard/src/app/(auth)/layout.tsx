import { Bug } from "lucide-react";
import type { ReactNode } from "react";
import { CosmicBackground } from "@/components/shared/cosmic-background";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-navy-950 dark:cosmic-bg relative px-4">
      <CosmicBackground variant="top-only" />
      <div className="mb-8 flex items-center gap-2 relative z-10">
        <Bug className="w-8 h-8 text-accent dark:drop-shadow-[0_0_8px_var(--color-accent-glow)]" />
        <span className="text-2xl font-bold text-gray-900 dark:text-white">BugSpark</span>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
