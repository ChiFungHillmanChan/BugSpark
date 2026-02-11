"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useDeleteIntegration, useUpdateIntegration } from "@/hooks/use-integrations";
import { Github, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { LinearIcon } from "@/components/shared/linear-icon";
import type { Integration } from "@/types";

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

interface IntegrationListProps {
  integrations: Integration[];
  projectId: string;
}

export function IntegrationList({ integrations, projectId }: IntegrationListProps) {
  const t = useTranslations("integrations");
  const deleteIntegration = useDeleteIntegration();
  const updateIntegration = useUpdateIntegration();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteIntegration.mutate({ integrationId: deleteTarget, projectId });
    setDeleteTarget(null);
  }

  function handleToggle(integrationId: string, isCurrentlyActive: boolean) {
    updateIntegration.mutate({
      integrationId,
      projectId,
      data: { isActive: !isCurrentlyActive },
    });
  }

  return (
    <>
      {integrations.map((integration) => (
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
              onClick={() => handleToggle(integration.id, integration.isActive)}
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
              onClick={() => setDeleteTarget(integration.id)}
              className="text-gray-400 hover:text-red-500"
              title={t("remove")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={t("removeTitle")}
        message={t("removeConfirm")}
        confirmLabel={t("remove")}
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
