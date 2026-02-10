"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bug } from "lucide-react";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";

export function LandingFooter() {
  const t = useTranslations("landing");

  const columns = [
    {
      title: t("footerProduct"),
      links: [
        { label: t("features"), href: "/features" },
        { label: t("pricing"), href: "/pricing" },
        { label: t("viewDocs"), href: "/docs" },
        { label: t("footerChangelog"), href: "/changelog" },
      ],
    },
    {
      title: t("footerResources"),
      links: [
        { label: t("viewDocs"), href: "/docs" },
        { label: t("footerGitHub"), href: "https://github.com/hillmanchan/bugspark" },
        { label: t("footerBlog"), href: "#" },
      ],
    },
    {
      title: t("footerCompany"),
      links: [
        { label: t("footerAbout"), href: "/about" },
        { label: t("footerBlog"), href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-50 dark:bg-navy-950 border-t border-gray-200 dark:border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Bug className="w-5 h-5 text-accent" />
              <span className="text-sm font-bold text-gray-900 dark:text-white">BugSpark</span>
            </Link>
            <p className="text-xs text-gray-500 mb-4">
              {t("openSource")}. {t("selfHosted")}
            </p>
            <LocaleSwitcher />
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-300 uppercase tracking-wider mb-3">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/[0.06] text-center text-xs text-gray-400 space-y-1">
          <p>&copy; {new Date().getFullYear()} BugSpark. {t("footerRights")}</p>
          <p>
            Built by{" "}
            <a
              href="https://hillmanchan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover transition-colors font-medium"
            >
              Hillman Chan
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
