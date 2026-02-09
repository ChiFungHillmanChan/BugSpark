import type { BugFilters } from "@/types";

export const queryKeys = {
  bugs: {
    all: ["bugs"] as const,
    list: (filters: BugFilters) => ["bugs", "list", filters] as const,
    detail: (id: string) => ["bugs", "detail", id] as const,
  },
  projects: {
    all: ["projects"] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
  },
  comments: {
    list: (reportId: string) => ["comments", reportId] as const,
  },
  stats: {
    overview: ["stats", "overview"] as const,
    project: (id: string) => ["stats", "project", id] as const,
  },
};
