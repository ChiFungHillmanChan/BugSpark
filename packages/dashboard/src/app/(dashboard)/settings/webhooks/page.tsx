"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { useProjects } from "@/hooks/use-projects";
import { useWebhooks } from "@/hooks/use-webhooks";
import { Radio } from "lucide-react";
import { WebhookForm } from "../components/webhook-form";
import { WebhookList } from "../components/webhook-list";

export default function WebhooksPage() {
  const t = useTranslations("webhooks");
  const { data: projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const projectId = selectedProjectId || projects?.[0]?.id || "";
  const { data: webhooks, isLoading } = useWebhooks(projectId);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("loadingWebhooks")}</p>
          </div>
        )}

        {webhooks && webhooks.length > 0 && (
          <WebhookList webhooks={webhooks} projectId={projectId} />
        )}

        {!isLoading && webhooks?.length === 0 && !isFormOpen && (
          <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 p-6 text-center">
            <Radio className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t("noWebhooks")}
            </p>
          </div>
        )}

        {isFormOpen && (
          <WebhookForm
            projectId={projectId}
            onClose={() => setIsFormOpen(false)}
          />
        )}

        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-navy-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors"
          >
            <Radio className="w-4 h-4" />
            {t("addWebhook")}
          </button>
        )}
      </div>
    </div>
  );
}
