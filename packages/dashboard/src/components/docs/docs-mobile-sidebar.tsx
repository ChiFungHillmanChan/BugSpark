"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocsSidebar } from "./docs-sidebar";

interface DocsMobileSidebarProps {
  basePath: string;
}

export function DocsMobileSidebar({ basePath }: DocsMobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors mb-4"
        aria-label="Open navigation"
      >
        <Menu className="w-4 h-4" />
        <span>Menu</span>
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={close}
        />

        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 bg-white dark:bg-navy-900 shadow-xl transition-transform duration-300 ease-in-out overflow-y-auto",
            isOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-navy-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Documentation
            </span>
            <button
              onClick={close}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            <DocsSidebar basePath={basePath} onNavigate={close} />
          </div>
        </div>
      </div>
    </div>
  );
}
