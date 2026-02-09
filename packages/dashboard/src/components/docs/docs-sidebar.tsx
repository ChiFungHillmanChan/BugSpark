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
}

function NavItem({ item, basePath, pathname, t }: NavItemProps) {
  const fullPath = `${basePath}/${item.slug}`;
  const isActive = pathname === fullPath;
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = hasChildren && pathname.startsWith(fullPath);
  const [isOpen, setIsOpen] = useState(isExpanded);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
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
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
            {item.children!.map((child) => (
              <NavItem
                key={child.slug}
                item={child}
                basePath={basePath}
                pathname={pathname}
                t={t}
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
      className={cn(
        "block px-3 py-1.5 text-sm rounded-md transition-colors",
        isActive
          ? "bg-accent/10 text-accent font-medium"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
      )}
    >
      {t(item.titleKey)}
    </Link>
  );
}

interface DocsSidebarProps {
  basePath: string;
}

export function DocsSidebar({ basePath }: DocsSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("docs");

  return (
    <nav className="w-56 shrink-0 space-y-1 pr-6 border-r border-gray-200">
      {docsNavConfig.map((item) => (
        <NavItem
          key={item.slug}
          item={item}
          basePath={basePath}
          pathname={pathname}
          t={t}
        />
      ))}
    </nav>
  );
}
