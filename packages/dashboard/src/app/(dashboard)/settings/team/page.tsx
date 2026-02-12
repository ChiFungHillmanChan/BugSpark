"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useManageableProjects } from "@/hooks/use-projects";
import {
  useTeamMembers,
  useInviteMember,
  useRemoveMember,
  useUpdateMemberRole,
} from "@/hooks/use-team";
import type { MemberRole, ProjectMember } from "@/types";
import { UserPlus, Trash2, Mail, Loader2 } from "lucide-react";

const ROLE_OPTIONS: MemberRole[] = ["viewer", "editor", "admin"];

function MemberRow({
  member,
  projectId,
  t,
}: {
  member: ProjectMember;
  projectId: string;
  t: ReturnType<typeof useTranslations<"team">>;
}) {
  const removeMutation = useRemoveMember(projectId);
  const updateRoleMutation = useUpdateMemberRole(projectId);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  function handleRoleChange(newRole: MemberRole) {
    updateRoleMutation.mutate({ memberId: member.id, role: newRole });
  }

  function handleRemove() {
    setIsConfirmOpen(true);
  }

  function confirmRemove() {
    removeMutation.mutate(member.id);
    setIsConfirmOpen(false);
  }

  const isPending = !member.inviteAcceptedAt;

  return (
    <tr className="border-t border-gray-200 dark:border-navy-700">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {member.displayName ?? member.email}
          </p>
          {member.displayName && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {member.email}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <select
          value={member.role}
          onChange={(e) => handleRoleChange(e.target.value as MemberRole)}
          disabled={updateRoleMutation.isPending}
          className="text-sm border border-gray-300 dark:border-navy-700 rounded-lg px-2 py-1 bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {t(role)}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        {isPending ? (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            <Mail className="w-3 h-3" />
            {t("pending")}
          </span>
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {member.inviteAcceptedAt && new Date(member.inviteAcceptedAt).toLocaleDateString()}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={handleRemove}
          disabled={removeMutation.isPending}
          className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
          title={t("remove")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <ConfirmDialog
          isOpen={isConfirmOpen}
          title={t("removeTitle")}
          message={t("removeConfirm")}
          confirmLabel={t("remove")}
          isDestructive
          onConfirm={confirmRemove}
          onCancel={() => setIsConfirmOpen(false)}
        />
      </td>
    </tr>
  );
}

export default function TeamSettingsPage() {
  const t = useTranslations("team");
  const { data: projects, isLoading: isLoadingProjects } = useManageableProjects();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("viewer");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { data: members, isLoading: isLoadingMembers } =
    useTeamMembers(selectedProjectId);
  const inviteMutation = useInviteMember(selectedProjectId);

  function handleInvite(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    inviteMutation.mutate(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: () => {
          setFeedback({ type: "success", message: t("inviteSent") });
          setInviteEmail("");
          setInviteRole("viewer");
          setIsInviting(false);
        },
        onError: () => {
          setFeedback({ type: "error", message: t("inviteFailed") });
        },
      },
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={t("title")} />
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t("description")}
      </p>

      <div className="mb-6">
        {isLoadingProjects ? (
          <div className="flex items-center gap-2 px-3 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-400">{t("selectProject")}</span>
          </div>
        ) : (
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setFeedback(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">{t("selectProject")}</option>
            {projects?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {!selectedProjectId ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
          {t("selectProject")}
        </p>
      ) : (
        <>
          {feedback && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                feedback.type === "success"
                  ? "bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">
              {t("title")}
            </h2>
            <button
              onClick={() => setIsInviting(!isInviting)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {t("inviteMember")}
            </button>
          </div>

          {isInviting && (
            <form
              onSubmit={handleInvite}
              className="mb-6 p-4 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg space-y-4"
            >
              <div>
                <label
                  htmlFor="invite-email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t("email")}
                </label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label
                  htmlFor="invite-role"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t("role")}
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as MemberRole)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {t(role)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {inviteMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {inviteMutation.isPending ? t("inviting") : t("invite")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsInviting(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-navy-700 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          )}

          {isLoadingMembers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : members && members.length > 0 ? (
            <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3 font-medium">{t("email")}</th>
                    <th className="px-4 py-3 font-medium">{t("role")}</th>
                    <th className="px-4 py-3 font-medium">{t("status")}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      projectId={selectedProjectId}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("noMembers")}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {t("noMembersHint")}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
