"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Plus, FolderKanban } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonCard } from "@/components/shared/skeleton-loader";
import { useProjects, useCreateProject } from "@/hooks/use-projects";

export default function ProjectsPage() {
  const t = useTranslations("projects");
  const searchParams = useSearchParams();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDomain, setProjectDomain] = useState("");
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleEscKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setIsModalOpen(false);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener("keydown", handleEscKey);
      return () => document.removeEventListener("keydown", handleEscKey);
    }
  }, [isModalOpen, handleEscKey]);

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!projectName.trim() || !projectDomain.trim()) return;
    setCreateError("");
    createProject.mutate(
      { name: projectName, domain: projectDomain },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setProjectName("");
          setProjectDomain("");
        },
        onError: () => {
          setCreateError(t("createFailed"));
        },
      },
    );
  }

  return (
    <div>
      <PageHeader
        title={t("title")}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t("createProject")}
          </button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <EmptyState
          title={t("noProjects")}
          description={t("noProjectsDescription")}
          icon={<FolderKanban />}
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium"
            >
              {t("createProject")}
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-navy-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("createProject")}
            </h3>
            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("projectName")}
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
                  placeholder={t("projectNamePlaceholder")}
                />
              </div>
              <div>
                <label htmlFor="project-domain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("domain")}
                </label>
                <input
                  id="project-domain"
                  type="text"
                  value={projectDomain}
                  onChange={(e) => setProjectDomain(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
                  placeholder={t("domainPlaceholder")}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-navy-700 rounded-lg hover:bg-gray-200 dark:hover:bg-navy-600"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createProject.isPending}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {createProject.isPending ? t("creating") : t("create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
