"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { useProject } from "@/hooks/use-projects";
import { Skeleton } from "@/components/shared/skeleton-loader";
import { ProjectSettingsForm } from "./components/project-settings-form";
import { ProjectApiKey } from "./components/project-api-key";
import { ProjectIntegrationSnippets } from "./components/project-integration-snippets";
import { ProjectWidgetConfig } from "./components/project-widget-config";
import { ProjectDangerZone } from "./components/project-danger-zone";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("projects");
  const { data: project, isLoading } = useProject(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-xl" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-gray-500 dark:text-gray-400 text-center py-16">{t("notFound")}</p>;
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={t("projectSettings")} />
      <ProjectSettingsForm project={project} />
      <ProjectApiKey project={project} />
      <ProjectIntegrationSnippets project={project} />
      <ProjectWidgetConfig project={project} />
      <ProjectDangerZone project={project} />
    </div>
  );
}
