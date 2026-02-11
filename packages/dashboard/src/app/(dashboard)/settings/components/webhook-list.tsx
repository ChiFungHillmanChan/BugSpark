"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useDeleteWebhook, useUpdateWebhook } from "@/hooks/use-webhooks";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import type { Webhook } from "@/types";

interface WebhookListProps {
  webhooks: Webhook[];
  projectId: string;
}

const EVENT_LABEL_KEYS: Record<string, string> = {
  "report.created": "eventReportCreated",
  "report.updated": "eventReportUpdated",
};

export function WebhookList({ webhooks, projectId }: WebhookListProps) {
  const t = useTranslations("webhooks");
  const deleteWebhook = useDeleteWebhook();
  const updateWebhook = useUpdateWebhook();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteWebhook.mutate({ webhookId: deleteTarget, projectId });
    setDeleteTarget(null);
  }

  function handleToggle(webhookId: string, isCurrentlyActive: boolean) {
    updateWebhook.mutate({
      webhookId,
      projectId,
      data: { isActive: !isCurrentlyActive },
    });
  }

  return (
    <>
      {webhooks.map((webhook) => (
        <div
          key={webhook.id}
          className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 shadow-sm p-4 flex items-center justify-between"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {webhook.url}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {webhook.events.map((event) => (
                <span
                  key={event}
                  className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-400"
                >
                  {t(EVENT_LABEL_KEYS[event] ?? event)}
                </span>
              ))}
              <span
                className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                  webhook.isActive
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-gray-100 dark:bg-navy-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {webhook.isActive ? t("active") : t("inactive")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button
              onClick={() => handleToggle(webhook.id, webhook.isActive)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title={webhook.isActive ? t("deactivate") : t("activate")}
            >
              {webhook.isActive ? (
                <ToggleRight className="w-5 h-5 text-green-500" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setDeleteTarget(webhook.id)}
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
