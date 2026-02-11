"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { ApiKeyDisplay } from "@/components/projects/api-key-display";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Project } from "@/types";

interface ProjectApiKeyProps {
  project: Project;
}

export function ProjectApiKey({ project }: ProjectApiKeyProps) {
  const t = useTranslations("projects");
  const queryClient = useQueryClient();
  const [showRotateSuccess, setShowRotateSuccess] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateError, setRotateError] = useState<string | null>(null);

  async function handleRotateKey() {
    setIsRotating(true);
    setRotateError(null);
    try {
      const response = await apiClient.post<Project>(`/projects/${project.id}/rotate-key`);
      queryClient.setQueryData(queryKeys.projects.detail(project.id), response.data);
      setShowRotateSuccess(true);
      setTimeout(() => setShowRotateSuccess(false), 30_000);
    } catch {
      setRotateError(t("rotateKeyFailed"));
    } finally {
      setIsRotating(false);
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-navy-700 pt-8 mb-8">
      <ApiKeyDisplay apiKey={project.apiKey} onRotate={handleRotateKey} isRotating={isRotating} />
      {rotateError && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm">
          {rotateError}
        </div>
      )}
      {showRotateSuccess && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 dark:border-amber-600/40 bg-amber-50 dark:bg-amber-950/40 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 text-sm text-amber-800 dark:text-amber-300">
            <p className="font-medium mb-1">{t("rotateSuccessTitle")}</p>
            <p>{t("rotateSuccessMessage")}</p>
          </div>
          <button
            onClick={() => setShowRotateSuccess(false)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 text-xs font-medium shrink-0"
          >
            {t("dismiss")}
          </button>
        </div>
      )}
    </div>
  );
}
