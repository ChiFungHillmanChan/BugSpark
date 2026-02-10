"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { useProjects } from "@/hooks/use-projects";
import {
  useIntegrations,
  useCreateIntegration,
  useDeleteIntegration,
  useUpdateIntegration,
} from "@/hooks/use-integrations";
import { Github, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

type FormProvider = "github" | "linear" | null;

function LinearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor">
      <path d="M1.22541 61.5228c-.97401-1.6679-.97401-3.6327 0-5.3006L21.8654 20.0194c.974-1.6679 2.7752-2.6958 4.7232-2.6958h41.2796c1.948 0 3.7492 1.0279 4.7232 2.6958l20.64 36.2028c.974 1.6679.974 3.6327 0 5.3006l-20.64 36.2028c-.974 1.6679-2.7752 2.6958-4.7232 2.6958H26.5765c-1.948 0-3.7492-1.0279-4.7232-2.6958L1.22541 61.5228Z" />
    </svg>
  );
}

function ProviderIcon({ provider, className }: { provider: string; className?: string }) {
  if (provider === "linear") {
    return <LinearIcon className={className} />;
  }
  return <Github className={className} />;
}

function providerLabel(provider: string, t: ReturnType<typeof useTranslations<"integrations">>): string {
  if (provider === "linear") return t("linearIssues");
  return t("githubIssues");
}

export default function IntegrationsPage() {
  const t = useTranslations("integrations");
  const { data: projects } = useProjects();
  const projectId = projects?.[0]?.id ?? "";
  const { data: integrations, isLoading } = useIntegrations(projectId);
  const createIntegration = useCreateIntegration();
  const deleteIntegration = useDeleteIntegration();
  const updateIntegration = useUpdateIntegration();
  const [formProvider, setFormProvider] = useState<FormProvider>(null);

  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");

  const [linearApiKey, setLinearApiKey] = useState("");
  const [linearTeamId, setLinearTeamId] = useState("");

  function handleGithubSubmit(event: FormEvent) {
    event.preventDefault();
    if (!projectId) return;

    createIntegration.mutate(
      {
        projectId,
        data: {
          provider: "github",
          config: { token, owner, repo },
        },
      },
      {
        onSuccess: () => {
          setFormProvider(null);
          setOwner("");
          setRepo("");
          setToken("");
        },
      },
    );
  }

  function handleLinearSubmit(event: FormEvent) {
    event.preventDefault();
    if (!projectId) return;

    createIntegration.mutate(
      {
        projectId,
        data: {
          provider: "linear",
          config: { apiKey: linearApiKey, teamId: linearTeamId },
        },
      },
      {
        onSuccess: () => {
          setFormProvider(null);
          setLinearApiKey("");
          setLinearTeamId("");
        },
      },
    );
  }

  function handleDelete(integrationId: string) {
    if (!confirm(t("removeConfirm"))) return;
    deleteIntegration.mutate({ integrationId, projectId });
  }

  function handleToggle(integrationId: string, isCurrentlyActive: boolean) {
    updateIntegration.mutate({
      integrationId,
      projectId,
      data: { isActive: !isCurrentlyActive },
    });
  }

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

      <div className="space-y-4">
        {isLoading && (
          <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("loadingIntegrations")}</p>
          </div>
        )}

        {integrations?.map((integration) => (
          <div
            key={integration.id}
            className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 shadow-sm p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <ProviderIcon
                provider={integration.provider}
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {providerLabel(integration.provider, t)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {integration.isActive ? t("active") : t("inactive")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleToggle(integration.id, integration.isActive)
                }
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title={integration.isActive ? t("deactivate") : t("activate")}
              >
                {integration.isActive ? (
                  <ToggleRight className="w-5 h-5 text-green-500" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => handleDelete(integration.id)}
                className="text-gray-400 hover:text-red-500"
                title={t("remove")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {!isLoading && integrations?.length === 0 && formProvider === null && (
          <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 p-6 text-center">
            <Github className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t("noIntegrations")}
            </p>
          </div>
        )}

        {formProvider === "github" && (
          <form
            onSubmit={handleGithubSubmit}
            className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 shadow-sm p-4 space-y-4"
          >
            <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Github className="w-4 h-4" />
              {t("connectGithub")}
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                {t("repoOwner")}
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder={t("repoOwnerPlaceholder")}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                {t("repoName")}
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder={t("repoNamePlaceholder")}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                {t("personalAccessToken")}
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t("tokenPlaceholder")}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {t("tokenHint")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createIntegration.isPending}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {createIntegration.isPending ? t("connecting") : t("connect")}
              </button>
              <button
                type="button"
                onClick={() => setFormProvider(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-navy-700 dark:hover:bg-navy-700 dark:text-gray-300 rounded-lg text-sm font-medium"
              >
                {t("cancel")}
              </button>
            </div>
          </form>
        )}

        {formProvider === "linear" && (
          <form
            onSubmit={handleLinearSubmit}
            className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 shadow-sm p-4 space-y-4"
          >
            <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <LinearIcon className="w-4 h-4" />
              {t("connectLinear")}
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                {t("linearApiKey")}
              </label>
              <input
                type="password"
                value={linearApiKey}
                onChange={(e) => setLinearApiKey(e.target.value)}
                placeholder={t("linearApiKeyPlaceholder")}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {t("linearApiKeyHint")}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                {t("linearTeamId")}
              </label>
              <input
                type="text"
                value={linearTeamId}
                onChange={(e) => setLinearTeamId(e.target.value)}
                placeholder={t("linearTeamIdPlaceholder")}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createIntegration.isPending}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {createIntegration.isPending ? t("connecting") : t("connect")}
              </button>
              <button
                type="button"
                onClick={() => setFormProvider(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-navy-700 dark:hover:bg-navy-700 dark:text-gray-300 rounded-lg text-sm font-medium"
              >
                {t("cancel")}
              </button>
            </div>
          </form>
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
