"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { UserPlan, UserRole } from "@/types";

interface PlanBadgeProps {
  plan: UserPlan;
  role?: UserRole;
  className?: string;
}

const PLAN_STYLES: Record<UserPlan, string> = {
  free: "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  enterprise:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

const SUPERADMIN_STYLE =
  "bg-gradient-to-r from-red-500 to-accent text-white";

const PLAN_LABEL_KEY: Record<UserPlan, string> = {
  free: "planFree",
  pro: "planPro",
  enterprise: "planEnterprise",
};

export function PlanBadge({ plan, role, className }: PlanBadgeProps) {
  const t = useTranslations("common");

  const isSuperadmin = role === "superadmin";
  const style = isSuperadmin ? SUPERADMIN_STYLE : PLAN_STYLES[plan];
  const label = isSuperadmin ? t("planSuperadmin") : t(PLAN_LABEL_KEY[plan]);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide leading-none",
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}
