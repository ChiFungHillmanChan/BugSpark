"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bug, Menu, X } from "lucide-react";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";

export function LandingNavbar() {
  const t = useTranslations("landing");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#features", label: t("features") },
    { href: "#pricing", label: t("pricing") },
    { href: "/docs", label: t("viewDocs") },
  ];

  return (
    <header className="sticky top-0 z-50 pt-4 px-4">
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
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <LocaleSwitcher />
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors dark:gradient-btn dark:rounded-full"
              >
                {t("signUp")}
              </Link>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-white/[0.08] py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium py-1"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <LocaleSwitcher />
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium"
                >
                  {t("signUp")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
