"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Github } from "lucide-react";
import { useCreateIntegration } from "@/hooks/use-integrations";

interface GithubIntegrationFormProps {
  projectId: string;
  onClose: () => void;
}

export function GithubIntegrationForm({ projectId, onClose }: GithubIntegrationFormProps) {
  const t = useTranslations("integrations");
  const createIntegration = useCreateIntegration();
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!projectId) return;

    createIntegration.mutate(
      {
        projectId,
        data: {
          provider: "github",
          config: { token, owner, repo },
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 shadow-sm p-4 space-y-4"
    >
      <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
        <Github className="w-4 h-4" />
        {t("connectGithub")}
      </h3>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
          {t("repoOwner")}
        </label>
        <input
          type="text"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder={t("repoOwnerPlaceholder")}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
          {t("repoName")}
        </label>
        <input
          type="text"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder={t("repoNamePlaceholder")}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
          {t("personalAccessToken")}
        </label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={t("tokenPlaceholder")}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {t("tokenHint")}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={createIntegration.isPending}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {createIntegration.isPending ? t("connecting") : t("connect")}
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
