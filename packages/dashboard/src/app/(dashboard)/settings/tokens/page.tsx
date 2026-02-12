"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useTokens, useCreateToken, useDeleteToken } from "@/hooks/use-tokens";
import { Key, Copy, Check, Trash2, Plus, Terminal } from "lucide-react";

const EXPIRY_OPTIONS = [
  { value: "", days: null },
  { value: "30", days: 30 },
  { value: "90", days: 90 },
  { value: "365", days: 365 },
] as const;

export default function TokensPage() {
  const t = useTranslations("tokens");
  const { data: tokens = [], isLoading } = useTokens();
  const createMutation = useCreateToken();
  const deleteMutation = useDeleteToken();

  // UI state
  const [showCreate, setShowCreate] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [expiresIn, setExpiresIn] = useState<string>("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    try {
      const body: { name: string; expiresInDays?: number } = {
        name: tokenName,
      };
      if (expiresIn) {
        body.expiresInDays = Number(expiresIn);
      }

      const result = await createMutation.mutateAsync(body);
      setNewToken(result.token);
      setShowCreate(false);
      setTokenName("");
      setExpiresIn("");
    } catch {
      setError(t("createFailed"));
    }
  }

  function handleRevoke(id: string) {
    setRevokeTarget(id);
  }

  async function confirmRevoke() {
    if (!revokeTarget) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(revokeTarget);
      setRevokeTarget(null);
    } catch {
      setError(t("revokeFailed"));
      setRevokeTarget(null);
    }
  }

  function handleCopy() {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={t("title")}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("createToken")}
          </button>
        }
      />

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t("description")}
      </p>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* CLI install hint */}
      <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg">
        <Terminal className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {t("installCli")}
          </p>
          <code className="text-xs text-gray-500 dark:text-gray-400">
            {t("installCliHint")}
          </code>
        </div>
      </div>

      {/* Newly created token banner */}
      {newToken && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-2">
            {t("tokenCreated")}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white dark:bg-navy-900 border border-emerald-200 dark:border-emerald-800 rounded px-3 py-2 font-mono text-gray-900 dark:text-gray-100 break-all select-all">
              {newToken}
            </code>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t("copied") : t("copyToken")}
            </button>
          </div>
          <button
            onClick={() => setNewToken(null)}
            className="mt-3 text-xs text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            {t("done")}
          </button>
        </div>
      )}

      {/* Create token modal */}
      {showCreate && (
        <div className="mb-6 p-4 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("tokenName")}
              </label>
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder={t("tokenNamePlaceholder")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("expiresIn")}
              </label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm bg-white dark:bg-navy-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.days === null
                      ? t("never")
                      : opt.days === 30
                        ? t("days30")
                        : opt.days === 90
                          ? t("days90")
                          : t("days365")}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setTokenName("");
                  setExpiresIn("");
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleCreate}
                disabled={!tokenName.trim() || createMutation.isPending}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {createMutation.isPending ? t("creating") : t("create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tokens list */}
      {isLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">{t("loading")}</div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Key className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium">{t("noTokens")}</p>
          <p className="text-xs mt-1">{t("noTokensHint")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between px-4 py-3 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Key className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {token.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-mono">{token.tokenPrefix}</span>
                    <span>
                      {t("lastUsed")}:{" "}
                      {token.lastUsedAt
                        ? new Date(token.lastUsedAt).toLocaleDateString()
                        : t("neverUsed")}
                    </span>
                    <span>
                      {t("expires")}:{" "}
                      {token.expiresAt
                        ? new Date(token.expiresAt).toLocaleDateString()
                        : t("neverExpires")}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRevoke(token.id)}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
                title={t("revoke")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={revokeTarget !== null}
        title={t("revokeTitle")}
        message={t("revokeConfirm")}
        confirmLabel={t("revoke")}
        isDestructive
        onConfirm={confirmRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
}
