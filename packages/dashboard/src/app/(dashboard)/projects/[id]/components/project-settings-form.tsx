"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { X, Plus } from "lucide-react";
import { useUpdateProject } from "@/hooks/use-projects";
import type { Project } from "@/types";

interface ProjectSettingsFormProps {
  project: Project;
}

export function ProjectSettingsForm({ project }: ProjectSettingsFormProps) {
  const t = useTranslations("projects");
  const updateProject = useUpdateProject();
  const [name, setName] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [domainError, setDomainError] = useState("");
  const [changesSaved, setChangesSaved] = useState(false);
  const [editingDomainIndex, setEditingDomainIndex] = useState<number | null>(null);
  const [editingDomainValue, setEditingDomainValue] = useState("");

  const hasSyncedRef = useRef(false);
  useEffect(() => {
    if (project && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      setName(project.name);
      const parsed = project.domain
        ? project.domain.split(",").map((d: string) => d.trim()).filter(Boolean)
        : [];
      setDomains(parsed);
    }
  }, [project]);

  function handleAddDomain() {
    const trimmed = domainInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setDomainError(t("domainInvalid"));
      return;
    }
    if (domains.includes(trimmed)) {
      setDomainInput("");
      return;
    }
    setDomains((prev) => [...prev, trimmed]);
    setDomainInput("");
    setDomainError("");
  }

  function handleRemoveDomain(index: number) {
    setDomains((prev) => prev.filter((_, i) => i !== index));
  }

  function handleStartEditDomain(index: number) {
    setEditingDomainIndex(index);
    setEditingDomainValue(domains[index]);
  }

  function handleFinishEditDomain() {
    if (editingDomainIndex === null) return;
    const trimmed = editingDomainValue.trim();
    if (trimmed && (trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
      setDomains((prev) => prev.map((d, i) => (i === editingDomainIndex ? trimmed : d)));
    }
    setEditingDomainIndex(null);
    setEditingDomainValue("");
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    updateProject.mutate(
      { id: project.id, data: { name, domain: domains.join(", ") } },
      {
        onSuccess: () => {
          hasSyncedRef.current = false;
          setChangesSaved(true);
          setTimeout(() => setChangesSaved(false), 3000);
        },
      },
    );
  }

  return (
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
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t("domainsHint")}</p>
        {domains.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {domains.map((d, i) =>
              editingDomainIndex === i ? (
                <input
                  key={i}
                  type="text"
                  value={editingDomainValue}
                  onChange={(e) => setEditingDomainValue(e.target.value)}
                  onBlur={handleFinishEditDomain}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleFinishEditDomain(); }
                    if (e.key === "Escape") { setEditingDomainIndex(null); setEditingDomainValue(""); }
                  }}
                  autoFocus
                  className="px-2.5 py-1 rounded-full text-xs font-medium border border-accent bg-white dark:bg-navy-800 text-accent focus:outline-none focus:ring-2 focus:ring-accent min-w-[180px]"
                />
              ) : (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20 cursor-default"
                  onDoubleClick={() => handleStartEditDomain(i)}
                  title="Double-click to edit"
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
              ),
            )}
          </div>
        )}
        <div className="flex gap-2">
          <input
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
      <button
        type="submit"
        disabled={updateProject.isPending}
        className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {updateProject.isPending ? t("creating") : t("saveChanges")}
      </button>
      {changesSaved && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 text-sm">
          {t("changesSaved")}
        </div>
      )}
    </form>
  );
}
