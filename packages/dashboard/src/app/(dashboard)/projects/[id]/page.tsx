"use client";

import { useState, useEffect, use, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { ApiKeyDisplay } from "@/components/projects/api-key-display";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useProject, useUpdateProject } from "@/hooks/use-projects";
import { Skeleton } from "@/components/shared/skeleton-loader";
import { Copy, Check } from "lucide-react";
import apiClient from "@/lib/api-client";

const PRESET_COLORS = [
  "#e94560", // Default red
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f97316", // Orange
];

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("projects");
  const { data: project, isLoading, refetch } = useProject(id);
  const updateProject = useUpdateProject();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [hasCopiedSnippet, setHasCopiedSnippet] = useState(false);
  const [widgetColor, setWidgetColor] = useState("#e94560");
  const [colorSaved, setColorSaved] = useState(false);

  const hasNameLoaded = project && name === "";
  if (hasNameLoaded) {
    setName(project.name);
    setDomain(project.domain);
  }

  useEffect(() => {
    if (project?.settings && typeof project.settings === "object") {
      const saved = (project.settings as Record<string, unknown>).widgetColor;
      if (typeof saved === "string") setWidgetColor(saved);
    }
  }, [project]);

  function handleSave(event: FormEvent) {
    event.preventDefault();
    updateProject.mutate({ id, data: { name, domain } });
  }

  async function handleRotateKey() {
    await apiClient.post(`/projects/${id}/rotate-key`);
    refetch();
  }

  async function handleDeactivate() {
    updateProject.mutate(
      { id, data: { isActive: false } },
      { onSuccess: () => setIsDeactivateOpen(false) },
    );
  }

  const snippetCode = project
    ? `<script src="https://cdn.bugspark.io/widget.js" data-api-key="${project.apiKey}"></script>`
    : "";

  async function handleCopySnippet() {
    await navigator.clipboard.writeText(snippetCode);
    setHasCopiedSnippet(true);
    setTimeout(() => setHasCopiedSnippet(false), 2000);
  }

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

      <form onSubmit={handleSave} className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("projectName")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("domain")}</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={updateProject.isPending}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {updateProject.isPending ? t("creating") : t("saveChanges")}
        </button>
      </form>

      <div className="border-t border-gray-200 dark:border-navy-700 pt-8 mb-8">
        <ApiKeyDisplay apiKey={project.apiKey} onRotate={handleRotateKey} />
      </div>

      <div className="border-t border-gray-200 dark:border-navy-700 pt-8 mb-8">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("integrationSnippet")}</h3>
        <div className="relative">
          <pre className="bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 rounded-lg p-4 text-xs font-mono overflow-x-auto dark:text-white">
            {snippetCode}
          </pre>
          <button
            onClick={handleCopySnippet}
            className="absolute top-2 right-2 p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded"
          >
            {hasCopiedSnippet ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-navy-700 pt-8 mb-8">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("widgetAppearance")}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t("widgetColorDesc")}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("widgetColor")}</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setWidgetColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    widgetColor === color
                      ? "border-gray-900 dark:border-white scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <label className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-navy-600 flex items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-navy-500 transition-colors overflow-hidden">
                <input
                  type="color"
                  value={widgetColor}
                  onChange={(e) => setWidgetColor(e.target.value)}
                  className="opacity-0 absolute w-0 h-0"
                />
                <span className="text-xs text-gray-400">+</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("widgetPreview")}</label>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 rounded-lg">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors"
                style={{ backgroundColor: widgetColor }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{widgetColor}</span>
            </div>
          </div>

          {colorSaved && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 text-sm">
              {t("colorSaved")}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              updateProject.mutate(
                { id, data: { settings: { ...((project?.settings as Record<string, unknown>) ?? {}), widgetColor } } },
                {
                  onSuccess: () => {
                    setColorSaved(true);
                    setTimeout(() => setColorSaved(false), 3000);
                    refetch();
                  },
                },
              );
            }}
            disabled={updateProject.isPending}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {updateProject.isPending ? t("creating") : t("saveChanges")}
          </button>
        </div>
      </div>

      <div className="border-t border-red-200 pt-8">
        <h3 className="text-sm font-medium text-red-600 mb-2">{t("dangerZone")}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t("deactivateMessage")}
        </p>
        <button
          onClick={() => setIsDeactivateOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
        >
          {t("deactivateProject")}
        </button>
      </div>

      <ConfirmDialog
        isOpen={isDeactivateOpen}
        title={t("deactivateProject")}
        message={t("deactivateConfirm")}
        confirmLabel={t("deactivateProject")}
        isDestructive
        onConfirm={handleDeactivate}
        onCancel={() => setIsDeactivateOpen(false)}
      />
    </div>
  );
}
