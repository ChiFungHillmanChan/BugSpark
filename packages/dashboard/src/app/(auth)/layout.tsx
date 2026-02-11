import type { ReactNode } from "react";
import { CosmicBackground } from "@/components/shared/cosmic-background";
import { ShootingStars } from "@/components/landing/shooting-stars";
import { LandingNavbar } from "@/components/landing/landing-navbar";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 dark:bg-navy-950 dark:cosmic-bg relative">
      <CosmicBackground variant="full" />
      <ShootingStars />
      
      <div className="relative z-10">
        <LandingNavbar />
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 relative z-10">
        <div className="w-full max-w-lg">{children}</div>
      </div>
    </div>
  );
}
