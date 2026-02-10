"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { docsNavConfig, type DocNavItem } from "./docs-nav-config";

interface NavItemProps {
  item: DocNavItem;
  basePath: string;
  pathname: string;
  t: (key: string) => string;
  onNavigate?: () => void;
}

function NavItem({ item, basePath, pathname, t, onNavigate }: NavItemProps) {
  const fullPath = `${basePath}/${item.slug}`;
  const isActive = pathname === fullPath;
  const hasChildren = item.children && item.children.length > 0;
  const [isOpen, setIsOpen] = useState(true);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
        >
          {t(item.titleKey)}
          <ChevronRight
            className={cn(
              "w-3.5 h-3.5 transition-transform",
              isOpen && "rotate-90",
            )}
          />
        </button>
        {isOpen && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 dark:border-gray-700 pl-3">
            {item.children?.map((child) => (
              <NavItem
                key={child.slug}
                item={child}
                basePath={basePath}
                pathname={pathname}
                t={t}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={fullPath}
      onClick={onNavigate}
      className={cn(
        "block px-3 py-1.5 text-sm rounded-md transition-colors",
        isActive
          ? "bg-accent/10 text-accent font-medium"
          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.06]",
      )}
    >
      {t(item.titleKey)}
    </Link>
  );
}

interface DocsSidebarProps {
  basePath: string;
  onNavigate?: () => void;
}

export function DocsSidebar({ basePath, onNavigate }: DocsSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("docs");

  return (
    <nav className="w-56 shrink-0 space-y-1 pr-6 border-r border-gray-200 dark:border-gray-700">
      {docsNavConfig.map((item) => (
        <NavItem
          key={item.slug}
          item={item}
          basePath={basePath}
          pathname={pathname}
          t={t}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
