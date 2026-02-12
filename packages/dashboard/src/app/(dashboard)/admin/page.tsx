"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { usePlatformStats } from "@/hooks/use-admin";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PlanBadge } from "@/components/shared/plan-badge";
import type { UserPlan } from "@/types";

const BREAKDOWN_LABELS: Record<string, string> = {
  free: "planFree",
  starter: "planStarter",
  team: "planTeam",
  enterprise: "planEnterprise",
  user: "roleUser",
  admin: "roleAdmin",
  superadmin: "roleSuperadmin",
};

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700 p-6">
      <p className="text-sm text-gray-500 dark:text-gray-300">{label}</p>
      <p className="text-3xl font-bold mt-1 dark:text-white">{value}</p>
    </div>
  );
}

function BreakdownCard({
  title,
  data,
  variant,
}: {
  title: string;
  data: Record<string, number>;
  variant?: "plan" | "role";
}) {
  const t = useTranslations("admin");
  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700 p-6">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        {Object.entries(data).map(([key, count]) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {variant === "plan" && (
                <PlanBadge
                  plan={key as UserPlan}
                  role={key === "superadmin" ? "superadmin" : undefined}
                />
              )}
              <span className="text-sm dark:text-gray-300">
                {t(BREAKDOWN_LABELS[key] ?? key)}
              </span>
            </div>
            <span className="text-sm font-medium dark:text-white">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const t = useTranslations("admin");
  const { isSuperadmin, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { data: stats, isLoading } = usePlatformStats();

  useEffect(() => {
    if (!isAuthLoading && !isSuperadmin) {
      router.replace("/dashboard");
    }
  }, [isAuthLoading, isSuperadmin, router]);

  if (isAuthLoading || !isSuperadmin) {
    return null;
  }

  if (isLoading || !stats) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">{t("platformOverview")}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">{t("platformOverview")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label={t("totalUsers")} value={stats.totalUsers} />
        <StatCard label={t("totalProjects")} value={stats.totalProjects} />
        <StatCard label={t("totalReports")} value={stats.totalReports} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BreakdownCard title={t("usersByPlan")} data={stats.usersByPlan} variant="plan" />
        <BreakdownCard title={t("usersByRole")} data={stats.usersByRole} variant="role" />
      </div>
    </div>
  );
}
