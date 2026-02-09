"use client";

import { useState, type FormEvent } from "react";
import { formatDate } from "@/lib/utils";
import { useComments, useAddComment } from "@/hooks/use-comments";

interface CommentThreadProps {
  reportId: string;
}

export function CommentThread({ reportId }: CommentThreadProps) {
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
      <h3 className="text-sm font-medium text-gray-900 mb-4">Comments</h3>

      <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && comments?.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No comments yet. Be the first to comment.
          </p>
        )}

        {comments?.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
              {comment.authorName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {comment.authorName}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!commentBody.trim() || addComment.isPending}
          className="self-end px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
