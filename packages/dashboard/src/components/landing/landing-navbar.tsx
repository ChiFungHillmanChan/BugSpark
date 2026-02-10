"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bug, Menu, X } from "lucide-react";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function LandingNavbar() {
  const t = useTranslations("landing");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [menuHeight, setMenuHeight] = useState(0);

  useEffect(() => {
    if (isMobileMenuOpen && mobileMenuRef.current) {
      setMenuHeight(mobileMenuRef.current.scrollHeight);
    } else {
      setMenuHeight(0);
    }
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
                href="/register"
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors dark:gradient-btn dark:rounded-full"
              >
                {t("signUp")}
              </Link>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              <span
                className={`absolute transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"
                }`}
              >
                <X className="w-6 h-6" />
              </span>
              <span
                className={`absolute transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen ? "opacity-0 -rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                }`}
              >
                <Menu className="w-6 h-6" />
              </span>
            </button>
          </div>

          <div
            className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: menuHeight }}
          >
            <div ref={mobileMenuRef} className="border-t border-gray-200 dark:border-white/[0.08] py-4 space-y-1">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    handleSmoothScroll(e, link.href);
                    if (!link.href.startsWith("#")) setIsMobileMenuOpen(false);
                  }}
                  className="block text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
                  style={{
                    transitionDelay: isMobileMenuOpen ? `${index * 50}ms` : "0ms",
                    opacity: isMobileMenuOpen ? 1 : 0,
                    transform: isMobileMenuOpen ? "translateY(0)" : "translateY(-8px)",
                    transitionProperty: "opacity, transform, background-color, color",
                    transitionDuration: "300ms",
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <div
                className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]"
                style={{
                  transitionDelay: isMobileMenuOpen ? `${navLinks.length * 50}ms` : "0ms",
                  opacity: isMobileMenuOpen ? 1 : 0,
                  transform: isMobileMenuOpen ? "translateY(0)" : "translateY(-8px)",
                  transitionProperty: "opacity, transform",
                  transitionDuration: "300ms",
                }}
              >
                <ThemeToggle />
                <LocaleSwitcher />
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t("signUp")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
