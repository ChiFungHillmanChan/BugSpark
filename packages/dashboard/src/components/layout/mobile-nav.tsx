"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Bug,
  FolderKanban,
  BookOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "dashboard" as const, icon: LayoutDashboard, external: false },
  { href: "/bugs", labelKey: "bugs" as const, icon: Bug, external: false },
  { href: "/projects", labelKey: "projects" as const, icon: FolderKanban, external: false },
  { href: "/docs", labelKey: "docs" as const, icon: BookOpen, external: true },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-64 bg-navy-900 text-white p-4">
        <div className="flex items-center justify-between mb-8">
          <span className="text-lg font-bold">BugSpark</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
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
      </div>
    </div>
  );
}
