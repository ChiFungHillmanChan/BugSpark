"use client";

import { useState, use, type FormEvent } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ApiKeyDisplay } from "@/components/projects/api-key-display";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useProject, useUpdateProject } from "@/hooks/use-projects";
import { Skeleton } from "@/components/shared/skeleton-loader";
import { Copy, Check } from "lucide-react";
import apiClient from "@/lib/api-client";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project, isLoading, refetch } = useProject(id);
  const updateProject = useUpdateProject();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [hasCopiedSnippet, setHasCopiedSnippet] = useState(false);

  const hasNameLoaded = project && name === "";
  if (hasNameLoaded) {
    setName(project.name);
    setDomain(project.domain);
  }

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
    return <p className="text-gray-500 text-center py-16">Project not found.</p>;
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Project Settings" />

      <form onSubmit={handleSave} className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <button
          type="submit"
          disabled={updateProject.isPending}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {updateProject.isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <div className="border-t border-gray-200 pt-8 mb-8">
        <ApiKeyDisplay apiKey={project.apiKey} onRotate={handleRotateKey} />
      </div>

      <div className="border-t border-gray-200 pt-8 mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Integration Snippet</h3>
        <div className="relative">
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs font-mono overflow-x-auto">
            {snippetCode}
          </pre>
          <button
            onClick={handleCopySnippet}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded"
          >
            {hasCopiedSnippet ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="border-t border-red-200 pt-8">
        <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-500 mb-4">
          Deactivating this project will stop collecting new bug reports.
        </p>
        <button
          onClick={() => setIsDeactivateOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
        >
          Deactivate Project
        </button>
      </div>

      <ConfirmDialog
        isOpen={isDeactivateOpen}
        title="Deactivate Project"
        message="Are you sure? This will stop collecting bug reports for this project. You can reactivate later."
        confirmLabel="Deactivate"
        isDestructive
        onConfirm={handleDeactivate}
        onCancel={() => setIsDeactivateOpen(false)}
      />
    </div>
  );
}
