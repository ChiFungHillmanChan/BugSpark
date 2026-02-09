import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Comment } from "@/types";

export function useComments(reportId: string) {
  return useQuery({
    queryKey: queryKeys.comments.list(reportId),
    queryFn: async (): Promise<Comment[]> => {
      const response = await apiClient.get<Comment[]>(
        `/reports/${reportId}/comments`,
      );
      return response.data;
    },
    enabled: !!reportId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      body,
    }: {
      reportId: string;
      body: string;
    }): Promise<Comment> => {
      const response = await apiClient.post<Comment>(
        `/reports/${reportId}/comments`,
        { body },
      );
      return response.data;
    },
    onMutate: async ({ reportId, body }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.comments.list(reportId),
      });

      const previousComments = queryClient.getQueryData<Comment[]>(
        queryKeys.comments.list(reportId),
      );

      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        reportId,
        authorId: "",
        authorName: "You",
        body,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Comment[]>(
        queryKeys.comments.list(reportId),
        (old) => [...(old ?? []), optimisticComment],
      );

      return { previousComments };
    },
    onError: (_err, { reportId }, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          queryKeys.comments.list(reportId),
          context.previousComments,
        );
      }
    },
    onSettled: (_data, _err, { reportId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.list(reportId),
      });
    },
  });
}
