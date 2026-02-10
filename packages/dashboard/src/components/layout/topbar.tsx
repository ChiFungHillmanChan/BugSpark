"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface TopbarProps {
  onMenuClick: () => void;
}

function getBreadcrumbs(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map(
    (segment) =>
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
  );
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="h-14 border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-navy-950/80 dark:backdrop-blur-xl flex items-center px-6 gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
      >
        <Menu className="w-6 h-6" />
      </button>

      <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            <span
              className={
                index === breadcrumbs.length - 1
                  ? "text-gray-900 dark:text-white font-semibold"
                  : ""
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
