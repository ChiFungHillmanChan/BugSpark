"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SeverityBadge } from "@/components/bugs/severity-badge";
import { ScreenshotViewer } from "@/components/bug-detail/screenshot-viewer";
import { ConsoleLogViewer } from "@/components/bug-detail/console-log-viewer";
import { NetworkWaterfall } from "@/components/bug-detail/network-waterfall";
import { SessionTimeline } from "@/components/bug-detail/session-timeline";
import { MetadataPanel } from "@/components/bug-detail/metadata-panel";
import { CommentThread } from "@/components/bug-detail/comment-thread";
import { useBug, useUpdateBug } from "@/hooks/use-bugs";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/shared/skeleton-loader";
import type { Status, Severity } from "@/types";

type Tab = "console" | "network" | "session" | "device";

const TABS: { key: Tab; label: string }[] = [
  { key: "console", label: "Console Logs" },
  { key: "network", label: "Network" },
  { key: "session", label: "Session" },
  { key: "device", label: "Device Info" },
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
  const { data: bug, isLoading } = useBug(id);
  const updateBug = useUpdateBug();
  const [activeTab, setActiveTab] = useState<Tab>("console");

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
        <p className="text-gray-500">Bug report not found.</p>
        <Link href="/bugs" className="text-accent hover:underline text-sm mt-2 inline-block">
          Back to bugs
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
            <Link href="/bugs" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="font-mono text-xs text-gray-400">{bug.trackingId}</span>
            <SeverityBadge severity={bug.severity} />
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ScreenshotViewer
            screenshotUrl={bug.screenshotUrl}
            annotatedScreenshotUrl={bug.annotatedScreenshotUrl}
          />

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "text-accent border-accent"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  {tab.label}
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
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
              <select
                value={bug.status}
                onChange={(e) =>
                  updateBug.mutate({
                    id: bug.id,
                    data: { status: e.target.value as Status },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Severity</label>
              <select
                value={bug.severity}
                onChange={(e) =>
                  updateBug.mutate({
                    id: bug.id,
                    data: { severity: e.target.value as Severity },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {SEVERITY_OPTIONS.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Assignee</label>
              <p className="text-sm text-gray-900">{bug.assigneeId ? "Assigned" : "Unassigned"}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Created</label>
              <p className="text-sm text-gray-900">{formatDate(bug.createdAt)}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Reporter</label>
              <p className="text-sm text-gray-900">{bug.reporterIdentifier ?? "Anonymous"}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <CommentThread reportId={bug.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
