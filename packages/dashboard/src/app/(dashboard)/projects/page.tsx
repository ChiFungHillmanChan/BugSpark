"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Plus, FolderKanban, X } from "lucide-react";
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
  const [projectDomains, setProjectDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [domainError, setDomainError] = useState("");
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

  function handleAddDomain() {
    const trimmed = domainInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setDomainError(t("domainInvalid"));
      return;
    }
    if (projectDomains.includes(trimmed)) {
      setDomainInput("");
      return;
    }
    setProjectDomains((prev) => [...prev, trimmed]);
    setDomainInput("");
    setDomainError("");
  }

  function handleRemoveDomain(index: number) {
    setProjectDomains((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!projectName.trim() || projectDomains.length === 0) return;
    setCreateError("");
    createProject.mutate(
      { name: projectName, domain: projectDomains.join(", ") },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setProjectName("");
          setProjectDomains([]);
          setDomainInput("");
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t("domainsHint")}</p>
                {projectDomains.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {projectDomains.map((d, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20"
                      >
                        {d}
                        <button
                          type="button"
                          onClick={() => handleRemoveDomain(i)}
                          className="hover:text-red-500 transition-colors"
                          aria-label={t("removeDomain")}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    id="project-domain"
                    type="text"
                    value={domainInput}
                    onChange={(e) => { setDomainInput(e.target.value); setDomainError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddDomain(); } }}
                    placeholder={t("domainPlaceholder")}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddDomain}
                    className="px-3 py-2 bg-gray-100 dark:bg-navy-700 hover:bg-gray-200 dark:hover:bg-navy-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t("addDomain")}
                  </button>
                </div>
                {domainError && (
                  <p className="text-xs text-red-500 mt-1">{domainError}</p>
                )}
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
