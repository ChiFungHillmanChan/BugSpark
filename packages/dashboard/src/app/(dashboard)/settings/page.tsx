"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { User, CreditCard, Plug, Palette, AlertTriangle } from "lucide-react";
import { ProfileTab } from "./components/profile-tab";
import { BillingTab } from "./components/billing-tab";
import { IntegrationsTab } from "./components/integrations-tab";
import { AppearanceTab } from "./components/appearance-tab";
import { AccountTab } from "./components/account-tab";

type SettingsTab = "profile" | "billing" | "integrations" | "appearance" | "account";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const TABS: Array<{ key: SettingsTab; label: string; icon: typeof User }> = [
    { key: "profile", label: t("tabProfile"), icon: User },
    { key: "billing", label: t("tabBilling"), icon: CreditCard },
    { key: "integrations", label: t("tabIntegrations"), icon: Plug },
    { key: "appearance", label: t("tabAppearance"), icon: Palette },
    { key: "account", label: t("tabAccount"), icon: AlertTriangle },
  ];

  return (
    <div>
      <PageHeader title={t("title")} />

      <nav className="flex gap-1 overflow-x-auto pb-px mb-6 -mx-1 px-1 scrollbar-hide" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const isDanger = tab.key === "account";
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0",
                isActive && !isDanger && "bg-accent/10 text-accent",
                isActive && isDanger && "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400",
                !isActive && "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800 hover:text-gray-700 dark:hover:text-gray-300",
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div role="tabpanel">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "billing" && <BillingTab />}
        {activeTab === "integrations" && <IntegrationsTab />}
        {activeTab === "appearance" && <AppearanceTab />}
        {activeTab === "account" && <AccountTab />}
      </div>
    </div>
  );
}
