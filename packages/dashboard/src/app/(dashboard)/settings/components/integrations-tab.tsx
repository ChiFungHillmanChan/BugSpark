"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Github, Key, Users, Radio } from "lucide-react";

export function IntegrationsTab() {
  const t = useTranslations("settings");

  const links = [
    {
      href: "/settings/integrations",
      icon: Github,
      label: t("issueTrackers"),
      desc: t("issueTrackersDesc"),
    },
    {
      href: "/settings/tokens",
      icon: Key,
      label: t("personalAccessTokens"),
      desc: t("personalAccessTokensDesc"),
    },
    {
      href: "/settings/team",
      icon: Users,
      label: t("teamMembers"),
      desc: t("teamMembersDesc"),
    },
    {
      href: "/settings/webhooks",
      icon: Radio,
      label: t("webhooks"),
      desc: t("webhooksDesc"),
    },
  ];

  return (
    <div className="space-y-3">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between px-4 py-3 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg hover:border-gray-300 dark:hover:border-navy-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{link.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{link.desc}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
