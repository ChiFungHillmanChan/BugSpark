"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface ApiKeyDisplayProps {
  apiKey: string;
  onRotate: () => void;
}

export function ApiKeyDisplay({ apiKey, onRotate }: ApiKeyDisplayProps) {
  const t = useTranslations("projects");
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const maskedKey = apiKey.slice(0, 8) + "..." + apiKey.slice(-4);

  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  }

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
        {t("apiKey")}
      </label>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 rounded-lg text-sm font-mono dark:text-white">
          {isRevealed ? apiKey : maskedKey}
        </code>
        <button
          onClick={() => setIsRevealed(!isRevealed)}
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-navy-700 rounded-lg"
          title={isRevealed ? "Hide" : "Reveal"}
        >
          {isRevealed ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={handleCopy}
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-navy-700 rounded-lg"
          title="Copy to clipboard"
        >
          {hasCopied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => setIsConfirmOpen(true)}
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-navy-700 rounded-lg"
          title="Rotate key"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={t("rotateApiKey")}
        message={t("rotateMessage")}
        confirmLabel={t("rotateConfirm")}
        isDestructive
        onConfirm={() => {
          onRotate();
          setIsConfirmOpen(false);
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
