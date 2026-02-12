"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { useAdminUsers, useAdminUpdateUser } from "@/hooks/use-admin";
import { useRouter } from "next/navigation";
import { PlanBadge } from "@/components/shared/plan-badge";
import { useDebouncedValue } from "@/hooks/use-debounce";
import type { AdminUser, UserRole, UserPlan } from "@/types";

const ROLES: UserRole[] = ["user", "admin", "superadmin"];
const PLANS: UserPlan[] = ["free", "starter", "team", "enterprise"];

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  user: "roleUser",
  admin: "roleAdmin",
  superadmin: "roleSuperadmin",
};

const PLAN_LABEL_KEYS: Record<UserPlan, string> = {
  free: "planFree",
  starter: "planStarter",
  team: "planTeam",
  enterprise: "planEnterprise",
};

function formatExpiresAt(expiresAt: string | null, t: ReturnType<typeof useTranslations>) {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: t("planExpired"), className: "text-red-500 dark:text-red-400" };
  }
  if (diffDays <= 7) {
    return { label: t("planExpiresIn", { days: diffDays }), className: "text-amber-500 dark:text-amber-400" };
  }
  return { label: t("planExpiresIn", { days: diffDays }), className: "text-gray-500 dark:text-gray-400" };
}

function UserRow({ user, currentUserId }: { user: AdminUser; currentUserId: string }) {
  const t = useTranslations("admin");
  const updateUser = useAdminUpdateUser();
  const isSelf = user.id === currentUserId;
  const [editingExpiry, setEditingExpiry] = useState(false);
  const [expiryValue, setExpiryValue] = useState(
    user.planExpiresAt ? new Date(user.planExpiresAt).toISOString().slice(0, 16) : ""
  );

  function handleRoleChange(role: string) {
    updateUser.mutate({ userId: user.id, data: { role } });
  }

  function handlePlanChange(plan: string) {
    updateUser.mutate({ userId: user.id, data: { plan } });
  }

  function handleToggleActive() {
    updateUser.mutate({ userId: user.id, data: { is_active: !user.isActive } });
  }

  function handleSaveExpiry() {
    const planExpiresAt = expiryValue ? new Date(expiryValue).toISOString() : null;
    updateUser.mutate(
      { userId: user.id, data: { plan_expires_at: planExpiresAt } },
      { onSuccess: () => setEditingExpiry(false) },
    );
  }

  function handleClearExpiry() {
    updateUser.mutate(
      { userId: user.id, data: { plan_expires_at: null } },
      {
        onSuccess: () => {
          setExpiryValue("");
          setEditingExpiry(false);
        },
      },
    );
  }

  const expiryInfo = formatExpiresAt(user.planExpiresAt, t);

  return (
    <tr className="border-b border-gray-100 dark:border-navy-700">
      <td className="py-3 px-4">
        <div>
          <p className="font-medium text-sm text-gray-900 dark:text-white">{user.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
      </td>
      <td className="py-3 px-4">
        <select
          value={user.role}
          onChange={(e) => handleRoleChange(e.target.value)}
          disabled={isSelf}
          className="text-sm border border-gray-200 dark:border-navy-600 rounded px-2 py-1 bg-white dark:bg-navy-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
        >
          {ROLES.map((role) => (
            <option key={role} value={role} className="bg-white dark:bg-navy-800 text-gray-900 dark:text-gray-100">
              {t(ROLE_LABEL_KEYS[role])}
            </option>
          ))}
        </select>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <PlanBadge plan={user.plan} role={user.role} />
            <select
              value={user.plan}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="text-sm border border-gray-200 dark:border-navy-600 rounded px-2 py-1 bg-white dark:bg-navy-800 text-gray-900 dark:text-gray-100"
            >
              {PLANS.map((plan) => (
                <option key={plan} value={plan} className="bg-white dark:bg-navy-800 text-gray-900 dark:text-gray-100">
                  {t(PLAN_LABEL_KEYS[plan])}
                </option>
              ))}
            </select>
          </div>

          {/* Subscription expiry display / editor */}
          {editingExpiry ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <input
                type="datetime-local"
                value={expiryValue}
                onChange={(e) => setExpiryValue(e.target.value)}
                className="text-xs border border-gray-200 dark:border-navy-600 rounded px-1.5 py-0.5 bg-white dark:bg-navy-800 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={handleSaveExpiry}
                className="text-xs px-2 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {t("save")}
              </button>
              <button
                onClick={handleClearExpiry}
                className="text-xs px-2 py-0.5 rounded text-red-600 dark:text-red-400 hover:underline"
              >
                {t("clearExpiry")}
              </button>
              <button
                onClick={() => setEditingExpiry(false)}
                className="text-xs px-2 py-0.5 rounded text-gray-500 dark:text-gray-400 hover:underline"
              >
                {t("cancel")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {expiryInfo ? (
                <span className={`text-[11px] ${expiryInfo.className}`}>
                  {expiryInfo.label}
                </span>
              ) : (
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{t("noExpiry")}</span>
              )}
              <button
                onClick={() => setEditingExpiry(true)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {t("editExpiry")}
              </button>
            </div>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
          <p>{t("usageProjects", { count: user.projectCount })}</p>
          <p>{t("usageReportsMonth", { count: user.reportCountMonth })}</p>
        </div>
      </td>
      <td className="py-3 px-4">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            user.isActive
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {user.isActive ? t("active") : t("deactivated")}
        </span>
      </td>
      <td className="py-3 px-4">
        {!isSelf && (
          <button
            onClick={handleToggleActive}
            className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {user.isActive ? t("deactivate") : t("activate")}
          </button>
        )}
      </td>
    </tr>
  );
}

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const { user: currentUser, isSuperadmin, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, isLoading } = useAdminUsers({
    search: debouncedSearch || undefined,
    page: 1,
    pageSize: 50,
  });

  useEffect(() => {
    if (!isAuthLoading && !isSuperadmin) {
      router.replace("/dashboard");
    }
  }, [isAuthLoading, isSuperadmin, router]);

  if (isAuthLoading || !isSuperadmin) {
    return null;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t("userManagement")}</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder={t("searchUsers")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
        />
      </div>

      <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-900">
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">
                {t("name")}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">
                {t("role")}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">
                {t("plan")}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">
                {t("usage")}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">
                {t("status")}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  {t("loading")}
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  {t("noUsersFound")}
                </td>
              </tr>
            ) : (
              data?.items.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  currentUserId={currentUser?.id ?? ""}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {t("totalUsersCount", { count: data.total })}
        </p>
      )}
    </div>
  );
}
