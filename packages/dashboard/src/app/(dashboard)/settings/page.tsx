"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Github, Key, ChevronRight, Users, Radio } from "lucide-react";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { SettingsProfileForm } from "./components/settings-profile-form";
import { SettingsPasswordForm } from "./components/settings-password-form";
import { SettingsGoogleSection } from "./components/settings-google-section";
import { SettingsAppearance } from "./components/settings-appearance";
import { SettingsAccountSection } from "./components/settings-account-section";

export default function SettingsPage() {
  const t = useTranslations("settings");

  return (
    <div className="max-w-xl">
      <PageHeader title={t("title")} />

      <SettingsProfileForm />
      <SettingsPasswordForm />
      <SettingsGoogleSection />

      <section className="border-t border-gray-200 dark:border-navy-700 pt-8 mb-8">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{t("integrations")}</h2>
        <div className="space-y-3">
          <Link
            href="/settings/integrations"
            className="flex items-center justify-between px-4 py-3 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg hover:border-gray-300 dark:hover:border-navy-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t("issueTrackers")}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("issueTrackersDesc")}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
          <Link
            href="/settings/tokens"
            className="flex items-center justify-between px-4 py-3 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg hover:border-gray-300 dark:hover:border-navy-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t("personalAccessTokens")}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("personalAccessTokensDesc")}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
          <Link
            href="/settings/team"
            className="flex items-center justify-between px-4 py-3 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg hover:border-gray-300 dark:hover:border-navy-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t("teamMembers")}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("teamMembersDesc")}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
          <Link
            href="/settings/webhooks"
            className="flex items-center justify-between px-4 py-3 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg hover:border-gray-300 dark:hover:border-navy-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Radio className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t("webhooks")}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("webhooksDesc")}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>
      </section>

      <section className="border-t border-gray-200 dark:border-navy-700 pt-8 mb-8">
        <NotificationSettings />
      </section>

      <SettingsAppearance />
      <SettingsAccountSection />
    </div>
  );
}
