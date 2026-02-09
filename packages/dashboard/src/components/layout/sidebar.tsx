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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useProjects } from "@/hooks/use-projects";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "dashboard" as const, icon: LayoutDashboard },
  { href: "/bugs", labelKey: "bugs" as const, icon: Bug },
  { href: "/projects", labelKey: "projects" as const, icon: FolderKanban },
  { href: "/settings", labelKey: "settings" as const, icon: Settings },
  { href: "/docs", labelKey: "docs" as const, icon: BookOpen },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
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
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-navy-900 text-white flex flex-col transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Bug className="w-6 h-6 text-accent" />
            <span className="text-lg font-bold">BugSpark</span>
          </div>
        </div>

        {projects && projects.length > 0 && (
          <div className="px-4 mb-4">
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-navy-800 text-sm hover:bg-navy-700"
            >
              <span className="truncate">
                {projects[0]?.name ?? t("selectProject")}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </button>
            {isProjectDropdownOpen && (
              <div className="mt-1 rounded-lg bg-navy-800 py-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setIsProjectDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-navy-700"
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-white"
                    : "text-gray-400 hover:text-white hover:bg-navy-800",
                )}
              >
                <item.icon className="w-5 h-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white"
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
