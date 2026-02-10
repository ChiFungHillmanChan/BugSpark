"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Bug,
  FolderKanban,
  Settings,
  BookOpen,
  LogOut,
  ChevronDown,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useProjects } from "@/hooks/use-projects";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "dashboard" as const, icon: LayoutDashboard },
  { href: "/bugs", labelKey: "bugs" as const, icon: Bug },
  { href: "/projects", labelKey: "projects" as const, icon: FolderKanban },
  { href: "/docs", labelKey: "docs" as const, icon: BookOpen, external: true },
];

const ADMIN_NAV_ITEMS = [
  { href: "/admin", labelKey: "adminDashboard" as const, icon: Shield },
  { href: "/admin/users", labelKey: "adminUsers" as const, icon: Users },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, isSuperadmin } = useAuth();
  const { data: projects } = useProjects();
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
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
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-navy-950 border-r border-white/[0.06] text-white flex flex-col transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Bug className="w-6 h-6 text-accent" />
            <span className="text-lg font-bold">BugSpark</span>
          </div>
        </div>

        {projects && projects.length > 0 && (
          <div className="px-4 mb-4">
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-navy-900/80 border border-white/[0.06] text-sm hover:bg-navy-800"
            >
              <span className="truncate">
                {projects[0]?.name ?? t("selectProject")}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </button>
            {isProjectDropdownOpen && (
              <div className="mt-1 rounded-lg bg-navy-900/80 border border-white/[0.06] py-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setIsProjectDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/[0.04]"
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
                    : "text-gray-300 hover:text-white hover:bg-white/[0.04]",
                )}
              >
                <item.icon className="w-5 h-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}

          {isSuperadmin && (
            <>
              <div className="pt-4 pb-1 px-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {t("admin")}
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
                        ? "bg-accent/10 text-accent border-l-2 border-accent"
                        : "text-gray-300 hover:text-white hover:bg-white/[0.04]",
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              onClick={onClose}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                pathname.startsWith("/settings")
                  ? "bg-accent/10 text-accent ring-2 ring-accent/20"
                  : "bg-navy-800 text-gray-300 ring-2 ring-white/[0.06] hover:ring-accent/20",
              )}
              title={t("settings")}
            >
              {userInitials}
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
            </div>
            <Link
              href="/settings"
              onClick={onClose}
              className="text-gray-300 hover:text-white"
              title={t("settings")}
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={logout}
              className="text-gray-300 hover:text-white"
              title={t("logOut")}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
