"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import type { Project } from "@/types";

interface ProjectDangerZoneProps {
  project: Project;
}

export function ProjectDangerZone({ project }: ProjectDangerZoneProps) {
  const t = useTranslations("projects");
  const router = useRouter();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  function handleDeactivate() {
    updateProject.mutate(
      { id: project.id, data: { isActive: false } },
      { onSuccess: () => setIsDeactivateOpen(false) },
    );
  }

  const deleteExpectedText = `delete project ${project.name}`;
  const isDeleteConfirmed = deleteConfirmText === deleteExpectedText;

  function handleDeleteProject() {
    if (!isDeleteConfirmed) return;
    deleteProject.mutate(project.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        router.push("/projects");
      },
    });
  }

  return (
    <>
      <div className="space-y-6">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">{t("dangerZone")}</h3>

        <div className="rounded-lg border border-red-200 dark:border-red-900/50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("deactivateProject")}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("deactivateMessage")}</p>
            </div>
            <button
              onClick={() => setIsDeactivateOpen(true)}
              className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-sm font-medium shrink-0 w-full sm:w-auto"
            >
              {t("deactivateProject")}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 dark:border-red-900/50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("deleteProject")}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("deleteMessage")}</p>
            </div>
            <button
              onClick={() => { setDeleteConfirmText(""); setIsDeleteOpen(true); }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shrink-0 w-full sm:w-auto"
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
    </>
  );
}
