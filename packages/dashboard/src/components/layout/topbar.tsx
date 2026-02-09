"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

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
    <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-700"
      >
        <Menu className="w-6 h-6" />
      </button>

      <nav className="flex items-center text-sm text-gray-500">
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            <span
              className={
                index === breadcrumbs.length - 1
                  ? "text-gray-900 font-medium"
                  : ""
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>
    </header>
  );
}
