"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileCode, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

type SnippetTab = "script" | "npm" | "react" | "vue" | "angular";

interface ProjectIntegrationSnippetsProps {
  project: Project;
}

const SNIPPET_CODE: Record<SnippetTab, string> = {
  script: `<script
  src="https://cdn.bugspark.dev/widget.js"
  data-project-key="\${BUGSPARK_PROJECT_KEY}"
  data-position="bottom-right"
  async
></script>`,
  npm: `import { BugSpark } from "@bugspark/widget";

BugSpark.init({
  projectKey: process.env.BUGSPARK_PROJECT_KEY,
  position: "bottom-right",
});`,
  react: `import { useEffect } from "react";
import { BugSpark } from "@bugspark/widget";

function App() {
  useEffect(() => {
    BugSpark.init({
      projectKey: process.env.BUGSPARK_PROJECT_KEY,
      position: "bottom-right",
    });
  }, []);

  return <div>{/* your app */}</div>;
}`,
  vue: `<script setup>
import { onMounted } from "vue";
import { BugSpark } from "@bugspark/widget";

onMounted(() => {
  BugSpark.init({
    projectKey: import.meta.env.VITE_BUGSPARK_PROJECT_KEY,
    position: "bottom-right",
  });
});
</script>`,
  angular: `import { Component, OnInit } from "@angular/core";
import { BugSpark } from "@bugspark/widget";
import { environment } from "../environments/environment";

@Component({ selector: "app-root", template: "<router-outlet />" })
export class AppComponent implements OnInit {
  ngOnInit() {
    BugSpark.init({
      projectKey: environment.bugsparkProjectKey,
      position: "bottom-right",
    });
  }
}`,
};

export function ProjectIntegrationSnippets({ project }: ProjectIntegrationSnippetsProps) {
  const t = useTranslations("projects");
  const [snippetTab, setSnippetTab] = useState<SnippetTab>("script");
  const [hasCopiedSnippet, setHasCopiedSnippet] = useState(false);
  const [hasCopiedEnv, setHasCopiedEnv] = useState(false);

  const SNIPPET_TABS = [
    { key: "script" as const, label: t("snippetScript") },
    { key: "npm" as const, label: t("snippetNpm") },
    { key: "react" as const, label: t("snippetReact") },
    { key: "vue" as const, label: t("snippetVue") },
    { key: "angular" as const, label: t("snippetAngular") },
  ];

  const maskedApiKey = project.apiKey.slice(0, 8) + "..." + project.apiKey.slice(-4);
  const envLineDisplay = `BUGSPARK_PROJECT_KEY=${maskedApiKey}`;
  const envLineCopy = `BUGSPARK_PROJECT_KEY=${project.apiKey}`;

  async function handleCopySnippet() {
    await navigator.clipboard.writeText(SNIPPET_CODE[snippetTab]);
    setHasCopiedSnippet(true);
    setTimeout(() => setHasCopiedSnippet(false), 2000);
  }

  async function handleCopyEnv() {
    await navigator.clipboard.writeText(envLineCopy);
    setHasCopiedEnv(true);
    setTimeout(() => setHasCopiedEnv(false), 2000);
  }

  return (
    <div className="border-t border-gray-200 dark:border-navy-700 pt-8 mb-8">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("integrationSnippet")}</h3>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <FileCode className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("snippetEnvStep")}
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between bg-navy-800 px-4 py-1.5 rounded-t-lg">
            <span className="text-xs text-gray-400 font-mono">.env</span>
            <button
              onClick={handleCopyEnv}
              className="p-1 rounded-md text-gray-400 hover:text-white transition-colors"
              aria-label="Copy env"
            >
              {hasCopiedEnv ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <pre className="bg-navy-900 rounded-b-lg p-4 overflow-x-auto">
            <code className="text-sm text-emerald-400 font-mono leading-relaxed">{envLineDisplay}</code>
          </pre>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          {t("snippetCodeStep")}
        </p>
        <div className="flex gap-1 mb-1 overflow-x-auto">
          {SNIPPET_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSnippetTab(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors whitespace-nowrap",
                snippetTab === tab.key
                  ? "bg-navy-900 text-white"
                  : "bg-gray-100 dark:bg-navy-800/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-navy-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <pre className="bg-navy-900 rounded-b-xl rounded-tr-xl p-4 overflow-x-auto">
            <code className="text-sm text-gray-300 font-mono leading-relaxed">{SNIPPET_CODE[snippetTab]}</code>
          </pre>
          <button
            onClick={handleCopySnippet}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-navy-700 text-gray-400 hover:text-white transition-opacity"
            aria-label="Copy snippet"
          >
            {hasCopiedSnippet ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
