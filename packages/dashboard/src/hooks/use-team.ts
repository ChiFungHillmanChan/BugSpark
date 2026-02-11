import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { MemberRole, ProjectMember } from "@/types";

export function useTeamMembers(projectId: string) {
  return useQuery({
    queryKey: queryKeys.team.members(projectId),
    queryFn: async (): Promise<ProjectMember[]> => {
      const response = await apiClient.get<ProjectMember[]>(
        `/projects/${projectId}/members`,
      );
      return response.data;
    },
    enabled: !!projectId,
  });
}

export function useInviteMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      role: MemberRole;
    }): Promise<ProjectMember> => {
      const response = await apiClient.post<ProjectMember>(
        `/projects/${projectId}/members`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.team.members(projectId),
      });
    },
  });
}

export function useUpdateMemberRole(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: MemberRole;
    }): Promise<ProjectMember> => {
      const response = await apiClient.patch<ProjectMember>(
        `/projects/${projectId}/members/${memberId}`,
        { role },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.team.members(projectId),
      });
    },
  });
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string): Promise<void> => {
      await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.team.members(projectId),
      });
    },
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (token: string): Promise<ProjectMember> => {
      const response = await apiClient.post<ProjectMember>(
        "/auth/accept-invite",
        { token },
      );
      return response.data;
    },
  });
}
