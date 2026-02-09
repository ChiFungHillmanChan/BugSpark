import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Project, ProjectWithSecret } from "@/types";

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: async (): Promise<Project[]> => {
      const response = await apiClient.get<Project[]>("/projects");
      return response.data;
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: async (): Promise<ProjectWithSecret> => {
      const response = await apiClient.get<ProjectWithSecret>(
        `/projects/${id}`,
      );
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      domain: string;
    }): Promise<ProjectWithSecret> => {
      const response = await apiClient.post<ProjectWithSecret>(
        "/projects",
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Project>;
    }): Promise<Project> => {
      const response = await apiClient.patch<Project>(
        `/projects/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.id),
      });
    },
  });
}
