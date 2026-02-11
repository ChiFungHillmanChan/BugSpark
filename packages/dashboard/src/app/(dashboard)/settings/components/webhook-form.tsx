"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Radio } from "lucide-react";
import { useCreateWebhook } from "@/hooks/use-webhooks";
import { WEBHOOK_EVENTS } from "@/types";

interface WebhookFormProps {
  projectId: string;
  onClose: () => void;
}

export function WebhookForm({ projectId, onClose }: WebhookFormProps) {
  const t = useTranslations("webhooks");
  const createWebhook = useCreateWebhook();
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([...WEBHOOK_EVENTS]);

  function handleToggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!projectId || selectedEvents.length === 0) return;

    createWebhook.mutate(
      {
        projectId,
        data: { url, events: selectedEvents },
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  }

  const eventLabelMap: Record<string, string> = {
    "report.created": t("eventReportCreated"),
    "report.updated": t("eventReportUpdated"),
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 shadow-sm p-4 space-y-4"
    >
      <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
        <Radio className="w-4 h-4" />
        {t("addWebhook")}
      </h3>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
          {t("url")}
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("urlPlaceholder")}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
        />
      </div>
      <fieldset>
        <legend className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
          {t("events")}
        </legend>
        <div className="space-y-2">
          {WEBHOOK_EVENTS.map((event) => (
            <label key={event} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={selectedEvents.includes(event)}
                onChange={() => handleToggleEvent(event)}
                className="rounded border-gray-300 dark:border-navy-700 text-accent focus:ring-accent"
              />
              {eventLabelMap[event] ?? event}
            </label>
          ))}
        </div>
        {selectedEvents.length === 0 && (
          <p className="text-xs text-red-500 mt-1">{t("eventsRequired")}</p>
        )}
      </fieldset>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={createWebhook.isPending || selectedEvents.length === 0}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {createWebhook.isPending ? t("creating") : t("create")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-navy-700 dark:hover:bg-navy-700 dark:text-gray-300 rounded-lg text-sm font-medium"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
