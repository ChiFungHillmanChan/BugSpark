"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Settings, Code, Palette, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { useProject } from "@/hooks/use-projects";
import { Skeleton } from "@/components/shared/skeleton-loader";
import { ProjectSettingsForm } from "./components/project-settings-form";
import { ProjectApiKey } from "./components/project-api-key";
import { ProjectIntegrationSnippets } from "./components/project-integration-snippets";
import { ProjectWidgetConfig } from "./components/project-widget-config";
import { ProjectDangerZone } from "./components/project-danger-zone";

type SettingsTab = "general" | "integration" | "widget" | "danger";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("projects");
  const { data: project, isLoading } = useProject(id);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const TABS: Array<{ key: SettingsTab; label: string; icon: typeof Settings }> = [
    { key: "general", label: t("tabGeneral"), icon: Settings },
    { key: "integration", label: t("tabIntegration"), icon: Code },
    { key: "widget", label: t("tabWidget"), icon: Palette },
    { key: "danger", label: t("tabDanger"), icon: AlertTriangle },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-gray-500 dark:text-gray-400 text-center py-16">{t("notFound")}</p>;
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={t("projectSettings")} />

      <nav className="flex gap-1 overflow-x-auto pb-px mb-6 -mx-1 px-1 scrollbar-hide" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const isDanger = tab.key === "danger";
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
        {activeTab === "general" && (
          <div className="space-y-8">
            <ProjectSettingsForm project={project} />
            <ProjectApiKey project={project} />
          </div>
        )}
        {activeTab === "integration" && (
          <ProjectIntegrationSnippets project={project} />
        )}
        {activeTab === "widget" && (
          <ProjectWidgetConfig project={project} />
        )}
        {activeTab === "danger" && (
          <ProjectDangerZone project={project} />
        )}
      </div>
    </div>
  );
}
