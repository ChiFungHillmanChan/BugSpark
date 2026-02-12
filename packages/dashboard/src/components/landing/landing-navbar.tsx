"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bug, Menu, X } from "lucide-react";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function LandingNavbar() {
  const t = useTranslations("landing");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleSmoothScroll = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (href.startsWith("#")) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          setIsMobileMenuOpen(false);
          setTimeout(() => {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 50);
        }
      }
    },
    []
  );

  const navLinks = [
    { href: "/features", label: t("features") },
    { href: "/pricing", label: t("pricing") },
    { href: "/docs", label: t("viewDocs") },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 pt-4 px-4 [will-change:transform]">
        <div className="max-w-5xl mx-auto rounded-2xl bg-white/80 dark:bg-navy-900/60 backdrop-blur-xl border border-gray-200 dark:border-white/[0.08]">
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <Bug className="w-6 h-6 text-accent" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">BugSpark</span>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="hidden md:flex items-center gap-3">
                <ThemeToggle />
                <LocaleSwitcher />
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register/beta"
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors dark:gradient-btn dark:rounded-full"
                >
                  {t("signUp")}
                </Link>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden relative w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile drawer - slides from right */}
      <aside
        className={`fixed inset-y-0 right-0 w-72 z-[70] md:hidden bg-white dark:bg-navy-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-gray-200 dark:border-white/[0.08]">
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Bug className="w-5 h-5 text-accent" />
              <span className="text-base font-bold text-gray-900 dark:text-white">BugSpark</span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  handleSmoothScroll(e, link.href);
                  if (!link.href.startsWith("#")) setIsMobileMenuOpen(false);
                }}
                className="block text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Drawer footer */}
          <div className="border-t border-gray-200 dark:border-white/[0.08] px-4 py-4 space-y-3">
            <div className="flex items-center gap-3 px-3">
              <ThemeToggle />
              <LocaleSwitcher dropdownDirection="up" />
            </div>
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
            >
              {t("login")}
            </Link>
            <Link
              href="/register/beta"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-center px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t("signUp")}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
