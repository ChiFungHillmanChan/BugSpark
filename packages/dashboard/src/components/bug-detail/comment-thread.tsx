"use client";

import { useState, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "@/lib/utils";
import { useComments, useAddComment } from "@/hooks/use-comments";

interface CommentThreadProps {
  reportId: string;
}

export function CommentThread({ reportId }: CommentThreadProps) {
  const t = useTranslations("bugs");
  const locale = useLocale();
  const { data: comments, isLoading } = useComments(reportId);
  const addComment = useAddComment();
  const [commentBody, setCommentBody] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!commentBody.trim()) return;

    addComment.mutate(
      { reportId, body: commentBody.trim() },
      { onSuccess: () => setCommentBody("") },
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{t("comments")}</h3>

      <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-3 bg-gray-200 dark:bg-navy-700 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-navy-700 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && comments?.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
            {t("noCommentsYet")}
          </p>
        )}

        {comments?.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-navy-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
              {comment.authorName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {comment.authorName}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(comment.createdAt, locale)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          placeholder={t("addComment")}
          rows={2}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm resize-none dark:bg-navy-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!commentBody.trim() || addComment.isPending}
          className="self-end px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {t("send")}
        </button>
      </form>
    </div>
  );
}
