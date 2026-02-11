"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Bug } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("common");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-navy-950">
        <div className="flex flex-col items-center gap-3">
          <Bug className="w-10 h-10 text-accent animate-pulse dark:drop-shadow-[0_0_12px_var(--color-accent-glow)]" />
          <span className="text-sm text-gray-500 dark:text-gray-400">{t("loading")}</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-navy-950">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary
            errorTitle={t("error")}
            errorDescription={t("errorDescription")}
            retryLabel={t("tryAgain")}
          >
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
