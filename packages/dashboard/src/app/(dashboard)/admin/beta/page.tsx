"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import {
  useAdminBetaUsers,
  useAdminApproveBeta,
  useAdminRejectBeta,
  useAdminSettings,
  useAdminUpdateSettings,
} from "@/hooks/use-admin";
import { useRouter } from "next/navigation";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { Check, X, Search, Loader2, FlaskConical, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BetaUser, BetaStatusType } from "@/types";

const STATUS_TABS: Array<{ key: BetaStatusType | "all"; labelKey: string }> = [
  { key: "all", labelKey: "filterAll" },
  { key: "pending", labelKey: "pending" },
  { key: "approved", labelKey: "approved" },
  { key: "rejected", labelKey: "rejected" },
];

function BetaStatusBadge({ status }: { status: BetaStatusType }) {
  const t = useTranslations("beta");
  const styles: Record<BetaStatusType, string> = {
    none: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", styles[status])}>
      {t(status)}
    </span>
  );
}

function BetaUserRow({ user }: { user: BetaUser }) {
  const t = useTranslations("beta");
  const approveMutation = useAdminApproveBeta();
  const rejectMutation = useAdminRejectBeta();
  const isPending = user.betaStatus === "pending";

  return (
    <tr className="border-b border-gray-100 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <BetaStatusBadge status={user.betaStatus} />
      </td>
      <td className="px-4 py-3 max-w-xs">
        <p className="text-sm text-gray-600 dark:text-gray-300 truncate" title={user.betaReason ?? ""}>
          {user.betaReason || "—"}
        </p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {user.betaAppliedAt
          ? new Date(user.betaAppliedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "—"}
      </td>
      <td className="px-4 py-3">
        {isPending && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => approveMutation.mutate(user.id)}
              disabled={approveMutation.isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              {t("approve")}
            </button>
            <button
              onClick={() => rejectMutation.mutate(user.id)}
              disabled={rejectMutation.isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <X className="w-3 h-3" />
              )}
              {t("reject")}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function AdminBetaPage() {
  const t = useTranslations("beta");
  const tAdmin = useTranslations("admin");
  const tBugs = useTranslations("bugs");
  const { isSuperadmin, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BetaStatusType | "all">("pending");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: settingsData } = useAdminSettings();
  const updateSettingsMutation = useAdminUpdateSettings();

  const { data, isLoading } = useAdminBetaUsers({
    search: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    pageSize: 20,
  });

  useEffect(() => {
    if (!isAuthLoading && !isSuperadmin) {
      router.replace("/dashboard");
    }
  }, [isAuthLoading, isSuperadmin, router]);

  if (isAuthLoading || !isSuperadmin) {
    return null;
  }

  const betaModeEnabled = settingsData?.betaModeEnabled ?? true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("adminTitle")}
          </h1>
          {data && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t("totalCount", { count: data.total })}
            </span>
          )}
        </div>
      </div>

      {/* Beta Mode Toggle */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-navy-800/60 rounded-xl border border-gray-200 dark:border-white/[0.06]">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {t("betaModeLabel")}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {betaModeEnabled ? t("betaModeOnDesc") : t("betaModeOffDesc")}
          </p>
        </div>
        <button
          onClick={() =>
            updateSettingsMutation.mutate({ betaModeEnabled: !betaModeEnabled })
          }
          disabled={updateSettingsMutation.isPending}
          className="flex items-center gap-2 ml-4 shrink-0"
          aria-label={t("betaModeLabel")}
        >
          {updateSettingsMutation.isPending ? (
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          ) : betaModeEnabled ? (
            <ToggleRight className="w-10 h-10 text-accent" />
          ) : (
            <ToggleLeft className="w-10 h-10 text-gray-400" />
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg text-sm bg-white dark:bg-navy-900/60 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div className="flex gap-1 bg-gray-100 dark:bg-navy-900/60 rounded-lg p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                statusFilter === tab.key
                  ? "bg-white dark:bg-navy-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
              )}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-navy-800/60 rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">{tAdmin("loading")}</span>
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <FlaskConical className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">{t("emptyState")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-navy-900/40">
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                    {tAdmin("name")}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                    {tAdmin("status")}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                    {t("reason")}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                    {t("appliedAt")}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                    {tAdmin("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => (
                  <BetaUserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-white/[0.06]">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.04] rounded-lg disabled:opacity-30 transition-colors"
            >
              {tBugs("previous")}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {tBugs("pageOf", { page, total: Math.ceil(data.total / 20) })}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(data.total / 20)}
              className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.04] rounded-lg disabled:opacity-30 transition-colors"
            >
              {tBugs("next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
