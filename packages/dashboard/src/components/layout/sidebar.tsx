"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Bug,
  Settings,
  BookOpen,
  Shield,
  Users,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { PlanBadge } from "@/components/shared/plan-badge";
import { ProjectSwitcher } from "@/components/layout/project-switcher";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "dashboard" as const, icon: LayoutDashboard },
  { href: "/bugs", labelKey: "bugs" as const, icon: Bug },
  { href: "/docs", labelKey: "docs" as const, icon: BookOpen, external: true },
];

const ADMIN_NAV_ITEMS = [
  { href: "/admin", labelKey: "adminDashboard" as const, icon: Shield },
  { href: "/admin/users", labelKey: "adminUsers" as const, icon: Users },
  { href: "/admin/reports", labelKey: "adminReports" as const, icon: Bug },
  { href: "/admin/beta", labelKey: "adminBeta" as const, icon: FlaskConical },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isSuperadmin } = useAuth();
  const t = useTranslations("nav");

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "?";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-navy-950 border-r border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white flex flex-col transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-14 shrink-0 flex items-center px-6 border-b border-gray-200 dark:border-white/[0.06]">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
            <Bug className="w-6 h-6 text-accent" />
            <span className="text-lg font-bold">BugSpark</span>
          </Link>
        </div>

        <ProjectSwitcher onNavigate={onClose} />

        <nav className="flex-1 px-4 space-y-1 thin-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent border-l-2 border-accent"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.04]",
                )}
              >
                <item.icon className="w-5 h-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}

          {isSuperadmin && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 px-3 pb-2">
                <Shield className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">
                  {t("adminPanel")}
                </span>
              </div>
              {ADMIN_NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-l-2 border-red-500"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.04]",
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              onClick={onClose}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                pathname.startsWith("/settings")
                  ? "bg-accent/10 text-accent ring-2 ring-accent/20"
                  : "bg-gray-200 dark:bg-navy-800 text-gray-600 dark:text-gray-300 ring-2 ring-gray-300 dark:ring-white/[0.06] hover:ring-accent/20",
              )}
              title={t("settings")}
            >
              {userInitials}
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                {user && (
                  <PlanBadge plan={user.plan} role={user.role} />
                )}
              </div>
            </div>
            <Link
              href="/settings"
              onClick={onClose}
              className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              title={t("settings")}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
