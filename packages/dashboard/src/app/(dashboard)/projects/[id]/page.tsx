"use client";

import { useState, useEffect, use, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ApiKeyDisplay } from "@/components/projects/api-key-display";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useProject, useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import { Skeleton } from "@/components/shared/skeleton-loader";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Project } from "@/types";

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
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [hasCopiedSnippet, setHasCopiedSnippet] = useState(false);
  const [widgetColor, setWidgetColor] = useState("#e94560");
  const [showWatermark, setShowWatermark] = useState(true);
  const [enableScreenshot, setEnableScreenshot] = useState(true);
  const [modalTitle, setModalTitle] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [colorSaved, setColorSaved] = useState(false);

  useEffect(() => {
    if (project && name === "") {
      setName(project.name);
      setDomain(project.domain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync once when project first loads
  }, [project]);

  useEffect(() => {
    if (project?.settings && typeof project.settings === "object") {
      const settings = project.settings as Record<string, unknown>;
      const savedColor = settings.widgetColor;
      if (typeof savedColor === "string") setWidgetColor(savedColor);
      if (typeof settings.showWatermark === "boolean") setShowWatermark(settings.showWatermark);
      if (typeof settings.enableScreenshot === "boolean") setEnableScreenshot(settings.enableScreenshot);
      if (typeof settings.modalTitle === "string") setModalTitle(settings.modalTitle);
      if (typeof settings.buttonText === "string") setButtonText(settings.buttonText);
    }
  }, [project]);

  function handleSave(event: FormEvent) {
    event.preventDefault();
    updateProject.mutate({ id, data: { name, domain } });
  }

  async function handleRotateKey() {
    const response = await apiClient.post<Project>(`/projects/${id}/rotate-key`);
    // The rotate endpoint returns the full (unhashed) API key.
    // Cache it so the user can see / copy / use the full key.
    queryClient.setQueryData(queryKeys.projects.detail(id), response.data);
  }

  async function handleDeactivate() {
    updateProject.mutate(
      { id, data: { isActive: false } },
      { onSuccess: () => setIsDeactivateOpen(false) },
    );
  }

  const deleteExpectedText = `delete project ${project?.name ?? ""}`;
  const isDeleteConfirmed = deleteConfirmText === deleteExpectedText;

  function handleDeleteProject() {
    if (!isDeleteConfirmed) return;
    deleteProject.mutate(id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        router.push("/projects");
      },
    });
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

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="rounded border-gray-300 dark:border-navy-600"
              />
              {t("showWatermark")}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{t("showWatermarkDesc")}</p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={enableScreenshot}
                onChange={(e) => setEnableScreenshot(e.target.checked)}
                className="rounded border-gray-300 dark:border-navy-600"
              />
              {t("enableScreenshot")}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{t("enableScreenshotDesc")}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("modalTitle")}</label>
            <input
              type="text"
              value={modalTitle}
              onChange={(e) => setModalTitle(e.target.value)}
              placeholder="Report a Bug"
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("modalTitleDesc")}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("buttonText")}</label>
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder=""
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("buttonTextDesc")}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              updateProject.mutate(
                {
                  id,
                  data: {
                    settings: {
                      ...((project?.settings as Record<string, unknown>) ?? {}),
                      widgetColor,
                      showWatermark,
                      enableScreenshot,
                      modalTitle: modalTitle || null,
                      buttonText: buttonText || null,
                    },
                  },
                },
                {
                  onSuccess: () => {
                    setColorSaved(true);
                    setTimeout(() => setColorSaved(false), 3000);
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

      <div className="border-t border-red-200 dark:border-red-900/50 pt-8 space-y-6">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">{t("dangerZone")}</h3>

        <div className="rounded-lg border border-red-200 dark:border-red-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("deactivateProject")}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("deactivateMessage")}</p>
            </div>
            <button
              onClick={() => setIsDeactivateOpen(true)}
              className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-sm font-medium shrink-0 ml-4"
            >
              {t("deactivateProject")}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 dark:border-red-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("deleteProject")}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("deleteMessage")}</p>
            </div>
            <button
              onClick={() => { setDeleteConfirmText(""); setIsDeleteOpen(true); }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shrink-0 ml-4"
            >
              {t("deleteProject")}
            </button>
          </div>
        </div>
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

      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-white dark:bg-navy-800 dark:border dark:border-white/[0.08] rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t("deleteProject")}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {t("deleteConfirmMessage")}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {t("deleteConfirmInstruction", { text: deleteExpectedText })}
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deleteExpectedText}
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-navy-900 dark:text-white mb-4 font-mono"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-navy-700 rounded-lg hover:bg-gray-200 dark:hover:bg-navy-600"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={!isDeleteConfirmed || deleteProject.isPending}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteProject.isPending ? t("deleting") : t("deleteProject")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
