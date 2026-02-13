"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { SeverityBadge } from "@/components/bugs/severity-badge";
import { ScreenshotViewer } from "@/components/bug-detail/screenshot-viewer";
import { ConsoleLogViewer } from "@/components/bug-detail/console-log-viewer";
import { NetworkWaterfall } from "@/components/bug-detail/network-waterfall";
import { SessionTimeline } from "@/components/bug-detail/session-timeline";
import { MetadataPanel } from "@/components/bug-detail/metadata-panel";
import { ExportToTracker } from "@/components/bug-detail/export-to-tracker";
import { AiAnalysisPanel } from "@/components/bug-detail/ai-analysis-panel";
import { UserFlowDiagram } from "@/components/bug-detail/user-flow-diagram";
import { useBug, useUpdateBug, useDeleteBug } from "@/hooks/use-bugs";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/shared/skeleton-loader";
import type { Status, Severity } from "@/types";

type Tab = "console" | "network" | "session" | "device";

const TAB_KEYS: { key: Tab; labelKey: string }[] = [
  { key: "console", labelKey: "consoleLogs" },
  { key: "network", labelKey: "network" },
  { key: "session", labelKey: "session" },
  { key: "device", labelKey: "deviceInfo" },
];

const STATUS_OPTIONS: Status[] = [
  "new", "triaging", "in_progress", "resolved", "closed",
];

const SEVERITY_OPTIONS: Severity[] = ["critical", "high", "medium", "low"];

export default function BugDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("bugs");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: bug, isLoading } = useBug(id);
  const updateBug = useUpdateBug();
  const deleteBug = useDeleteBug();
  const [activeTab, setActiveTab] = useState<Tab>("console");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleDelete() {
    deleteBug.mutate(id, {
      onSuccess: () => router.push("/bugs"),
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!bug) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400">{t("notFound")}</p>
        <Link href="/bugs" className="text-accent hover:underline text-sm mt-2 inline-block">
          {t("backToBugs")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={bug.title}
        description={
          <span className="flex items-center gap-3">
            <Link href="/bugs" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{bug.trackingId}</span>
            <SeverityBadge severity={bug.severity} />
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 shadow-sm p-4">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t("description")}</h2>
            <p className={`text-sm ${bug.description ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-400 italic"}`}>
              {bug.description || t("noDescription")}
            </p>
          </div>

          <ScreenshotViewer
            screenshotUrl={bug.screenshotUrl}
            annotatedScreenshotUrl={bug.annotatedScreenshotUrl}
          />

          <UserFlowDiagram userActions={bug.userActions} />

          <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 shadow-sm">
            <div className="flex border-b border-gray-200 dark:border-navy-700">
              {TAB_KEYS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "text-accent border-accent"
                      : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>
            <div className="p-4">
              {activeTab === "console" && (
                <ConsoleLogViewer logs={bug.consoleLogs} />
              )}
              {activeTab === "network" && (
                <NetworkWaterfall requests={bug.networkLogs} />
              )}
              {activeTab === "session" && (
                <SessionTimeline events={bug.userActions} />
              )}
              {activeTab === "device" && (
                <MetadataPanel metadata={bug.metadata} />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 shadow-sm p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t("status")}</label>
              <select
                value={bug.status}
                onChange={(e) =>
                  updateBug.mutate({
                    id: bug.id,
                    data: { status: e.target.value as Status },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm dark:bg-navy-800 dark:text-white"
              >
                {STATUS_OPTIONS.map((status) => {
                  const statusKeyMap: Record<Status, string> = {
                    new: "statusNew",
                    triaging: "statusTriaging",
                    in_progress: "statusInProgress",
                    resolved: "statusResolved",
                    closed: "statusClosed",
                  };
                  return (
                    <option key={status} value={status}>
                      {t(statusKeyMap[status])}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t("severity")}</label>
              <select
                value={bug.severity}
                onChange={(e) =>
                  updateBug.mutate({
                    id: bug.id,
                    data: { severity: e.target.value as Severity },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm dark:bg-navy-800 dark:text-white"
              >
                {SEVERITY_OPTIONS.map((severity) => {
                  const severityKeyMap: Record<Severity, string> = {
                    critical: "severityCritical",
                    high: "severityHigh",
                    medium: "severityMedium",
                    low: "severityLow",
                  };
                  return (
                    <option key={severity} value={severity}>
                      {t(severityKeyMap[severity])}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t("assignee")}</label>
              <p className="text-sm text-gray-900 dark:text-white">{bug.assigneeId ? t("assigned") : t("unassigned")}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t("created")}</label>
              <p className="text-sm text-gray-900 dark:text-white">{formatDate(bug.createdAt)}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t("reporter")}</label>
              <p className="text-sm text-gray-900 dark:text-white">{bug.reporterIdentifier ?? t("anonymous")}</p>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-navy-700">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">{t("export")}</label>
              <ExportToTracker reportId={bug.id} />
            </div>

            {bug.status !== "resolved" && bug.status !== "closed" && (
              <div className="pt-3 border-t border-gray-100 dark:border-navy-700">
                <button
                  type="button"
                  onClick={() =>
                    updateBug.mutate({ id: bug.id, data: { status: "resolved" } })
                  }
                  disabled={updateBug.isPending}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors w-full justify-center disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t("markResolved")}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t("aiAnalysis")}
            </h3>
            <AiAnalysisPanel reportId={bug.id} />
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-lg border border-red-200 dark:border-red-900/50 shadow-sm p-4">
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">{t("dangerZone")}</h3>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full justify-center"
            >
              <Trash2 className="w-4 h-4" />
              {t("deleteBug")}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700 p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold dark:text-white mb-2">
              {t("deleteBug")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t("deleteBugConfirm")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-700"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteBug.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteBug.isPending ? tCommon("loading") : tCommon("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
