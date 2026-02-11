"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { useProjects } from "@/hooks/use-projects";
import { useIntegrations } from "@/hooks/use-integrations";
import { Github } from "lucide-react";
import { LinearIcon } from "@/components/shared/linear-icon";
import { GithubIntegrationForm } from "../components/github-integration-form";
import { LinearIntegrationForm } from "../components/linear-integration-form";
import { IntegrationList } from "../components/integration-list";

type FormProvider = "github" | "linear" | null;

export default function IntegrationsPage() {
  const t = useTranslations("integrations");
  const { data: projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const projectId = selectedProjectId || projects?.[0]?.id || "";
  const { data: integrations, isLoading } = useIntegrations(projectId);
  const [formProvider, setFormProvider] = useState<FormProvider>(null);

  if (!projectId) {
    return (
      <div className="max-w-xl">
        <PageHeader title={t("title")} />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("createProjectFirst")}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      {projects && projects.length > 1 && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("project")}
          </label>
          <select
            value={projectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-4">
        {isLoading && (
          <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("loadingIntegrations")}</p>
          </div>
        )}

        {integrations && integrations.length > 0 && (
          <IntegrationList integrations={integrations} projectId={projectId} />
        )}

        {!isLoading && integrations?.length === 0 && formProvider === null && (
          <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 p-6 text-center">
            <Github className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t("noIntegrations")}
            </p>
          </div>
        )}

        {formProvider === "github" && (
          <GithubIntegrationForm
            projectId={projectId}
            onClose={() => setFormProvider(null)}
          />
        )}

        {formProvider === "linear" && (
          <LinearIntegrationForm
            projectId={projectId}
            onClose={() => setFormProvider(null)}
          />
        )}

        {formProvider === null && (
          <div className="flex gap-2">
            <button
              onClick={() => setFormProvider("github")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-navy-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors"
            >
              <Github className="w-4 h-4" />
              {t("connectGithub")}
            </button>
            <button
              onClick={() => setFormProvider("linear")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-navy-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
            >
              <LinearIcon className="w-4 h-4" />
              {t("connectLinear")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
